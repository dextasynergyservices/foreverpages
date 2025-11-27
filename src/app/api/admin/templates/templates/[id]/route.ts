import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

interface RouteParams {
  params: { id: string };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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
      categoryIds,
      planIds,
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
      isActive,
      isFeatured,
      previewMode,
    } = body;

    // Ensure params are resolved (Next.js may provide a promise)
    const { id } = (await params) as { id: string };

    // Validate categories exist if provided
    if (categoryIds !== undefined && categoryIds.length > 0) {
      const categories = await prisma.templateCategory.findMany({
        where: { id: { in: categoryIds } },
      });
      if (categories.length !== categoryIds.length) {
        return NextResponse.json({ error: "One or more categories not found" }, { status: 400 });
      }
    }

    // Validate plans exist if provided
    if (planIds !== undefined && planIds.length > 0) {
      const plans = await prisma.plan.findMany({
        where: { id: { in: planIds } },
      });
      if (plans.length !== planIds.length) {
        return NextResponse.json({ error: "One or more plans not found" }, { status: 400 });
      }
    }

    const updateData: Prisma.TemplateUpdateInput = {
      ...(name && { name }),
      ...(slug && { slug: slug.toLowerCase() }),
      ...(description !== undefined && { description }),
      ...(componentPath && { componentPath }),
      ...(previewImage && { previewImage }),
      ...(thumbnailImage && { thumbnailImage }),
      ...(layoutType && { layoutType }),
      ...(supportedSections && { supportedSections }),
      ...(designTokens !== undefined && { designTokens }),
      ...(defaultConfig !== undefined && { defaultConfig }),
      ...(navigationConfig !== undefined && { navigationConfig }),
      ...(headerConfig !== undefined && { headerConfig }),
      ...(displayOrder !== undefined && { displayOrder }),
      ...(isActive !== undefined && { isActive }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(previewMode !== undefined && { previewMode }),
    };

    // Handle categories update
    if (categoryIds !== undefined) {
      updateData.templateCategories = {
        deleteMany: {},
        create: categoryIds.map((categoryId: string) => ({
          categoryId,
        })),
      };
    }

    // Handle plans update
    if (planIds !== undefined) {
      updateData.plans = {
        set: planIds.map((planId: string) => ({ id: planId })),
      };
    }

    const template = await prisma.template.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = (await params) as { id: string };

    await prisma.template.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
