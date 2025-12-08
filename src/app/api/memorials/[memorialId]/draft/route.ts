import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/memorials/[memorialId]/draft
 * Retrieve the latest draft for a memorial
 */
export async function GET(request: NextRequest, { params }: { params: { memorialId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { memorialId } = params;

    if (!memorialId) {
      return NextResponse.json({ message: "Memorial ID is required" }, { status: 400 });
    }

    // Verify user owns the memorial
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { ownerId: true },
    });

    if (!memorial) {
      return NextResponse.json({ message: "Memorial not found" }, { status: 404 });
    }

    if (memorial.ownerId !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Get the latest draft
    const draft = await prisma.memorialDraft.findFirst({
      where: { memorialId },
      orderBy: { createdAt: "desc" },
    });

    if (!draft) {
      return NextResponse.json({ message: "No draft found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Draft retrieved successfully",
      data: {
        id: draft.id,
        memorialId: draft.memorialId,
        data: draft.data,
        version: draft.version,
        savedAt: draft.createdAt,
        updatedAt: draft.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error retrieving memorial draft:", error);
    return NextResponse.json({ message: "Failed to retrieve memorial draft" }, { status: 500 });
  }
}

/**
 * POST /api/memorials/[memorialId]/draft
 * Save or update a memorial draft
 */
export async function POST(request: NextRequest, { params }: { params: { memorialId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { memorialId } = params;

    if (!memorialId) {
      return NextResponse.json({ message: "Memorial ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { data, fieldName, fieldValue } = body;

    if (!data && (!fieldName || fieldValue === undefined)) {
      return NextResponse.json(
        { message: "Either 'data' or 'fieldName' and 'fieldValue' are required" },
        { status: 400 }
      );
    }

    // Verify user owns the memorial
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { ownerId: true },
    });

    if (!memorial) {
      return NextResponse.json({ message: "Memorial not found" }, { status: 404 });
    }

    if (memorial.ownerId !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Get the latest draft to maintain version
    const latestDraft = await prisma.memorialDraft.findFirst({
      where: { memorialId },
      orderBy: { createdAt: "desc" },
    });

    const currentVersion = latestDraft?.version || 0;
    const newVersion = currentVersion + 1;

    // Merge data if updating field-by-field, otherwise use full data
    const draftData = data || {
      ...(latestDraft?.data as Record<string, unknown>),
      [fieldName]: fieldValue,
    };

    // Create or update draft
    const draft = await prisma.memorialDraft.create({
      data: {
        memorialId,
        data: draftData,
        version: newVersion,
      },
    });

    return NextResponse.json({
      message: "Draft saved successfully",
      data: {
        id: draft.id,
        memorialId: draft.memorialId,
        data: draft.data,
        version: draft.version,
        savedAt: draft.createdAt,
      },
    });
  } catch (error) {
    console.error("Error saving memorial draft:", error);
    return NextResponse.json({ message: "Failed to save memorial draft" }, { status: 500 });
  }
}

/**
 * DELETE /api/memorials/[memorialId]/draft
 * Delete all drafts for a memorial (optional, useful for cleanup)
 */
export async function DELETE(request: NextRequest, { params }: { params: { memorialId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { memorialId } = params;

    if (!memorialId) {
      return NextResponse.json({ message: "Memorial ID is required" }, { status: 400 });
    }

    // Verify user owns the memorial
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { ownerId: true },
    });

    if (!memorial) {
      return NextResponse.json({ message: "Memorial not found" }, { status: 404 });
    }

    if (memorial.ownerId !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Delete all drafts
    const result = await prisma.memorialDraft.deleteMany({
      where: { memorialId },
    });

    return NextResponse.json({
      message: "Drafts deleted successfully",
      data: { deletedCount: result.count },
    });
  } catch (error) {
    console.error("Error deleting memorial drafts:", error);
    return NextResponse.json({ message: "Failed to delete memorial drafts" }, { status: 500 });
  }
}
