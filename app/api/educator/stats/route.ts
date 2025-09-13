import { NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { Role } from "@prisma/client"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== Role.EDUCATOR) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if educator is approved
    const educator = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { educatorStatus: true }
    })

    if (educator?.educatorStatus !== "APPROVED") {
      return NextResponse.json({ error: "Educator not approved" }, { status: 403 })
    }

    // Get educator's quiz statistics
    const totalQuizzes = await prisma.quiz.count({
      where: { createdById: session.user.id }
    })

    // Get total enrolled students across all educator's quizzes
    const totalStudents = await prisma.quizEnrollment.count({
      where: {
        quiz: { createdById: session.user.id }
      }
    })

    // Get total attempts on educator's quizzes
    const totalAttempts = await prisma.quizAttempt.count({
      where: {
        quiz: { createdById: session.user.id }
      }
    })

    // Calculate average score across all attempts on educator's quizzes
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quiz: { createdById: session.user.id },
        completedAt: { not: null },
        score: { not: null },
        totalPoints: { not: null }
      },
      select: {
        score: true,
        totalPoints: true
      }
    })

    const averageScore = attempts.length > 0
      ? attempts.reduce((sum, attempt) => {
          const percentage = attempt.totalPoints && attempt.totalPoints > 0
            ? (attempt.score! / attempt.totalPoints) * 100
            : 0
          return sum + percentage
        }, 0) / attempts.length
      : 0

    const stats = {
      totalQuizzes,
      totalStudents,
      totalAttempts,
      averageScore
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching educator stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch educator stats" },
      { status: 500 }
    )
  }
}
