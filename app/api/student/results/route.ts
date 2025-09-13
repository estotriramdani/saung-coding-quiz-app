import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { Role } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== Role.STUDENT) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get all quiz attempts for the student
    const results = await prisma.quizAttempt.findMany({
      where: { userId: userId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            description: true
          }
        }
      },
      orderBy: { startedAt: 'desc' }
    })

    // Transform the data to match the expected interface
    const formattedResults = results.map(attempt => ({
      id: attempt.id,
      score: attempt.score,
      totalPoints: attempt.totalPoints,
      timeSpent: attempt.timeSpent,
      startedAt: attempt.startedAt.toISOString(),
      completedAt: attempt.completedAt?.toISOString() || null,
      quiz: {
        id: attempt.quiz.id,
        title: attempt.quiz.title,
        description: attempt.quiz.description
      }
    }))

    return NextResponse.json(formattedResults)
  } catch (error) {
    console.error("Error fetching student results:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
