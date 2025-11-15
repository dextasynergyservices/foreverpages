import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

/**
 * GET /api/memorials/invited
 * Get all memorials the authenticated user has been invited to collaborate on
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Get all accepted invitations for this user
    const invitations = await prisma.invitation.findMany({
      where: {
        invitedUserId: user.id,
        status: "ACCEPTED",
        expiresAt: { gte: new Date() }, // Not expired
      },
      include: {
        memorial: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        acceptedAt: "desc",
      },
    });

    // Format response
    const invitedMemorials = invitations.map((inv) => ({
      ...inv.memorial,
      collaboratorRole: inv.role,
      invitationId: inv.id,
      acceptedAt: inv.acceptedAt,
    }));

    return NextResponse.json({
      success: true,
      data: invitedMemorials,
      count: invitedMemorials.length,
    });
  } catch (error) {
    console.error("Error fetching invited memorials:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
