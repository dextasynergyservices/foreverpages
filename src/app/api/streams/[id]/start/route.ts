import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { StreamStatus } from "@/generated/prisma";
import { getGlobalSocketServer, notifyStreamStarted } from "@/lib/socket/socketServer";
import { notifySignalingMetadataUpdate } from "@/lib/signaling";
import { notifyStreamSubscribers, NotificationEvent } from "@/lib/notification-service";
import log from "@/lib/logger";

/**
 * POST /api/streams/[id]/start
 * Start a stream (change status to LIVE)
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: streamId } = await params;

    // Check if stream exists and user owns it
    const stream = await prisma.memorialStream.findUnique({
      where: { id: streamId },
      include: {
        memorial: {
          select: { ownerId: true, firstName: true, lastName: true },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (stream.memorial.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if stream can be started
    if (stream.status === StreamStatus.LIVE) {
      return NextResponse.json({ error: "Stream is already live" }, { status: 400 });
    }

    if (stream.status === StreamStatus.ENDED) {
      return NextResponse.json({ error: "Cannot restart an ended stream" }, { status: 400 });
    }

    // Update stream status to LIVE
    const updatedStream = await prisma.memorialStream.update({
      where: { id: streamId },
      data: {
        status: StreamStatus.LIVE,
        startedAt: new Date(),
      },
      include: {
        memorial: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            slug: true,
            ownerId: true,
          },
        },
      },
    });

    // Notify all connected viewers that the stream has started
    try {
      const io = getGlobalSocketServer();
      if (io) {
        notifyStreamStarted(streamId, io);
      }
      // Also notify external signaling server (if configured) so other processes
      // and clients can react in real time. This is best-effort.
      notifySignalingMetadataUpdate(streamId, {
        status: "LIVE",
        startedAt: updatedStream.startedAt?.toISOString?.() ?? null,
      }).catch((err) => log.warn("Failed to notify signaling server of stream start", err));
    } catch (error) {
      log.error("Failed to notify viewers of stream start", error);
      // Don't fail the request if notification fails
    }

    // Send notifications to all stream subscribers (async, non-blocking)
    // This uses the unified notification service which handles:
    // - Email notifications
    // - WhatsApp notifications (if user has opted in)
    // - SMS notifications (if user has opted in)
    // All based on user notification preferences
    notifyStreamSubscribers(streamId, NotificationEvent.STREAM_LIVE).catch((error) => {
      log.error("Failed to notify stream subscribers", error);
    });

    return NextResponse.json({ stream: updatedStream });
  } catch (error) {
    log.error("Error starting stream", error);
    return NextResponse.json({ error: "Failed to start stream" }, { status: 500 });
  }
}
