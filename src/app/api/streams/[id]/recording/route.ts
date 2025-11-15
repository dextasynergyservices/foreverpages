import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { RecordingStatus } from "@/generated/prisma";
import {
  getStreamingUrl,
  getVideoThumbnailUrl,
  deleteStreamRecording,
} from "@/lib/cloudinary/videoUpload";

/**
 * GET /api/streams/[id]/recording
 * Get stream recording information and playback URLs
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const streamId = params.id;

    const stream = await prisma.memorialStream.findUnique({
      where: { id: streamId },
      select: {
        id: true,
        recordingUrl: true,
        recordingDuration: true,
        recordingSize: true,
        recordingStatus: true,
        recordingDeleteAt: true,
        recordingDeleteWarningAt: true,
        memorial: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (!stream.recordingUrl) {
      return NextResponse.json({ error: "No recording available" }, { status: 404 });
    }

    // Generate playback URLs
    const streamingUrl = getStreamingUrl(stream.recordingUrl);
    const thumbnailUrl = getVideoThumbnailUrl(stream.recordingUrl);

    return NextResponse.json({
      recording: {
        url: stream.recordingUrl,
        streamingUrl, // HLS for adaptive streaming
        thumbnailUrl,
        duration: stream.recordingDuration,
        size: stream.recordingSize,
        status: stream.recordingStatus,
        deleteAt: stream.recordingDeleteAt,
        deleteWarningAt: stream.recordingDeleteWarningAt,
      },
    });
  } catch (error) {
    console.error("Error fetching recording:", error);
    return NextResponse.json({ error: "Failed to fetch recording" }, { status: 500 });
  }
}

/**
 * DELETE /api/streams/[id]/recording
 * Delete stream recording
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

    if (!stream.recordingUrl) {
      return NextResponse.json({ error: "No recording to delete" }, { status: 404 });
    }

    // Delete from Cloudinary
    try {
      await deleteStreamRecording(stream.recordingUrl);
    } catch (error) {
      console.error("Failed to delete from Cloudinary:", error);
      // Continue anyway to clean up database
    }

    // Update stream
    await prisma.memorialStream.update({
      where: { id: streamId },
      data: {
        recordingUrl: null,
        recordingDuration: null,
        recordingSize: null,
        recordingStatus: RecordingStatus.NONE,
        recordingDeleteAt: null,
        recordingDeleteWarningAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting recording:", error);
    return NextResponse.json({ error: "Failed to delete recording" }, { status: 500 });
  }
}
