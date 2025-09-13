import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/db"
import { Role, QuestionType } from "@prisma/client"
import { z } from "zod"

const submitSchema = z.object({
  attemptId: z.string(),
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.string(),
  })),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user || session.user.role !== Role.STUDENT) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { attemptId, answers } = submitSchema.parse(body)

    // Verify the attempt belongs to this user and quiz
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: true
          }
        }
      }
    })

    if (!attempt || attempt.userId !== session.user.id || attempt.quizId !== id) {
      return NextResponse.json({ error: "Invalid attempt" }, { status: 403 })
    }

    if (attempt.completedAt) {
      return NextResponse.json({ error: "Quiz already submitted" }, { status: 400 })
    }

    // Calculate score
    let totalScore = 0
    let totalPossiblePoints = 0
    const questionAnswers = []

    for (const question of attempt.quiz.questions) {
      totalPossiblePoints += question.points
      const userAnswer = answers.find(a => a.questionId === question.id)
      
      if (userAnswer) {
        let isCorrect = false
        let points = 0

        // Check if answer is correct based on question type
        if (question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.TRUE_FALSE) {
          isCorrect = userAnswer.answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
        } else if (question.type === QuestionType.SHORT_ANSWER) {
          // For short answers, do a case-insensitive comparison
          isCorrect = userAnswer.answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
        }

        if (isCorrect) {
          points = question.points
          totalScore += points
        }

        questionAnswers.push({
          questionId: question.id,
          answer: userAnswer.answer,
          isCorrect,
          points,
        })
      } else {
        // No answer provided
        questionAnswers.push({
          questionId: question.id,
          answer: "",
          isCorrect: false,
          points: 0,
        })
      }
    }

    const completedAt = new Date()
    const timeSpent = Math.floor((completedAt.getTime() - attempt.startedAt.getTime()) / 1000)

    // Update attempt with completion details
    const updatedAttempt = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        completedAt,
        timeSpent,
        score: (totalScore / totalPossiblePoints) * 100,
        totalPoints: totalPossiblePoints,
        answers: {
          create: questionAnswers.map(qa => ({
            questionId: qa.questionId,
            answer: qa.answer,
            isCorrect: qa.isCorrect,
            points: qa.points,
          }))
        }
      },
      include: {
        answers: {
          include: {
            question: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      attempt: updatedAttempt,
      score: totalScore,
      totalPossiblePoints,
      percentage: (totalScore / totalPossiblePoints) * 100,
    })
  } catch (error) {
    console.error("Error submitting quiz:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
