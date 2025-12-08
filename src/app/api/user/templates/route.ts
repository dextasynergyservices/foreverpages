import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userTemplates = await prisma.userTemplate.findMany({
      where: {
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
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const formattedTemplates = userTemplates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      baseTemplate: template.baseTemplate,
      config: template.config,
      sections: template.sections,
      isPublished: template.isPublished,
      customPreviewImage: template.customPreviewImage,
      customThumbnailImage: template.customThumbnailImage,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      message: "User templates retrieved successfully",
      data: {
        templates: formattedTemplates,
      },
    });
  } catch (error) {
    console.error("Error fetching user templates:", error);
    return NextResponse.json({ message: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { baseTemplateId, name, description, config, sections } = body;

    if (!baseTemplateId || !name) {
      return NextResponse.json(
        { message: "Base template ID and name are required" },
        { status: 400 }
      );
    }

    const baseTemplate = await prisma.template.findUnique({
      where: { id: baseTemplateId },
    });

    if (!baseTemplate) {
      return NextResponse.json({ message: "Base template not found" }, { status: 404 });
    }

    // Check if user already has an active UserTemplate (single-selection constraint)
    const existingActive = await prisma.userTemplate.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    if (existingActive) {
      return NextResponse.json(
        {
          message:
            "You already have an active template. Please delete it before creating a new one.",
          existingTemplateId: existingActive.id,
        },
        { status: 409 } // Conflict
      );
    }

    const userTemplate = await prisma.userTemplate.create({
      data: {
        userId: session.user.id,
        baseTemplateId,
        name,
        description,
        config,
        sections,
        isActive: true, // Set as active since this is the only template
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
      message: "User template created successfully",
      data: {
        template: formattedTemplate,
      },
    });
  } catch (error) {
    console.error("Error creating user template:", error);
    return NextResponse.json({ message: "Failed to create template" }, { status: 500 });
  }
}
