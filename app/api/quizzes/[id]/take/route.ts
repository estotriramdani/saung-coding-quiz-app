import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/db"
import { Role } from "@prisma/client"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user || session.user.role !== Role.STUDENT) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if student is enrolled
    const enrollment = await prisma.quizEnrollment.findUnique({
      where: {
        userId_quizId: {
          userId: session.user.id,
          quizId: id,
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: "You are not enrolled in this quiz" }, { status: 403 })
    }

    // Get quiz details first to check maxAttempts
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        timeLimit: true,
        maxAttempts: true,
        isActive: true,
      }
    })

    if (!quiz || !quiz.isActive) {
      return NextResponse.json({ error: "Quiz not found or not active" }, { status: 404 })
    }

    // Check existing attempts and validate against maxAttempts
    const existingAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId: session.user.id,
        quizId: id,
      }
    })

    if (quiz.maxAttempts && existingAttempts.length >= quiz.maxAttempts) {
      return NextResponse.json({ 
        error: `You have reached the maximum number of attempts (${quiz.maxAttempts}) for this quiz` 
      }, { status: 403 })
    }

    // Get quiz with questions (but don't include correct answers)
    const quizWithQuestions = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          select: {
            id: true,
            question: true,
            type: true,
            options: true,
            points: true,
          },
          orderBy: { createdAt: "asc" }
        }
      }
    })

    if (!quizWithQuestions) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    return NextResponse.json(quizWithQuestions)
  } catch (error) {
    console.error("Error fetching quiz for taking:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
