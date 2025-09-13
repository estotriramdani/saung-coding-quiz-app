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

    // Get total enrollments
    const totalEnrollments = await prisma.quizEnrollment.count({
      where: { userId: userId }
    })

    // Get completed quizzes (quizzes with attempts)
    const completedQuizzes = await prisma.quizAttempt.count({
      where: { userId: userId }
    })

    // Get average score from all attempts
    const attemptScores = await prisma.quizAttempt.findMany({
      where: { userId: userId },
      select: {
        score: true,
        totalPoints: true
      }
    })

    let averageScore = 0
    if (attemptScores.length > 0) {
      const totalPercentage = attemptScores.reduce((acc, attempt) => {
        if (attempt.score !== null && attempt.totalPoints && attempt.totalPoints > 0) {
          const percentage = (attempt.score / attempt.totalPoints) * 100
          return acc + percentage
        }
        return acc
      }, 0)
      
      const validAttempts = attemptScores.filter(attempt => 
        attempt.score !== null && attempt.totalPoints && attempt.totalPoints > 0
      ).length
      
      averageScore = validAttempts > 0 ? totalPercentage / validAttempts : 0
    }

    // Get total time spent (sum of all attempt durations)
    const totalTimeSpent = await prisma.quizAttempt.aggregate({
      where: { userId: userId },
      _sum: {
        timeSpent: true
      }
    })

    const stats = {
      totalEnrollments,
      completedQuizzes,
      averageScore: isNaN(averageScore) ? 0 : averageScore,
      totalTimeSpent: totalTimeSpent._sum?.timeSpent || 0
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching student stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
