import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/db"
import { Role } from "@prisma/client"

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

    // Get quiz details to check maxAttempts
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: { maxAttempts: true }
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Check attempt count vs maxAttempts
    if (quiz.maxAttempts) {
      const attemptCount = await prisma.quizAttempt.count({
        where: {
          userId: session.user.id,
          quizId: id,
        }
      })

      if (attemptCount >= quiz.maxAttempts) {
        return NextResponse.json({ error: "Maximum attempts reached" }, { status: 403 })
      }
    }

    // Create new attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: session.user.id,
        quizId: id,
        startedAt: new Date(),
      }
    })

    return NextResponse.json(attempt)
  } catch (error) {
    console.error("Error starting quiz attempt:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
