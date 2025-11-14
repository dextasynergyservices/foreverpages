import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/streams/[id]/moderation
 * Update stream moderation settings (keyword blacklist, slow mode, blocked viewers)
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const streamId = params.id;
    const body = await request.json();

    // Verify stream ownership
    const stream = await prisma.memorialStream.findUnique({
      where: { id: streamId },
      include: {
        memorial: {
          select: { ownerId: true },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (stream.memorial.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update moderation settings
    const updateData: {
      keywordBlacklist?: string[];
      slowModeInterval?: number;
      blockedViewers?: string[];
    } = {};

    if (body.keywordBlacklist !== undefined) {
      updateData.keywordBlacklist = body.keywordBlacklist;
    }

    if (body.slowModeInterval !== undefined) {
      updateData.slowModeInterval = body.slowModeInterval;
    }

    if (body.blockedViewers !== undefined) {
      updateData.blockedViewers = body.blockedViewers;
    }

    // Handle ban action
    if (body.action === "ban" && body.userId) {
      const currentBlockedViewers = stream.blockedViewers || [];
      if (!currentBlockedViewers.includes(body.userId)) {
        updateData.blockedViewers = [...currentBlockedViewers, body.userId];
      }
    }

    // Handle unban action
    if (body.action === "unban" && body.userId) {
      const currentBlockedViewers = stream.blockedViewers || [];
      updateData.blockedViewers = currentBlockedViewers.filter((id: string) => id !== body.userId);
    }

    const updatedStream = await prisma.memorialStream.update({
      where: { id: streamId },
      data: updateData,
      select: {
        id: true,
        keywordBlacklist: true,
        slowModeInterval: true,
        blockedViewers: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedStream,
    });
  } catch (error) {
    console.error("Error updating moderation settings:", error);
    return NextResponse.json({ error: "Failed to update moderation settings" }, { status: 500 });
  }
}

/**
 * GET /api/streams/[id]/moderation
 * Get stream moderation settings
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const streamId = params.id;

    // Verify stream ownership
    const stream = await prisma.memorialStream.findUnique({
      where: { id: streamId },
      select: {
        id: true,
        keywordBlacklist: true,
        slowModeInterval: true,
        blockedViewers: true,
        memorial: {
          select: { ownerId: true },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (stream.memorial.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        keywordBlacklist: stream.keywordBlacklist || [],
        slowModeInterval: stream.slowModeInterval || 0,
        blockedViewers: stream.blockedViewers || [],
      },
    });
  } catch (error) {
    console.error("Error fetching moderation settings:", error);
    return NextResponse.json({ error: "Failed to fetch moderation settings" }, { status: 500 });
  }
}
