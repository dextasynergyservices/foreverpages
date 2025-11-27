import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        previewImage: true,
        thumbnailImage: true,
        supportedSections: true,
        layoutType: true,
        isFeatured: true,
        displayOrder: true,
        usageCount: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { usageCount: "desc" }],
    });

    const formattedTemplates = templates.map((template) => ({
      id: template.id,
      name: template.name,
      slug: template.slug,
      description: template.description,
      previewImage: template.previewImage,
      thumbnailImage: template.thumbnailImage,
      supportedSections: template.supportedSections,
      layoutType: template.layoutType,
      isFeatured: template.isFeatured,
      displayOrder: template.displayOrder,
      usageCount: template.usageCount,
      category: template.category,
    }));

    return NextResponse.json({
      message: "Templates retrieved successfully",
      data: {
        templates: formattedTemplates,
      },
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ message: "Failed to fetch templates" }, { status: 500 });
  }
}
