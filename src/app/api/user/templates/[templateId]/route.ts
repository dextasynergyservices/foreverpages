import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    templateId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = (await params) as { templateId: string };

    const userTemplate = await prisma.userTemplate.findFirst({
      where: {
        id: templateId,
        userId: session.user.id,
        isActive: true,
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
            defaultConfig: true,
            navigationConfig: true,
            headerConfig: true,
          },
        },
      },
    });

    if (!userTemplate) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    const formattedTemplate = {
      id: userTemplate.id,
      name: userTemplate.name,
      description: userTemplate.description,
      baseTemplate: userTemplate.baseTemplate,
      config: userTemplate.config,
      sections: userTemplate.sections,
      isPublished: userTemplate.isPublished,
      customPreviewImage: userTemplate.customPreviewImage,
      customThumbnailImage: userTemplate.customThumbnailImage,
      createdAt: userTemplate.createdAt.toISOString(),
      updatedAt: userTemplate.updatedAt.toISOString(),
    };

    return NextResponse.json({
      message: "User template retrieved successfully",
      data: {
        template: formattedTemplate,
      },
    });
  } catch (error) {
    console.error("Error fetching user template:", error);
    return NextResponse.json({ message: "Failed to fetch template" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = (await params) as { templateId: string };
    const body = await request.json();
    const { name, description, config, sections, isPublished } = body;

    const userTemplate = await prisma.userTemplate.findFirst({
      where: {
        id: templateId,
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!userTemplate) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    const updatedTemplate = await prisma.userTemplate.update({
      where: { id: templateId },
      data: {
        name,
        description,
        config,
        sections,
        isPublished,
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
      },
    });

    const formattedTemplate = {
      id: updatedTemplate.id,
      name: updatedTemplate.name,
      description: updatedTemplate.description,
      baseTemplate: updatedTemplate.baseTemplate,
      config: updatedTemplate.config,
      sections: updatedTemplate.sections,
      isPublished: updatedTemplate.isPublished,
      customPreviewImage: updatedTemplate.customPreviewImage,
      customThumbnailImage: updatedTemplate.customThumbnailImage,
      createdAt: updatedTemplate.createdAt.toISOString(),
      updatedAt: updatedTemplate.updatedAt.toISOString(),
    };

    return NextResponse.json({
      message: "User template updated successfully",
      data: {
        template: formattedTemplate,
      },
    });
  } catch (error) {
    console.error("Error updating user template:", error);
    return NextResponse.json({ message: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = (await params) as { templateId: string };

    const userTemplate = await prisma.userTemplate.findFirst({
      where: {
        id: templateId,
        userId: session.user.id,
        isActive: true,
      },
    });

    if (!userTemplate) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    await prisma.userTemplate.update({
      where: { id: templateId },
      data: { isActive: false },
    });

    return NextResponse.json({
      message: "User template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user template:", error);
    return NextResponse.json({ message: "Failed to delete template" }, { status: 500 });
  }
}
