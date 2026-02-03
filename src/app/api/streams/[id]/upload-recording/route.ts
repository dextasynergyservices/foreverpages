import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { RecordingStatus } from "@/generated/prisma";
import { uploadStreamRecording } from "@/lib/cloudinary/videoUpload";
import { notifySignalingMetadataUpdate } from "@/lib/signaling";
import { notifyStreamSubscribers, NotificationEvent } from "@/lib/notification-service";
import log from "@/lib/logger";

/**
 * POST /api/streams/[id]/upload-recording
 * Upload stream recording to Cloudinary
 * Body: FormData with video file or { url: string, duration: number, size: number }
 */
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: streamId } = await context.params;
    if (!streamId) {
      return NextResponse.json({ error: "Missing stream id" }, { status: 400 });
    }

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

      // Calculate recording deletion dates (30 days retention for livestreams)
      const now = new Date();
      const deleteAt = new Date(now);
      deleteAt.setDate(deleteAt.getDate() + 30); // 30 days from now

      const deleteWarningAt = new Date(deleteAt);
      deleteWarningAt.setDate(deleteWarningAt.getDate() - 7); // 7 days before deletion

      // Update stream with recording info
      const updatedStream = await prisma.memorialStream.update({
        where: { id: streamId },
        data: {
          recordingUrl: url,
          recordingDuration: duration || null,
          recordingSize: size || null,
          recordingStatus: RecordingStatus.READY,
          recordingDeleteAt: deleteAt,
          recordingDeleteWarningAt: deleteWarningAt,
        },
      });

      // Notify signaling server
      notifySignalingMetadataUpdate(streamId, {
        recordingUrl: updatedStream.recordingUrl,
        recordingStatus: updatedStream.recordingStatus,
      }).catch((err) => log.warn("Failed to notify signaling of recording update", err));

      // Send recording ready notifications to all stream subscribers
      notifyStreamSubscribers(streamId, NotificationEvent.RECORDING_READY).catch((error) => {
        log.error("Failed to send recording ready notifications", error);
      });

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

      // Calculate recording deletion dates (30 days retention for livestreams)
      const now = new Date();
      const deleteAt = new Date(now);
      deleteAt.setDate(deleteAt.getDate() + 30); // 30 days from now

      const deleteWarningAt = new Date(deleteAt);
      deleteWarningAt.setDate(deleteWarningAt.getDate() - 7); // 7 days before deletion

      // Update stream with recording info
      const updatedStream = await prisma.memorialStream.update({
        where: { id: streamId },
        data: {
          recordingUrl: uploadResult.secureUrl,
          recordingDuration: uploadResult.duration || null,
          recordingSize: uploadResult.bytes || null,
          recordingStatus: RecordingStatus.READY,
          recordingDeleteAt: deleteAt,
          recordingDeleteWarningAt: deleteWarningAt,
        },
      });

      // Notify signaling server
      notifySignalingMetadataUpdate(streamId, {
        recordingUrl: updatedStream.recordingUrl,
        recordingStatus: updatedStream.recordingStatus,
      }).catch((err) => log.warn("Failed to notify signaling of recording URL update", err));

      // Send recording ready notifications to all stream subscribers
      notifyStreamSubscribers(streamId, NotificationEvent.RECORDING_READY).catch((error) => {
        log.error("Failed to send recording ready notifications", error);
      });

      return NextResponse.json({ stream: updatedStream });
    }

    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  } catch (error) {
    log.error("Error uploading recording", error);
    return NextResponse.json({ error: "Failed to upload recording" }, { status: 500 });
  }
}
