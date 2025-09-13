import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/db"
import { Role } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== Role.STUDENT) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all active quizzes with enrollment and attempt status for this student
    const quizzes = await prisma.quiz.findMany({
      where: {
        isActive: true
      },
      include: {
        createdBy: {
          select: { name: true, email: true }
        },
        _count: {
          select: {
            questions: true,
            enrollments: true,
          }
        },
        enrollments: {
          where: { userId: session.user.id },
          select: { id: true }
        },
        attempts: {
          where: { userId: session.user.id },
          select: { id: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Transform the data to include enrollment and attempt status
    const transformedQuizzes = quizzes.map(quiz => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      code: quiz.code,
      materialUrl: quiz.materialUrl,
      timeLimit: quiz.timeLimit,
      isActive: quiz.isActive,
      createdBy: quiz.createdBy,
      _count: quiz._count,
      isEnrolled: quiz.enrollments.length > 0,
      hasAttempted: quiz.attempts.length > 0,
    }))

    return NextResponse.json(transformedQuizzes)
  } catch (error) {
    console.error("Error fetching available quizzes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
