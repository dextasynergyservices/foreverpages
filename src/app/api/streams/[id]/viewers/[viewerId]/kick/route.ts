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

    const { reason } = await req.json();
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

    // Block/kick viewer
    const updatedViewer = await prisma.streamViewer.update({
      where: { id: viewerId },
      data: {
        isBlocked: true,
        blockedAt: new Date(),
        blockedReason: reason || "Kicked by broadcaster",
        isActive: false,
        leftAt: new Date(),
      },
    });

    return NextResponse.json({ viewer: updatedViewer });
  } catch (error) {
    console.error("Error kicking viewer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
