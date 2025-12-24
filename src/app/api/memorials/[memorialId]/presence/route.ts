import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getUserMemorialRole } from "@/lib/permissions";

// Presence heartbeat threshold - consider user offline after 30 seconds
const PRESENCE_TIMEOUT_SECONDS = 30;

/**
 * GET /api/memorials/[memorialId]/presence
 * Get all active users currently viewing/editing this memorial
 */
export async function GET(request: NextRequest, { params }: { params: { memorialId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { memorialId } = params;

    // Check if user has access to this memorial
    const userRole = await getUserMemorialRole(session.user.id, memorialId);

    if (!userRole) {
      return NextResponse.json(
        { message: "You don't have permission to view this memorial" },
        { status: 403 }
      );
    }

    // Clean up stale presence records (older than PRESENCE_TIMEOUT_SECONDS)
    const cutoffTime = new Date(Date.now() - PRESENCE_TIMEOUT_SECONDS * 1000);
    await prisma.memorialPresence.deleteMany({
      where: {
        memorialId,
        lastSeen: { lt: cutoffTime },
      },
    });

    // Get all active users
    const activeUsers = await prisma.memorialPresence.findMany({
      where: {
        memorialId,
      },
      select: {
        userId: true,
        userName: true,
        userRole: true,
        section: true,
        isEditing: true,
        lastSeen: true,
      },
      orderBy: {
        lastSeen: "desc",
      },
    });

    return NextResponse.json(
      {
        activeUsers,
        count: activeUsers.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting memorial presence:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/memorials/[memorialId]/presence
 * Update user's presence (heartbeat)
 */
export async function POST(request: NextRequest, { params }: { params: { memorialId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { memorialId } = params;
    const body = await request.json();
    const { section, isEditing } = body;

    // Check if user has access to this memorial
    const userRole = await getUserMemorialRole(session.user.id, memorialId);

    if (!userRole) {
      return NextResponse.json(
        { message: "You don't have permission to access this memorial" },
        { status: 403 }
      );
    }

    // Update or create presence record
    const presence = await prisma.memorialPresence.upsert({
      where: {
        memorialId_userId: {
          memorialId,
          userId: session.user.id,
        },
      },
      update: {
        section: section || null,
        isEditing: isEditing || false,
        lastSeen: new Date(),
      },
      create: {
        memorialId,
        userId: session.user.id,
        userName: session.user.name || session.user.email || "Unknown",
        userRole,
        section: section || null,
        isEditing: isEditing || false,
        lastSeen: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: "Presence updated",
        presence,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating presence:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/memorials/[memorialId]/presence
 * Remove user's presence (user left the page)
 */
export async function DELETE(request: NextRequest, { params }: { params: { memorialId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { memorialId } = params;

    // Delete presence record
    await prisma.memorialPresence.delete({
      where: {
        memorialId_userId: {
          memorialId,
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json(
      {
        message: "Presence removed",
      },
      { status: 200 }
    );
  } catch (error) {
    // If record doesn't exist, that's fine
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json({ message: "Presence already removed" }, { status: 200 });
    }

    console.error("Error removing presence:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
