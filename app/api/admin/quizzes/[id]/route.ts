import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { Role } from "@prisma/client"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status } = await request.json()

    // For now, just return success since status field isn't in DB yet
    // In a real implementation, you would update the quiz status here
    
    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error("Error updating quiz:", error)
    return NextResponse.json(
      { error: "Failed to update quiz" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete quiz and related data
    await prisma.$transaction(async (tx) => {
      // Delete question answers first
      await tx.questionAnswer.deleteMany({
        where: { question: { quizId: params.id } },
      })

      // Delete quiz attempts
      await tx.quizAttempt.deleteMany({
        where: { quizId: params.id },
      })

      // Delete enrollments
      await tx.quizEnrollment.deleteMany({
        where: { quizId: params.id },
      })

      // Delete questions
      await tx.question.deleteMany({
        where: { quizId: params.id },
      })

      // Finally delete the quiz
      await tx.quiz.delete({
        where: { id: params.id },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting quiz:", error)
    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 }
    )
  }
}
