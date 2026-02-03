import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastLowerThird, hideLowerThird } from "@/lib/socket/socketServer";
import { log } from "@/lib/logger";

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

    // Broadcast lower-third to all connected viewers via Socket.io
    broadcastLowerThird(streamId, config);

    log.info(`Lower third applied for stream ${streamId}`);

    return NextResponse.json({ success: true, config });
  } catch (error) {
    log.error("Error applying lower third:", error);
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

    // Broadcast hide command to all connected viewers
    hideLowerThird(streamId);

    log.info(`Lower third hidden for stream ${streamId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("Error hiding lower third:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
