import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/db"
import { Role } from "@prisma/client"
import { z } from "zod"

const enrollSchema = z.object({
  code: z.string().min(1, "Quiz code is required"),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== Role.STUDENT) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { code } = enrollSchema.parse(body)

    // Find the quiz by code
    const quiz = await prisma.quiz.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        enrollments: {
          where: { userId: session.user.id }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found with this code" }, { status: 404 })
    }

    if (!quiz.isActive) {
      return NextResponse.json({ error: "This quiz is not currently active" }, { status: 400 })
    }

    // Check if already enrolled
    if (quiz.enrollments.length > 0) {
      return NextResponse.json({ error: "You are already enrolled in this quiz" }, { status: 400 })
    }

    // Create enrollment
    const enrollment = await prisma.quizEnrollment.create({
      data: {
        userId: session.user.id,
        quizId: quiz.id,
      }
    })

    return NextResponse.json({ 
      message: "Successfully enrolled in quiz",
      enrollment,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
      }
    })
  } catch (error) {
    console.error("Error enrolling in quiz:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
