import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/db"
import { Role, EducatorStatus } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get dashboard statistics
    const [
      totalUsers,
      totalStudents,
      totalEducators,
      pendingEducators,
      totalQuizzes,
      totalAttempts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.STUDENT } }),
      prisma.user.count({ where: { role: Role.EDUCATOR } }),
      prisma.user.count({ 
        where: { 
          role: Role.EDUCATOR,
          educatorStatus: EducatorStatus.PENDING 
        } 
      }),
      prisma.quiz.count(),
      prisma.quizAttempt.count(),
    ])

    const stats = {
      totalUsers,
      totalStudents,
      totalEducators,
      pendingEducators,
      totalQuizzes,
      totalAttempts,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
