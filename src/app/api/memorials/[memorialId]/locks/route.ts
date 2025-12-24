import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getUserMemorialRole } from "@/lib/permissions";

// Lock expires after 5 minutes of inactivity
const LOCK_TIMEOUT_MINUTES = 5;

/**
 * GET /api/memorials/[memorialId]/locks
 * Get all active edit locks for this memorial
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

    // Clean up expired locks
    await prisma.editLock.deleteMany({
      where: {
        memorialId,
        expiresAt: { lt: new Date() },
      },
    });

    // Get all active locks
    const locks = await prisma.editLock.findMany({
      where: {
        memorialId,
      },
      select: {
        id: true,
        section: true,
        lockedById: true,
        userName: true,
        userRole: true,
        lockedAt: true,
        expiresAt: true,
      },
    });

    return NextResponse.json(
      {
        locks,
        count: locks.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting edit locks:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/memorials/[memorialId]/locks
 * Acquire a lock on a section
 */
export async function POST(request: NextRequest, { params }: { params: { memorialId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { memorialId } = params;
    const body = await request.json();
    const { section } = body;

    if (!section) {
      return NextResponse.json({ message: "Section is required" }, { status: 400 });
    }

    // Check if user has edit permission
    const userRole = await getUserMemorialRole(session.user.id, memorialId);

    if (!userRole || !["OWNER", "ADMIN", "EDITOR"].includes(userRole)) {
      return NextResponse.json(
        { message: "You don't have permission to edit this memorial" },
        { status: 403 }
      );
    }

    // Clean up expired lock for this section
    await prisma.editLock.deleteMany({
      where: {
        memorialId,
        section,
        expiresAt: { lt: new Date() },
      },
    });

    // Check if section is already locked by someone else
    const existingLock = await prisma.editLock.findUnique({
      where: {
        memorialId_section: {
          memorialId,
          section,
        },
      },
    });

    if (existingLock && existingLock.lockedById !== session.user.id) {
      return NextResponse.json(
        {
          message: "Section is locked by another user",
          lock: existingLock,
          locked: true,
        },
        { status: 409 }
      );
    }

    // Create or update lock
    const expiresAt = new Date(Date.now() + LOCK_TIMEOUT_MINUTES * 60 * 1000);

    const lock = await prisma.editLock.upsert({
      where: {
        memorialId_section: {
          memorialId,
          section,
        },
      },
      update: {
        expiresAt,
      },
      create: {
        memorialId,
        section,
        lockedById: session.user.id,
        userName: session.user.name || session.user.email || "Unknown",
        userRole,
        expiresAt,
      },
    });

    return NextResponse.json(
      {
        message: "Lock acquired",
        lock,
        locked: false,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error acquiring lock:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/memorials/[memorialId]/locks?section=biography
 * Release a lock on a section
 */
export async function DELETE(request: NextRequest, { params }: { params: { memorialId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { memorialId } = params;
    const section = request.nextUrl.searchParams.get("section");

    if (!section) {
      return NextResponse.json({ message: "Section parameter is required" }, { status: 400 });
    }

    // Delete lock (only if owned by current user)
    const deleted = await prisma.editLock.deleteMany({
      where: {
        memorialId,
        section,
        lockedById: session.user.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ message: "No lock found or not owned by you" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Lock released",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error releasing lock:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
