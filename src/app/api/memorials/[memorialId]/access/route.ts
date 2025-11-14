import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserMemorialRole } from "@/lib/permissions";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

/**
 * GET /api/memorials/[memorialId]/access
 * Get user's access level (role) for a specific memorial
 */
export async function GET(request: Request, { params }: { params: { memorialId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const memorialId = params.memorialId;

    // Check if memorial exists
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: {
        id: true,
        ownerId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!memorial) {
      return NextResponse.json({ message: "Memorial not found" }, { status: 404 });
    }

    // Get user's role for this memorial
    const role = await getUserMemorialRole(user.id, memorialId);

    if (!role) {
      return NextResponse.json(
        { message: "You do not have access to this memorial" },
        { status: 403 }
      );
    }

    const isOwner = memorial.ownerId === user.id;

    return NextResponse.json({
      success: true,
      data: {
        memorialId: memorial.id,
        memorialName: `${memorial.firstName} ${memorial.lastName}`,
        role,
        isOwner,
      },
    });
  } catch (error) {
    console.error("Error fetching memorial access:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
