import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { Role, QuestionType } from "@prisma/client"
import { z } from "zod"

const createQuizSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  materialUrl: z.string().url().optional().or(z.literal("")),
  timeLimit: z.number().min(1).optional(),
  questions: z.array(z.object({
    question: z.string().min(1),
    type: z.nativeEnum(QuestionType),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().min(1),
    explanation: z.string().optional(),
    points: z.number().min(1).default(1),
  })).optional(), // Make questions optional
})

function generateQuizCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || (session.user.role !== Role.EDUCATOR && session.user.role !== Role.ADMIN)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createQuizSchema.parse(body)

    // Generate unique quiz code
    let code = generateQuizCode()
    let existingQuiz = await prisma.quiz.findUnique({ where: { code } })
    
    while (existingQuiz) {
      code = generateQuizCode()
      existingQuiz = await prisma.quiz.findUnique({ where: { code } })
    }

    // Create quiz with or without questions
    const quizData: any = {
      title: validatedData.title,
      description: validatedData.description,
      materialUrl: validatedData.materialUrl || null,
      timeLimit: validatedData.timeLimit,
      code,
      createdById: session.user.id,
    }

    // Add questions if provided
    if (validatedData.questions && validatedData.questions.length > 0) {
      quizData.questions = {
        create: validatedData.questions.map(question => ({
          question: question.question,
          type: question.type,
          options: question.options || null,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          points: question.points,
        }))
      }
    }

    const quiz = await prisma.quiz.create({
      data: quizData,
      include: {
        questions: true,
        _count: {
          select: {
            questions: true,
            attempts: true,
            enrollments: true,
          }
        }
      }
    })

    return NextResponse.json(quiz)
  } catch (error) {
    console.error("Error creating quiz:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const createdBy = searchParams.get("createdBy")

    let whereClause = {}

    // Filter by creator if specified and user has permission
    if (createdBy && (session.user.role === Role.ADMIN || session.user.id === createdBy)) {
      whereClause = { createdById: createdBy }
    } else if (session.user.role === Role.EDUCATOR) {
      // Educators can only see their own quizzes
      whereClause = { createdById: session.user.id }
    }
    // Admins can see all quizzes (no additional filter)

    const quizzes = await prisma.quiz.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
            enrollments: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(quizzes)
  } catch (error) {
    console.error("Error fetching quizzes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
