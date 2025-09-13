import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { Role } from "@prisma/client"
import { z } from "zod"

const enrollSchema = z.object({
  code: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== Role.STUDENT) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { code } = enrollSchema.parse(body)
    const userId = session.user.id

    // Find the quiz by code
    const quiz = await prisma.quiz.findUnique({
      where: { 
        code: code.toUpperCase(),
        isActive: true 
      },
      select: {
        id: true,
        title: true,
        description: true
      }
    })

    if (!quiz) {
      return NextResponse.json({ 
        error: "Quiz not found. Please check the code and try again." 
      }, { status: 404 })
    }

    // Check if student is already enrolled
    const existingEnrollment = await prisma.quizEnrollment.findUnique({
      where: {
        userId_quizId: {
          userId: userId,
          quizId: quiz.id
        }
      }
    })

    if (existingEnrollment) {
      return NextResponse.json({ 
        error: "You are already enrolled in this quiz.",
        quiz 
      }, { status: 400 })
    }

    // Create enrollment
    await prisma.quizEnrollment.create({
      data: {
        userId: userId,
        quizId: quiz.id
      }
    })

    return NextResponse.json({ 
      message: "Successfully enrolled in quiz",
      quiz 
    })
  } catch (error) {
    console.error("Error enrolling in quiz:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid data", 
        details: error.issues 
      }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
