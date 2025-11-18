import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { RecordingStatus } from "@/generated/prisma";
import { uploadStreamRecording } from "@/lib/cloudinary/videoUpload";
import { notifySignalingMetadataUpdate } from "@/lib/signaling";

/**
 * POST /api/streams/[id]/upload-recording
 * Upload stream recording to Cloudinary
 * Body: FormData with video file or { url: string, duration: number, size: number }
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

    // Check if already has a recording
    if (stream.recordingUrl) {
      return NextResponse.json({ error: "Recording already exists" }, { status: 400 });
    }

    const contentType = req.headers.get("content-type");

    // Handle JSON body (URL from external source)
    if (contentType?.includes("application/json")) {
      const body = await req.json();
      const { url, duration, size } = body;

      if (!url) {
        return NextResponse.json({ error: "Recording URL required" }, { status: 400 });
      }

      // Update stream with recording info
      const updatedStream = await prisma.memorialStream.update({
        where: { id: streamId },
        data: {
          recordingUrl: url,
          recordingDuration: duration || null,
          recordingSize: size || null,
          recordingStatus: RecordingStatus.READY,
        },
      });

      // Notify signaling server
      notifySignalingMetadataUpdate(streamId, {
        recordingUrl: updatedStream.recordingUrl,
        recordingStatus: updatedStream.recordingStatus,
      }).catch(() => {});

      return NextResponse.json({ stream: updatedStream });
    }

    // Handle FormData upload
    if (contentType?.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("video") as File;

      if (!file) {
        return NextResponse.json({ error: "Video file required" }, { status: 400 });
      }

      // Convert File to Buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload to Cloudinary
      const uploadResult = await uploadStreamRecording(buffer, {
        streamId,
        quality: stream.streamQuality,
        filename: `stream-${streamId}`,
      });

      // Update stream with recording info
      const updatedStream = await prisma.memorialStream.update({
        where: { id: streamId },
        data: {
          recordingUrl: uploadResult.secureUrl,
          recordingDuration: uploadResult.duration || null,
          recordingSize: uploadResult.bytes || null,
          recordingStatus: RecordingStatus.READY,
        },
      });

      // Notify signaling server
      notifySignalingMetadataUpdate(streamId, {
        recordingUrl: updatedStream.recordingUrl,
        recordingStatus: updatedStream.recordingStatus,
      }).catch(() => {});

      return NextResponse.json({ stream: updatedStream });
    }

    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  } catch (error) {
    console.error("Error uploading recording:", error);
    return NextResponse.json({ error: "Failed to upload recording" }, { status: 500 });
  }
}
