import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { StreamStatus } from "@/generated/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * POST /api/streams/[id]/viewers
 * Join a stream as a viewer
 * Body: { anonymousName?: string, connectionQuality?: string }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const streamId = params.id;
    const body = await req.json();
    const { anonymousName, connectionQuality = "good" } = body;

    // Try cookie-based dedupe: check for stream_session cookie
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [k, ...v] = c.split("=");
        return [k?.trim(), decodeURIComponent((v || []).join("=").trim())];
      })
    );

    let sessionId = cookies["stream_session"];
    if (!sessionId) {
      // Generate a persistent session id and instruct client to store it via Set-Cookie
      sessionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }

    // Check if stream exists and is accessible
    const stream = await prisma.memorialStream.findUnique({
      where: { id: streamId },
      select: {
        id: true,
        status: true,
        allowAnonymous: true,
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    // Check if stream is live or ended (can watch replay)
    if (stream.status !== StreamStatus.LIVE && stream.status !== StreamStatus.ENDED) {
      return NextResponse.json({ error: "Stream is not available" }, { status: 400 });
    }

    // Check if anonymous is allowed
    if (!session?.user && !stream.allowAnonymous) {
      return NextResponse.json({ error: "Anonymous viewing not allowed" }, { status: 403 });
    }

    // Create or update viewer record
    const isAnonymous = !session?.user;
    const viewer = await prisma.streamViewer.create({
      data: {
        streamId,
        sessionId,
        userId: session?.user?.id,
        guestName: isAnonymous ? anonymousName || "Anonymous" : null,
        connectionQuality,
        joinedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Update total views count only if this session hasn't been seen for this stream
    const existing = await prisma.streamViewer.findFirst({
      where: { streamId, sessionId },
    });

    if (!existing) {
      await prisma.memorialStream.update({
        where: { id: streamId },
        data: {
          totalViews: {
            increment: 1,
          },
        },
      });
    }

    // Get current viewer count
    const viewerCount = await prisma.streamViewer.count({
      where: {
        streamId,
        leftAt: null,
      },
    });

    // Update peak viewers if needed
    await prisma.memorialStream.updateMany({
      where: {
        id: streamId,
        peakViewers: {
          lt: viewerCount,
        },
      },
      data: {
        peakViewers: viewerCount,
      },
    });

    const res = NextResponse.json({
      viewer,
      viewerCount,
    });

    // If we created a new session id (cookie not present), set a cookie for dedupe (1 year)
    if (!cookies["stream_session"]) {
      res.headers.append(
        "Set-Cookie",
        `stream_session=${encodeURIComponent(sessionId)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; HttpOnly`
      );
    }

    return res;
  } catch (error) {
    console.error("Error joining stream:", error);
    return NextResponse.json({ error: "Failed to join stream" }, { status: 500 });
  }
}

/**
 * GET /api/streams/[id]/viewers
 * Get list of current viewers (with moderation info for broadcaster)
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const streamId = params.id;

    // Get stream to check ownership
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

    const isBroadcaster = user && stream.memorial.ownerId === user.id;

    // Get viewers - include moderation fields if broadcaster
    const viewers = await prisma.streamViewer.findMany({
      where: {
        streamId,
        isBlocked: false,
        OR: [
          { isActive: true },
          {
            leftAt: {
              gte: new Date(Date.now() - 5 * 60 * 1000), // Left within last 5 minutes
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            email: isBroadcaster, // Only include email for broadcaster
            image: true,
          },
        },
      },
      orderBy: [{ isPinned: "desc" }, { isVIP: "desc" }, { joinedAt: "desc" }],
    });

    const viewerCount = viewers.filter((v) => v.isActive).length;

    return NextResponse.json({
      viewers,
      viewerCount,
    });
  } catch (error) {
    console.error("Error fetching viewers:", error);
    return NextResponse.json({ error: "Failed to fetch viewers" }, { status: 500 });
  }
}

/**
 * DELETE /api/streams/[id]/viewers
 * Leave a stream (mark viewer as left)
 * Body: { sessionId: string }
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const streamId = params.id;
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    // Find viewer and update
    const viewer = await prisma.streamViewer.findFirst({
      where: {
        streamId,
        sessionId,
        leftAt: null,
      },
    });

    if (!viewer) {
      return NextResponse.json({ error: "Viewer session not found" }, { status: 404 });
    }

    const leftAt = new Date();
    const watchTime = Math.floor((leftAt.getTime() - viewer.joinedAt.getTime()) / 1000);

    // Update viewer record
    await prisma.streamViewer.update({
      where: { id: viewer.id },
      data: {
        leftAt,
        watchTime,
      },
    });

    // Update average watch time
    const allViewers = await prisma.streamViewer.findMany({
      where: { streamId },
      select: { watchTime: true },
    });

    const totalWatchTime = allViewers.reduce((sum, v) => sum + (v.watchTime || 0), 0);
    const averageWatchTime = Math.floor(totalWatchTime / allViewers.length);

    await prisma.memorialStream.update({
      where: { id: streamId },
      data: { averageWatchTime },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving stream:", error);
    return NextResponse.json({ error: "Failed to leave stream" }, { status: 500 });
  }
}
