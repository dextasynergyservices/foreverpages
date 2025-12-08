import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@/generated/prisma";
import { getUserMemorialRole } from "@/lib/permissions";

const prisma = new PrismaClient();

/**
 * GET /api/memorials/[memorialId]
 * Retrieve a memorial by ID
 */
export async function GET(request: NextRequest, { params }: { params: { memorialId: string } }) {
  try {
    const { memorialId } = params;

    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!memorial) {
      return NextResponse.json({ message: "Memorial not found" }, { status: 404 });
    }

    return NextResponse.json(memorial);
  } catch (error) {
    console.error("Error fetching memorial:", error);
    return NextResponse.json({ message: "Failed to fetch memorial" }, { status: 500 });
  }
}

/**
 * PUT /api/memorials/[memorialId]
 * Update a memorial with optimistic locking
 */
export async function PUT(request: NextRequest, { params }: { params: { memorialId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { memorialId } = params;
    const body = await request.json();
    const { version, ...updateData } = body;

    // Check permissions
    const role = await getUserMemorialRole(session.user.id, memorialId);
    if (!role || !["OWNER", "ADMIN", "EDITOR"].includes(role)) {
      return NextResponse.json(
        { message: "You don't have permission to edit this memorial" },
        { status: 403 }
      );
    }

    // Fetch current memorial
    const currentMemorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: {
        version: true,
        lastEditedBy: true,
        lastEditedAt: true,
      },
    });

    if (!currentMemorial) {
      return NextResponse.json({ message: "Memorial not found" }, { status: 404 });
    }

    // Optimistic locking check
    if (version !== undefined && version !== currentMemorial.version) {
      // Version mismatch - another user has updated the memorial
      return NextResponse.json(
        {
          message: "Conflict detected",
          error: "VERSION_CONFLICT",
          details: {
            clientVersion: version,
            serverVersion: currentMemorial.version,
            lastEditedBy: currentMemorial.lastEditedBy,
            lastEditedAt: currentMemorial.lastEditedAt,
          },
        },
        { status: 409 }
      );
    }

    // Update memorial with version increment
    const updatedMemorial = await prisma.memorial.update({
      where: { id: memorialId },
      data: {
        ...updateData,
        version: { increment: 1 },
        lastEditedBy: session.user.id,
        lastEditedAt: new Date(),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Memorial updated successfully",
      data: updatedMemorial,
    });
  } catch (error) {
    console.error("Error updating memorial:", error);
    return NextResponse.json({ message: "Failed to update memorial" }, { status: 500 });
  }
}

/**
 * DELETE /api/memorials/[memorialId]
 * Delete a memorial (owner only)
 */
export async function DELETE(request: NextRequest, { params }: { params: { memorialId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { memorialId } = params;

    // Check if user is the owner
    const role = await getUserMemorialRole(session.user.id, memorialId);
    if (role !== "OWNER") {
      return NextResponse.json(
        { message: "Only the owner can delete a memorial" },
        { status: 403 }
      );
    }

    await prisma.memorial.delete({
      where: { id: memorialId },
    });

    return NextResponse.json({
      message: "Memorial deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting memorial:", error);
    return NextResponse.json({ message: "Failed to delete memorial" }, { status: 500 });
  }
}
