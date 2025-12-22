import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/user/templates/[id]
 * Get a specific user template
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const userTemplate = await prisma.userTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        baseTemplate: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            previewImage: true,
            thumbnailImage: true,
            supportedSections: true,
            layoutType: true,
          },
        },
        memorials: {
          select: {
            id: true,
            slug: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!userTemplate) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Template retrieved",
      data: userTemplate,
    });
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json({ message: "Failed to fetch template" }, { status: 500 });
  }
}

/**
 * PATCH /api/user/templates/[id]
 * Update a user template (config, sections, name, etc.)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, customization, sections, customPreviewImage, customThumbnailImage } =
      body;

    // Verify template belongs to user
    const existingTemplate = await prisma.userTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    // Build update data object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (customization !== undefined) updateData.customization = customization;
    if (sections !== undefined) updateData.sections = sections;
    if (customPreviewImage !== undefined) updateData.customPreviewImage = customPreviewImage;
    if (customThumbnailImage !== undefined) updateData.customThumbnailImage = customThumbnailImage;

    const updatedTemplate = await prisma.userTemplate.update({
      where: { id },
      data: updateData,
      include: {
        baseTemplate: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            previewImage: true,
            thumbnailImage: true,
            supportedSections: true,
            layoutType: true,
          },
        },
        memorials: {
          select: {
            id: true,
            slug: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Template updated successfully",
      data: updatedTemplate,
    });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json({ message: "Failed to update template" }, { status: 500 });
  }
}

/**
 * DELETE /api/user/templates/[id]
 * Delete a user template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify template belongs to user
    const existingTemplate = await prisma.userTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        memorials: true,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    // Check if template has published memorials
    if (existingTemplate.memorials && existingTemplate.memorials.length > 0) {
      return NextResponse.json(
        {
          message:
            "Cannot delete template with published memorials. Please delete memorials first.",
          memorialCount: existingTemplate.memorials.length,
        },
        { status: 409 } // Conflict
      );
    }

    await prisma.userTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json({ message: "Failed to delete template" }, { status: 500 });
  }
}
