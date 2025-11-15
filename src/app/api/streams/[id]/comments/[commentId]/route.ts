import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/streams/[id]/comments/[commentId]
 * Update comment (hide, unhide)
 */
export async function PATCH(
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

    // Update comment
    const updateData: {
      isHidden?: boolean;
      moderationReason?: string | null;
    } = {};

    if (body.isHidden !== undefined) {
      updateData.isHidden = body.isHidden;
    }

    if (body.moderationReason !== undefined) {
      updateData.moderationReason = body.moderationReason;
    }

    const updatedComment = await prisma.streamComment.update({
      where: { id: commentId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedComment,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}

/**
 * DELETE /api/streams/[id]/comments/[commentId]
 * Permanently delete a comment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: streamId, commentId } = params;

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

    // Delete comment
    await prisma.streamComment.delete({
      where: { id: commentId },
    });

    // Update comment count
    await prisma.memorialStream.update({
      where: { id: streamId },
      data: {
        totalComments: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
