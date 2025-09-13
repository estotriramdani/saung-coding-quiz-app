import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { Role, QuestionType } from "@prisma/client"
import { z } from "zod"

const questionSchema = z.object({
  question: z.string().min(1),
  type: z.nativeEnum(QuestionType),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1),
  explanation: z.string().optional(),
  points: z.number().min(1),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user || (session.user.role !== Role.EDUCATOR && session.user.role !== Role.ADMIN)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if quiz exists and user has permission
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: { createdById: true }
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    if (session.user.role !== Role.ADMIN && quiz.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = questionSchema.parse(body)

    const question = await prisma.question.create({
      data: {
        question: validatedData.question,
        type: validatedData.type,
        options: validatedData.options ? validatedData.options : undefined,
        correctAnswer: validatedData.correctAnswer,
        explanation: validatedData.explanation,
        points: validatedData.points,
        quizId: id,
      }
    })

    return NextResponse.json(question)
  } catch (error) {
    console.error("Error creating question:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
