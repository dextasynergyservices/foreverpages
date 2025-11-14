import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { StreamStatus } from "@/generated/prisma";
import { sendStreamLiveEmail } from "@/lib/livestream-email-service";
import { getGlobalSocketServer, notifyStreamStarted } from "@/lib/socket/socketServer";

/**
 * POST /api/streams/[id]/start
 * Start a stream (change status to LIVE)
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
    } catch (error) {
      console.error("Failed to notify viewers of stream start:", error);
      // Don't fail the request if notification fails
    }

    // Send email notifications to memorial owner (async, non-blocking)
    const memorialName = `${updatedStream.memorial.firstName} ${updatedStream.memorial.lastName}`;
    const streamUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${updatedStream.memorial.slug}`;

    // Get memorial owner email
    const owner = await prisma.user.findUnique({
      where: { id: updatedStream.memorial.ownerId },
      select: { email: true, name: true },
    });

    if (owner?.email) {
      // Send email notification (don't await to avoid blocking the response)
      sendStreamLiveEmail({
        recipientEmail: owner.email,
        recipientName: owner.name || "User",
        memorialName,
        streamTitle: updatedStream.title,
        streamUrl,
      }).catch((error) => {
        console.error("Failed to send stream live email:", error);
      });
    }

    // TODO: Send notifications to memorial followers (once follower system is implemented)
    // TODO: Add WhatsApp notifications (Phase 1G)

    return NextResponse.json({ stream: updatedStream });
  } catch (error) {
    console.error("Error starting stream:", error);
    return NextResponse.json({ error: "Failed to start stream" }, { status: 500 });
  }
}
