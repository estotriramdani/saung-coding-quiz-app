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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const { id, questionId } = await params
    const session = await auth()
    
    if (!session?.user || (session.user.role !== Role.EDUCATOR && session.user.role !== Role.ADMIN)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if question exists and user has permission
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { quiz: { select: { createdById: true } } }
    })

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    if (session.user.role !== Role.ADMIN && question.quiz.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = questionSchema.parse(body)

    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        question: validatedData.question,
        type: validatedData.type,
        options: validatedData.options ? validatedData.options : undefined,
        correctAnswer: validatedData.correctAnswer,
        explanation: validatedData.explanation,
        points: validatedData.points,
      }
    })

    return NextResponse.json(updatedQuestion)
  } catch (error) {
    console.error("Error updating question:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const { id, questionId } = await params
    const session = await auth()
    
    if (!session?.user || (session.user.role !== Role.EDUCATOR && session.user.role !== Role.ADMIN)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if question exists and user has permission
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { quiz: { select: { createdById: true } } }
    })

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    if (session.user.role !== Role.ADMIN && question.quiz.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete question and related answers
    await prisma.$transaction(async (tx) => {
      // Delete question answers first
      await tx.questionAnswer.deleteMany({
        where: { questionId }
      })

      // Delete the question
      await tx.question.delete({
        where: { id: questionId }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
