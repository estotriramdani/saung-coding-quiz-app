import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { Role } from "@prisma/client"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const quizzes = await prisma.quiz.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        code: true,
        timeLimit: true,
        createdAt: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Add default status since it's not in DB yet
    const quizzesWithStatus = quizzes.map(quiz => ({
      ...quiz,
      status: "PUBLISHED" as const
    }))

    return NextResponse.json(quizzesWithStatus)
  } catch (error) {
    console.error("Error fetching quizzes:", error)
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    )
  }
}
