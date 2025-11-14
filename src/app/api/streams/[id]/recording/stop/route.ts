import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { RecordingStatus } from "@/generated/prisma";

/**
 * POST /api/streams/[id]/recording/stop
 * Stop recording for a stream (update status and metadata)
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { duration, size } = body;

    // Get the stream and verify ownership
    const stream = await prisma.memorialStream.findUnique({
      where: { id },
      include: {
        memorial: {
          select: { ownerId: true },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (stream.memorial.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if recording is in progress
    if (stream.recordingStatus !== RecordingStatus.RECORDING) {
      return NextResponse.json({ error: "No active recording to stop" }, { status: 400 });
    }

    // Calculate recording deletion dates (6 months retention)
    const now = new Date();
    const deleteAt = new Date(now);
    deleteAt.setMonth(deleteAt.getMonth() + 6); // 6 months from now

    const deleteWarningAt = new Date(deleteAt);
    deleteWarningAt.setDate(deleteWarningAt.getDate() - 7); // 7 days before deletion

    // Update recording status to PROCESSING (will be updated to READY after upload completes)
    const updatedStream = await prisma.memorialStream.update({
      where: { id },
      data: {
        recordingStatus: RecordingStatus.PROCESSING,
        recordingDuration: duration || null,
        recordingSize: size || null,
        recordingDeleteAt: deleteAt,
        recordingDeleteWarningAt: deleteWarningAt,
      },
      select: {
        id: true,
        recordingStatus: true,
        recordingDuration: true,
        recordingSize: true,
        recordingDeleteAt: true,
      },
    });

    return NextResponse.json({
      message: "Recording stopped and processing",
      stream: {
        id: updatedStream.id,
        recordingStatus: updatedStream.recordingStatus,
        duration: updatedStream.recordingDuration,
        size: updatedStream.recordingSize,
        deleteAt: updatedStream.recordingDeleteAt,
      },
    });
  } catch (error) {
    console.error("[POST /api/streams/:id/recording/stop] Error:", error);
    return NextResponse.json({ error: "Failed to stop recording" }, { status: 500 });
  }
}
