import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { Role } from "@prisma/client"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { createdAt: "asc" }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
            enrollments: true,
          }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === Role.EDUCATOR && quiz.createdById !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json(quiz)
  } catch (error) {
    console.error("Error fetching quiz:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user || (session.user.role !== Role.EDUCATOR && session.user.role !== Role.ADMIN)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: { createdById: true }
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === Role.EDUCATOR && quiz.createdById !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    
    const updatedQuiz = await prisma.quiz.update({
      where: { id },
      data: body,
      include: {
        questions: true,
        _count: {
          select: {
            questions: true,
            attempts: true,
            enrollments: true,
          }
        }
      }
    })

    return NextResponse.json(updatedQuiz)
  } catch (error) {
    console.error("Error updating quiz:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user || (session.user.role !== Role.EDUCATOR && session.user.role !== Role.ADMIN)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: { createdById: true }
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === Role.EDUCATOR && quiz.createdById !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete quiz and all related data
    await prisma.$transaction(async (tx) => {
      // Delete question answers first
      await tx.questionAnswer.deleteMany({
        where: { question: { quizId: id } }
      })

      // Delete quiz attempts
      await tx.quizAttempt.deleteMany({
        where: { quizId: id }
      })

      // Delete enrollments
      await tx.quizEnrollment.deleteMany({
        where: { quizId: id }
      })

      // Delete questions
      await tx.question.deleteMany({
        where: { quizId: id }
      })

      // Finally delete the quiz
      await tx.quiz.delete({
        where: { id }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting quiz:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
