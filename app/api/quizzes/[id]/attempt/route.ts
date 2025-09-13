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

    // Check if already attempted
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        userId: session.user.id,
        quizId: id,
      }
    })

    if (existingAttempt) {
      return NextResponse.json({ error: "You have already attempted this quiz" }, { status: 403 })
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
