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

    const { searchParams } = new URL(request.url)
    const attemptId = searchParams.get('attemptId')

    if (!attemptId) {
      return NextResponse.json({ error: "Attempt ID is required" }, { status: 400 })
    }

    // Get the quiz attempt with all details
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
          }
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                question: true,
                type: true,
                options: true,
                correctAnswer: true,
                explanation: true,
                points: true,
              }
            }
          },
          orderBy: {
            question: {
              createdAt: "asc"
            }
          }
        }
      }
    })

    if (!attempt) {
      return NextResponse.json({ error: "Quiz attempt not found" }, { status: 404 })
    }

    // Verify this attempt belongs to the current user and quiz
    if (attempt.userId !== session.user.id || attempt.quizId !== params.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (!attempt.completedAt) {
      return NextResponse.json({ error: "Quiz not yet completed" }, { status: 400 })
    }

    return NextResponse.json(attempt)
  } catch (error) {
    console.error("Error fetching quiz result:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
