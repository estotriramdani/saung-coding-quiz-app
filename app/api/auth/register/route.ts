import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/app/lib/db"
import { Role, EducatorStatus } from "@prisma/client"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum([Role.STUDENT, Role.EDUCATOR]),
  bio: z.string().optional(),
  qualification: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user data
    const userData: any = {
      email: validatedData.email,
      password: hashedPassword,
      name: validatedData.name,
      role: validatedData.role,
    }

    // Add educator specific fields
    if (validatedData.role === Role.EDUCATOR) {
      userData.educatorStatus = EducatorStatus.PENDING
      userData.bio = validatedData.bio
      userData.qualification = validatedData.qualification
    }

    // Create user
    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        educatorStatus: true,
      },
    })

    return NextResponse.json(
      { 
        message: "User created successfully",
        user,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.issues },
        { status: 400 }
      )
    }

    console.error("Registration error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
