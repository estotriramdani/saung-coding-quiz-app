import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { Role } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30d"

    // Calculate date range
    const now = new Date()
    const daysBack = period === "7d" ? 7 : period === "30d" ? 30 : 90
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    // Get user statistics
    const totalUsers = await prisma.user.count()
    const totalEducators = await prisma.user.count({
      where: { role: Role.EDUCATOR }
    })
    const totalStudents = await prisma.user.count({
      where: { role: Role.STUDENT }
    })
    const pendingEducators = await prisma.user.count({
      where: { 
        role: Role.EDUCATOR,
        educatorStatus: "PENDING"
      }
    })

    // Get quiz statistics
    const totalQuizzes = await prisma.quiz.count()
    const publishedQuizzes = await prisma.quiz.count({
      where: { isActive: true }
    })
    const totalQuestions = await prisma.question.count()
    const totalAttempts = await prisma.quizAttempt.count()
    const totalEnrollments = await prisma.quizEnrollment.count()

    // Calculate average score
    const attemptScores = await prisma.quizAttempt.findMany({
      where: {
        completedAt: { not: null },
        score: { not: null }
      },
      select: { score: true, totalPoints: true }
    })

    const averageScore = attemptScores.length > 0
      ? attemptScores.reduce((sum, attempt) => {
          const percentage = attempt.totalPoints && attempt.totalPoints > 0
            ? (attempt.score! / attempt.totalPoints) * 100
            : 0
          return sum + percentage
        }, 0) / attemptScores.length
      : 0

    // Get recent activity
    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: startDate } }
    })
    const newQuizzes = await prisma.quiz.count({
      where: { createdAt: { gte: startDate } }
    })
    const newAttempts = await prisma.quizAttempt.count({
      where: { startedAt: { gte: startDate } }
    })

    // Get top performing quizzes
    const topQuizzes = await prisma.quiz.findMany({
      take: 10,
      select: {
        id: true,
        title: true,
        createdBy: {
          select: { name: true, email: true }
        },
        _count: {
          select: { attempts: true }
        },
        attempts: {
          where: {
            completedAt: { not: null },
            score: { not: null }
          },
          select: { score: true, totalPoints: true }
        }
      },
      orderBy: {
        attempts: {
          _count: "desc"
        }
      }
    })

    const topQuizzesWithScores = topQuizzes.map(quiz => {
      const attempts = quiz.attempts
      const averageScore = attempts.length > 0
        ? attempts.reduce((sum, attempt) => {
            const percentage = attempt.totalPoints && attempt.totalPoints > 0
              ? (attempt.score! / attempt.totalPoints) * 100
              : 0
            return sum + percentage
          }, 0) / attempts.length
        : 0

      return {
        id: quiz.id,
        title: quiz.title,
        creator: quiz.createdBy.name || quiz.createdBy.email,
        attempts: quiz._count.attempts,
        averageScore
      }
    })

    // Get user growth data (simplified)
    const userGrowth = []
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))

      const usersCount = await prisma.user.count({
        where: { createdAt: { lte: dayEnd } }
      })
      const educatorsCount = await prisma.user.count({
        where: { 
          role: Role.EDUCATOR,
          createdAt: { lte: dayEnd }
        }
      })
      const studentsCount = await prisma.user.count({
        where: { 
          role: Role.STUDENT,
          createdAt: { lte: dayEnd }
        }
      })

      userGrowth.push({
        date: dayStart.toISOString().split('T')[0],
        users: usersCount,
        educators: educatorsCount,
        students: studentsCount
      })
    }

    const reportData = {
      totalUsers,
      totalEducators,
      totalStudents,
      pendingEducators,
      totalQuizzes,
      publishedQuizzes,
      totalQuestions,
      totalAttempts,
      totalEnrollments,
      averageScore,
      recentActivity: {
        newUsers,
        newQuizzes,
        newAttempts
      },
      topQuizzes: topQuizzesWithScores,
      userGrowth
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error("Error generating reports:", error)
    return NextResponse.json(
      { error: "Failed to generate reports" },
      { status: 500 }
    )
  }
}
