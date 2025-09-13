import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { Role, QuestionType } from "@prisma/client"
import { z } from "zod"

const questionImportSchema = z.object({
  question: z.string().min(1),
  type: z.nativeEnum(QuestionType),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1),
  explanation: z.string().optional(),
  points: z.number().min(1),
})

const questionsArraySchema = z.array(questionImportSchema)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user || (session.user.role !== Role.EDUCATOR && session.user.role !== Role.ADMIN)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if quiz exists and user has permission
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: { createdById: true }
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    if (session.user.role !== Role.ADMIN && quiz.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { questions } = body

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({ 
        error: "Invalid format. Expected 'questions' array in request body" 
      }, { status: 400 })
    }

    // Validate all questions
    const validatedQuestions = questionsArraySchema.parse(questions)

    // Create all questions in a transaction
    const createdQuestions = await prisma.$transaction(async (tx) => {
      const results = []
      for (const questionData of validatedQuestions) {
        const question = await tx.question.create({
          data: {
            question: questionData.question,
            type: questionData.type,
            options: questionData.options ? questionData.options : undefined,
            correctAnswer: questionData.correctAnswer,
            explanation: questionData.explanation,
            points: questionData.points,
            quizId: id,
          }
        })
        results.push(question)
      }
      return results
    })

    return NextResponse.json({ 
      message: `Successfully imported ${createdQuestions.length} questions`,
      questions: createdQuestions 
    })
  } catch (error) {
    console.error("Error importing questions:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid question data", 
        details: error.issues 
      }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
