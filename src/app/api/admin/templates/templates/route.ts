import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await prisma.template.findMany({
      include: {
        templateCategories: {
          include: {
            category: true,
          },
        },
        sections: {
          orderBy: { order: "asc" },
        },
        plans: true,
        _count: {
          select: { userTemplates: true },
        },
      },
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      description,
      categoryIds = [] as string[],
      planIds = [] as string[],
      componentPath,
      previewImage,
      thumbnailImage,
      layoutType,
      supportedSections,
      designTokens,
      defaultConfig,
      navigationConfig,
      headerConfig,
      displayOrder = 0,
      isFeatured = false,
      previewMode = "AUTO",
    } = body;

    if (!name || !slug || !componentPath || !previewImage || !thumbnailImage) {
      return NextResponse.json(
        { error: "Name, slug, component path, preview image, and thumbnail image are required" },
        { status: 400 }
      );
    }

    // Validate categories exist
    if (categoryIds.length > 0) {
      const categories = await prisma.templateCategory.findMany({
        where: { id: { in: categoryIds } },
      });
      if (categories.length !== categoryIds.length) {
        return NextResponse.json({ error: "One or more categories not found" }, { status: 400 });
      }
    }

    // Validate plans exist
    if (planIds.length > 0) {
      const plans = await prisma.plan.findMany({
        where: { id: { in: planIds } },
      });
      if (plans.length !== planIds.length) {
        return NextResponse.json({ error: "One or more plans not found" }, { status: 400 });
      }
    }

    const template = await prisma.template.create({
      data: {
        name,
        slug: slug.toLowerCase(),
        description,
        componentPath,
        previewImage,
        thumbnailImage,
        layoutType,
        supportedSections,
        designTokens,
        defaultConfig,
        navigationConfig,
        headerConfig,
        displayOrder,
        isFeatured,
        templateCategories: {
          create: categoryIds.map((categoryId: string) => ({ categoryId })),
        },
        plans: {
          connect: planIds.map((planId: string) => ({ id: planId })),
        },
        previewMode,
      },
      include: {
        templateCategories: {
          include: {
            category: true,
          },
        },
        sections: {
          orderBy: { order: "asc" },
        },
        plans: true,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
