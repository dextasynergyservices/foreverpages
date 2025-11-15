import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { RecordingStatus } from "@/generated/prisma";

/**
 * POST /api/streams/[id]/recording/start
 * Start recording for a stream (update status to RECORDING)
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { quality } = body;

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

    // Check if stream is LIVE
    if (stream.status !== "LIVE") {
      return NextResponse.json(
        { error: "Stream must be LIVE to start recording" },
        { status: 400 }
      );
    }

    // Update recording status
    const updatedStream = await prisma.memorialStream.update({
      where: { id },
      data: {
        recordingStatus: RecordingStatus.RECORDING,
      },
      select: {
        id: true,
        recordingStatus: true,
        streamQuality: true,
      },
    });

    return NextResponse.json({
      message: "Recording started",
      stream: {
        id: updatedStream.id,
        recordingStatus: updatedStream.recordingStatus,
        quality: quality || updatedStream.streamQuality,
      },
    });
  } catch (error) {
    console.error("[POST /api/streams/:id/recording/start] Error:", error);
    return NextResponse.json({ error: "Failed to start recording" }, { status: 500 });
  }
}
