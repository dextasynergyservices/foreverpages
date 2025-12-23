import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/user/memorials/[id]
 * Delete a memorial and its associated user template
 * Requires user to be the owner of the memorial
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in to delete a memorial" },
        { status: 401 }
      );
    }

    const { id: memorialId } = await params;

    if (!memorialId) {
      return NextResponse.json(
        { error: "Bad Request", message: "Memorial ID is required" },
        { status: 400 }
      );
    }

    // Parse request body for confirmation
    const body = await request.json();
    const { confirmationName } = body;

    // Verify memorial exists and user owns it
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: {
        id: true,
        ownerId: true,
        firstName: true,
        lastName: true,
        slug: true,
      },
    });

    if (!memorial) {
      return NextResponse.json(
        { error: "Not Found", message: "Memorial not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (memorial.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden", message: "You do not have permission to delete this memorial" },
        { status: 403 }
      );
    }

    // Validate confirmation name
    const expectedName = `${memorial.firstName} ${memorial.lastName}`.trim();
    if (confirmationName?.trim() !== expectedName) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message:
            "Confirmation name does not match. Please type the full name to confirm deletion.",
        },
        { status: 400 }
      );
    }

    // Find associated user template
    const userTemplate = await prisma.userTemplate.findFirst({
      where: {
        userId: session.user.id,
        memorials: {
          some: {
            id: memorialId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    // Delete memorial and associated data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete invitations associated with the memorial
      await tx.invitation.deleteMany({
        where: { memorialId },
      });

      // Delete the memorial (this will cascade delete related records based on your schema)
      await tx.memorial.delete({
        where: { id: memorialId },
      });

      // Delete or unpublish the user template if it exists
      if (userTemplate) {
        await tx.userTemplate.delete({
          where: { id: userTemplate.id },
        });
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: "Memorial deleted successfully",
        data: {
          memorialId,
          slug: memorial.slug,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting memorial:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: error.message || "Failed to delete memorial",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to delete memorial" },
      { status: 500 }
    );
  }
}
