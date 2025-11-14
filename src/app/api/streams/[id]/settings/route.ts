import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * PATCH /api/streams/[id]/settings
 * Update stream settings (chat, reactions, etc.)
 * Note: enableChat maps to allowComments in the schema
 * TODO: Add allowReactions field to MemorialStream schema for reaction control
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { enableChat, enableReactions } = body;

    // Validate input
    if (enableChat !== undefined && typeof enableChat !== "boolean") {
      return NextResponse.json({ error: "allowComments must be a boolean" }, { status: 400 });
    }

    if (enableReactions !== undefined && typeof enableReactions !== "boolean") {
      return NextResponse.json({ error: "allowReactions must be a boolean" }, { status: 400 });
    }

    // Get the stream and verify ownership
    const stream = await prisma.memorialStream.findUnique({
      where: { id },
      include: {
        memorial: {
          select: { ownerId: true },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    // Check if user is the memorial owner
    if (stream.memorial.ownerId !== user.id) {
      return NextResponse.json(
        { error: "You do not have permission to update this stream" },
        { status: 403 }
      );
    }

    // Build update object with only provided fields
    // Map enableChat -> allowComments (schema field)
    // Note: allowReactions doesn't exist in schema yet, storing for future use
    const updateData: {
      allowComments?: boolean;
    } = {};

    if (enableChat !== undefined) {
      updateData.allowComments = enableChat;
    }

    // TODO: Add allowReactions field to schema and uncomment this
    // if (enableReactions !== undefined) {
    //   updateData.allowReactions = enableReactions;
    // }

    // Update the stream settings
    const updatedStream = await prisma.memorialStream.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        allowComments: true,
      },
    });

    return NextResponse.json({
      message: "Stream settings updated successfully",
      stream: {
        id: updatedStream.id,
        enableChat: updatedStream.allowComments,
        // TODO: Add enableReactions once allowReactions field is added to schema
        enableReactions: true, // Placeholder - always true for now
      },
    });
  } catch (error) {
    console.error("[PATCH /api/streams/:id/settings] Error:", error);
    return NextResponse.json({ error: "Failed to update stream settings" }, { status: 500 });
  }
}
