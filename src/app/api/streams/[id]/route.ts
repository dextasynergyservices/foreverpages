import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { StreamStatus } from "@/generated/prisma";
import bcrypt from "bcryptjs";

/**
 * GET /api/streams/[id]
 * Get a single stream by ID
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const streamId = params.id;

    const stream = await prisma.memorialStream.findUnique({
      where: { id: streamId },
      include: {
        memorial: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            ownerId: true,
          },
        },
        viewers: {
          where: {
            leftAt: null, // Currently active viewers
          },
          select: {
            id: true,
            sessionId: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            guestName: true,
            joinedAt: true,
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

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    // Get memorial to check ownership
    const memorial = await prisma.memorial.findUnique({
      where: { id: stream.memorialId },
      select: { ownerId: true },
    });

    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    // Check if user has access
    const isOwner = session?.user?.id === memorial.ownerId;
    const isPasswordProtected = !stream.isPublic && stream.password;

    // Hide sensitive data for non-owners
    if (!isOwner) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, streamKey, accessToken, ...publicStream } = stream;

      // If password protected and not verified, return limited info
      if (isPasswordProtected) {
        return NextResponse.json({
          stream: {
            id: publicStream.id,
            title: publicStream.title,
            description: publicStream.description,
            isPublic: publicStream.isPublic,
            requiresPassword: true,
          },
        });
      }

      return NextResponse.json({ stream: publicStream });
    }

    return NextResponse.json({ stream });
  } catch (error) {
    console.error("Error fetching stream:", error);
    return NextResponse.json({ error: "Failed to fetch stream" }, { status: 500 });
  }
}

/**
 * PATCH /api/streams/[id]
 * Update a stream
 * Body: Partial stream fields
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const streamId = params.id;
    const body = await req.json();

    // Check if stream exists and user owns it
    const existingStream = await prisma.memorialStream.findUnique({
      where: { id: streamId },
      include: {
        memorial: {
          select: { ownerId: true },
        },
      },
    });

    if (!existingStream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (existingStream.memorial.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can't update a stream that's currently live
    if (existingStream.status === StreamStatus.LIVE) {
      return NextResponse.json({ error: "Cannot update a live stream" }, { status: 400 });
    }

    // Prepare update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    const allowedFields = [
      "title",
      "description",
      "scheduledFor",
      "scheduledEnd",
      "streamQuality",
      "isPublic",
      "allowComments",
      "allowAnonymous",
      "recordStream",
      "thumbnailUrl",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Handle password update separately
    if (body.password !== undefined) {
      if (body.password === null || body.password === "") {
        updateData.password = null;
      } else {
        updateData.password = await bcrypt.hash(body.password, 10);
      }
    }

    // Update stream
    const updatedStream = await prisma.memorialStream.update({
      where: { id: streamId },
      data: updateData,
      include: {
        memorial: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ stream: updatedStream });
  } catch (error) {
    console.error("Error updating stream:", error);
    return NextResponse.json({ error: "Failed to update stream" }, { status: 500 });
  }
}

/**
 * DELETE /api/streams/[id]
 * Delete a stream
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

    // Can't delete a stream that's currently live
    if (stream.status === StreamStatus.LIVE) {
      return NextResponse.json({ error: "Cannot delete a live stream" }, { status: 400 });
    }

    // Delete from Cloudinary if recording exists
    if (stream.recordingUrl) {
      try {
        const { deleteStreamRecording } = await import("@/lib/cloudinary/videoUpload");
        await deleteStreamRecording(stream.recordingUrl);
      } catch (error) {
        console.error("Failed to delete recording from Cloudinary:", error);
        // Continue with deletion anyway
      }
    }

    // Delete stream (will cascade delete viewers, comments, reactions, analytics)
    await prisma.memorialStream.delete({
      where: { id: streamId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting stream:", error);
    return NextResponse.json({ error: "Failed to delete stream" }, { status: 500 });
  }
}
