import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; viewerId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await req.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const { id: streamId, viewerId } = await params;

    // Get stream and verify ownership
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

    if (stream.memorial.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get viewer
    const viewer = await prisma.streamViewer.findUnique({
      where: { id: viewerId },
    });

    if (!viewer) {
      return NextResponse.json({ error: "Viewer not found" }, { status: 404 });
    }

    if (!viewer.userId) {
      return NextResponse.json({ error: "Cannot message guest viewers" }, { status: 400 });
    }

    // Create notification for the viewer
    await prisma.notification.create({
      data: {
        userId: viewer.userId,
        type: "PRIVATE_MESSAGE",
        title: "Private message from broadcaster",
        message: message.trim(),
        link: `/memorial-pages/${stream.memorialId}/livestream/${streamId}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
