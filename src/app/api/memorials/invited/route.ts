import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

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

    // Get user's email for invitation lookup
    const userWithEmail = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true },
    });

    // Get all accepted invitations for this user (by invitedUserId OR email)
    // expiresAt check removed for ACCEPTED - once accepted, access is permanent
    const invitations = await prisma.invitation.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { invitedUserId: user.id },
          { email: userWithEmail?.email || session.user.email || "" },
        ],
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
