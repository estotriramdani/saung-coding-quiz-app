import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/db"
import { Role, EducatorStatus } from "@prisma/client"
import { z } from "zod"

const approveSchema = z.object({
  status: z.enum([EducatorStatus.APPROVED, EducatorStatus.REJECTED]),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status } = approveSchema.parse(body);

    // Update educator status
    const updatedEducator = await prisma.user.update({
      where: {
        id,
        role: Role.EDUCATOR,
      },
      data: {
        educatorStatus: status,
      },
      select: {
        id: true,
        name: true,
        email: true,
        educatorStatus: true,
      },
    });

    return NextResponse.json({
      message: `Educator ${status.toLowerCase()} successfully`,
      educator: updatedEducator,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.issues },
        { status: 400 }
      );
    }

    console.error("Approve educator error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
