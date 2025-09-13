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

    // Get recent quiz attempts with quiz details
    const recentQuizzes = await prisma.quizAttempt.findMany({
      where: { userId: userId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            maxAttempts: true
          }
        }
      },
      orderBy: { startedAt: 'desc' },
      take: 10
    })

    // Get attempt counts for each quiz
    const quizAttemptCounts = await Promise.all(
      recentQuizzes.map(async (attempt) => {
        const count = await prisma.quizAttempt.count({
          where: {
            userId: userId,
            quizId: attempt.quiz.id
          }
        })
        return {
          quizId: attempt.quiz.id,
          attemptCount: count
        }
      })
    )

    const attemptCountMap = quizAttemptCounts.reduce((acc, item) => {
      acc[item.quizId] = item.attemptCount
      return acc
    }, {} as Record<string, number>)

    // Transform the data to match the expected interface
    const formattedQuizzes = recentQuizzes.map(attempt => ({
      id: attempt.id, // Use attempt ID for uniqueness
      quizId: attempt.quiz.id, // Keep quiz ID for navigation
      title: attempt.quiz.title,
      score: attempt.score,
      completedAt: attempt.completedAt?.toISOString() || null,
      totalPoints: attempt.totalPoints,
      maxAttempts: attempt.quiz.maxAttempts,
      attemptCount: attemptCountMap[attempt.quiz.id] || 0,
      canRetake: !attempt.quiz.maxAttempts || (attemptCountMap[attempt.quiz.id] || 0) < attempt.quiz.maxAttempts
    }))

    // Also get enrolled quizzes that haven't been attempted yet
    const enrolledButNotAttempted = await prisma.quizEnrollment.findMany({
      where: {
        userId: userId,
        quiz: {
          attempts: {
            none: {
              userId: userId
            }
          }
        }
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            maxAttempts: true
          }
        }
      },
      orderBy: { enrolledAt: 'desc' },
      take: 5
    })

    // Add unattempted quizzes to the list
    const unattemptedQuizzes = enrolledButNotAttempted.map(enrollment => ({
      id: `enrollment-${enrollment.id}`, // Use enrollment ID for uniqueness
      quizId: enrollment.quiz.id, // Keep quiz ID for navigation
      title: enrollment.quiz.title,
      score: null,
      completedAt: null,
      totalPoints: null,
      maxAttempts: enrollment.quiz.maxAttempts,
      attemptCount: 0,
      canRetake: true
    }))

    // Combine and limit to 10 total
    const allQuizzes = [...formattedQuizzes, ...unattemptedQuizzes].slice(0, 10)

    return NextResponse.json(allQuizzes)
  } catch (error) {
    console.error("Error fetching recent quizzes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
