import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/streams/[id]/comments/[commentId]/pin
 * Pin or unpin a comment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: streamId, commentId } = params;
    const body = await request.json();
    const { isPinned } = body;

    // Verify stream ownership
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

    // Verify comment belongs to stream
    const comment = await prisma.streamComment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.streamId !== streamId) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // If pinning this comment, unpin all others
    if (isPinned) {
      await prisma.streamComment.updateMany({
        where: {
          streamId,
          isPinned: true,
        },
        data: {
          isPinned: false,
        },
      });
    }

    // Update comment
    const updatedComment = await prisma.streamComment.update({
      where: { id: commentId },
      data: {
        isPinned,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedComment,
    });
  } catch (error) {
    console.error("Error pinning comment:", error);
    return NextResponse.json({ error: "Failed to pin comment" }, { status: 500 });
  }
}
