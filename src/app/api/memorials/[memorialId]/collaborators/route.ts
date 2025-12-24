import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getUserMemorialRole } from "@/lib/permissions";

/**
 * GET /api/memorials/[memorialId]/collaborators
 * Get all collaborators for a memorial (including pending invitations)
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

    // Check if memorial exists and user has access
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { id: true, ownerId: true },
    });

    if (!memorial) {
      return NextResponse.json({ message: "Memorial not found" }, { status: 404 });
    }

    // Only owner and admins can view collaborators list
    const userRole = await getUserMemorialRole(user.id, memorialId);
    const isOwner = memorial.ownerId === user.id;

    if (!isOwner && userRole !== "ADMIN") {
      return NextResponse.json(
        { message: "You don't have permission to view collaborators" },
        { status: 403 }
      );
    }

    // Get only management collaborator invitations for this memorial
    // Exclude VIEWER role as those are guest invitations (shown in Invitations tab)
    const invitations = await prisma.invitation.findMany({
      where: {
        memorialId,
        role: {
          in: ["ADMIN", "EDITOR", "CONTRIBUTOR"], // Only management roles, not VIEWER (guests)
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        sentAt: true,
        acceptedAt: true,
      },
      orderBy: {
        sentAt: "desc",
      },
    });

    const collaborators = invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      status:
        inv.status === "ACCEPTED" ? "accepted" : inv.status === "DECLINED" ? "declined" : "pending",
      invitedAt: inv.sentAt.toISOString(),
      acceptedAt: inv.acceptedAt?.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: collaborators,
    });
  } catch (error) {
    console.error("Error fetching collaborators:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
