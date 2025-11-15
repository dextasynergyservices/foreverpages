import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: streamId } = await context.params;

    // Verify stream exists and user is the owner
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

    const config = await request.json();

    // TODO: Implement real-time broadcasting of lower third to viewers
    // This could be done via:
    // - WebSocket broadcast to all connected viewers
    // - Server-Sent Events
    // - Socket.io rooms
    // For now, just acknowledge the request

    console.log("Lower third config for stream", streamId, config);

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("Error applying lower third:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: streamId } = await context.params;

    // Verify stream exists and user is the owner
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

    // TODO: Broadcast hide command to viewers
    console.log("Hiding lower third for stream", streamId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error hiding lower third:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
