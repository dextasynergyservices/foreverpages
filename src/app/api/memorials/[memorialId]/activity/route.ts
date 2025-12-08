import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@/generated/prisma";
import { getUserMemorialRole } from "@/lib/permissions";

const prisma = new PrismaClient();

/**
 * GET /api/memorials/[memorialId]/activity
 * Get recent activity log for this memorial
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

    // Get query parameters
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");
    const section = request.nextUrl.searchParams.get("section");
    const userId = request.nextUrl.searchParams.get("userId");

    // Build where clause
    const where: Record<string, unknown> = {
      memorialId,
    };

    if (section) {
      where.section = section;
    }

    if (userId) {
      where.userId = userId;
    }

    // Get activity logs
    const activities = await prisma.activityLog.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: Math.min(limit, 100), // Max 100 records
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        section: true,
        userName: true,
        userRole: true,
        description: true,
        changes: true,
        metadata: true,
        createdAt: true,
        userId: true,
      },
    });

    return NextResponse.json(
      {
        activities,
        count: activities.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting activity log:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/memorials/[memorialId]/activity
 * Log a new activity (called by other endpoints or middleware)
 */
export async function POST(request: NextRequest, { params }: { params: { memorialId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { memorialId } = params;
    const body = await request.json();
    const { action, entityType, entityId, section, description, changes, metadata } = body;

    if (!action || !entityType) {
      return NextResponse.json({ message: "Action and entityType are required" }, { status: 400 });
    }

    // Check if user has permission
    const userRole = await getUserMemorialRole(session.user.id, memorialId);

    if (!userRole) {
      return NextResponse.json(
        { message: "You don't have permission to modify this memorial" },
        { status: 403 }
      );
    }

    // Create activity log entry
    const activity = await prisma.activityLog.create({
      data: {
        memorialId,
        userId: session.user.id,
        userName: session.user.name || session.user.email || "Unknown",
        userRole,
        action,
        entityType,
        entityId: entityId || null,
        section: section || null,
        description: description || `${action} ${entityType}`,
        changes: changes || null,
        metadata: metadata || null,
      },
    });

    return NextResponse.json(
      {
        message: "Activity logged",
        activity,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error logging activity:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
