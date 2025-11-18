import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { StreamStatus } from "@/generated/prisma";
import { sendStreamEndedEmail } from "@/lib/livestream-email-service";
import { getGlobalSocketServer, notifyStreamEnded } from "@/lib/socket/socketServer";
import { notifySignalingMetadataUpdate } from "@/lib/signaling";

/**
 * POST /api/streams/[id]/end
 * End a stream (change status to ENDED)
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const streamId = params.id;

    // Check if stream exists and user owns it
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

    // Check if stream can be ended
    if (stream.status === StreamStatus.ENDED) {
      return NextResponse.json({ error: "Stream is already ended" }, { status: 400 });
    }

    if (stream.status !== StreamStatus.LIVE) {
      return NextResponse.json({ error: "Can only end a live stream" }, { status: 400 });
    }

    const endedAt = new Date();
    const actualDuration = stream.startedAt
      ? Math.floor((endedAt.getTime() - stream.startedAt.getTime()) / 1000)
      : 0;

    // Calculate 6-month deletion date
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    // Calculate warning date (7 days before deletion)
    const warningDate = new Date(sixMonthsFromNow);
    warningDate.setDate(warningDate.getDate() - 7);

    // Update stream status
    const updatedStream = await prisma.memorialStream.update({
      where: { id: streamId },
      data: {
        status: StreamStatus.ENDED,
        endedAt,
        actualDuration,
        // Set retention dates if recording is enabled
        ...(stream.recordStream && {
          recordingDeleteAt: sixMonthsFromNow,
          recordingDeleteWarningAt: warningDate,
        }),
      },
      include: {
        memorial: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            viewers: true,
            comments: true,
            reactions: true,
          },
        },
      },
    });

    // Notify all connected viewers that the stream has ended
    // Note: Socket server may not be initialized if no clients have connected yet
    try {
      const io = getGlobalSocketServer();
      if (io) {
        notifyStreamEnded(streamId, io);
        console.log(`✅ Notified viewers that stream ${streamId} has ended`);
      } else {
        console.log(
          `ℹ️ Socket server not initialized yet - viewers will need to refresh to see stream ended`
        );
        // TODO: Implement alternative notification mechanism (e.g., database polling)
      }
      // Also notify external signaling server about status change
      notifySignalingMetadataUpdate(streamId, {
        status: "ENDED",
        endedAt: updatedStream.endedAt?.toISOString?.() ?? null,
      }).catch(() => {});
    } catch (error) {
      console.error("Failed to notify viewers of stream end:", error);
      // Don't fail the request if notification fails
    }

    // Close all active viewer sessions
    await prisma.streamViewer.updateMany({
      where: {
        streamId,
        leftAt: null,
      },
      data: {
        leftAt: endedAt,
      },
    });

    // Send email notification to memorial owner
    const memorialName = `${updatedStream.memorial.firstName} ${updatedStream.memorial.lastName}`;
    const owner = await prisma.user.findUnique({
      where: { id: stream.memorial.ownerId },
      select: { email: true, name: true },
    });

    if (owner?.email) {
      // Format duration (e.g., "1h 23m")
      const hours = Math.floor(actualDuration / 3600);
      const minutes = Math.floor((actualDuration % 3600) / 60);
      const durationStr =
        hours > 0 ? `${hours}h ${minutes}m` : minutes > 0 ? `${minutes}m` : "< 1m";

      // Send email notification (async, non-blocking)
      sendStreamEndedEmail({
        recipientEmail: owner.email,
        recipientName: owner.name || "User",
        memorialName,
        streamTitle: updatedStream.title,
        duration: durationStr,
        peakViewers: updatedStream.peakViewers || 0,
        totalComments: updatedStream._count.comments,
      }).catch((error) => {
        console.error("Failed to send stream ended email:", error);
      });
    }

    // TODO: Send notifications to memorial followers
    // TODO: Add WhatsApp notifications (Phase 1G)

    return NextResponse.json({ stream: updatedStream });
  } catch (error) {
    console.error("Error ending stream:", error);
    return NextResponse.json({ error: "Failed to end stream" }, { status: 500 });
  }
}
