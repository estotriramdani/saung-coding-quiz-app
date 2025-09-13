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

    const pendingEducators = await prisma.user.findMany({
      where: {
        role: Role.EDUCATOR,
        educatorStatus: EducatorStatus.PENDING,
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        qualification: true,
        educatorStatus: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    return NextResponse.json(pendingEducators)
  } catch (error) {
    console.error("Get pending educators error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
