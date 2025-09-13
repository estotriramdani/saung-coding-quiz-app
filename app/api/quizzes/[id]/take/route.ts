import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/db"
import { Role } from "@prisma/client"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== Role.STUDENT) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if student is enrolled
    const enrollment = await prisma.quizEnrollment.findUnique({
      where: {
        userId_quizId: {
          userId: session.user.id,
          quizId: params.id,
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: "You are not enrolled in this quiz" }, { status: 403 })
    }

    // Check if already attempted
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        userId: session.user.id,
        quizId: params.id,
      }
    })

    if (existingAttempt) {
      return NextResponse.json({ error: "You have already attempted this quiz" }, { status: 403 })
    }

    // Get quiz with questions (but don't include correct answers)
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
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

    if (!quiz || !quiz.isActive) {
      return NextResponse.json({ error: "Quiz not found or not active" }, { status: 404 })
    }

    return NextResponse.json(quiz)
  } catch (error) {
    console.error("Error fetching quiz for taking:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
