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

    // Toggle pin status
    const viewer = await prisma.streamViewer.findUnique({
      where: { id: viewerId },
    });

    if (!viewer) {
      return NextResponse.json({ error: "Viewer not found" }, { status: 404 });
    }

    const updatedViewer = await prisma.streamViewer.update({
      where: { id: viewerId },
      data: { isPinned: !viewer.isPinned },
    });

    return NextResponse.json({ viewer: updatedViewer });
  } catch (error) {
    console.error("Error toggling pin:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; viewerId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Unpin viewer
    const updatedViewer = await prisma.streamViewer.update({
      where: { id: viewerId },
      data: { isPinned: false },
    });

    return NextResponse.json({ viewer: updatedViewer });
  } catch (error) {
    console.error("Error unpinning viewer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
