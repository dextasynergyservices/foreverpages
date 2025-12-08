import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/templates/[id]/preview
 * Get full template details for preview
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        plans: {
          select: {
            id: true,
            name: true,
            slug: true,
            priceNGN: true,
            priceUSD: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    // Check if template is available for user's plan
    const userSubscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: {
          in: ["ACTIVE", "GRACE_PERIOD"],
        },
      },
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const isAvailable = template.plans.some(
      (plan: { id: string }) => plan.id === userSubscription?.plan?.id
    );

    // Check if it's a premium template based on price
    const isPremium = template.plans.some(
      (plan: { priceNGN: unknown; priceUSD: unknown }) =>
        (plan.priceNGN && Number(plan.priceNGN) > 0) || (plan.priceUSD && Number(plan.priceUSD) > 0)
    );

    // Format the response
    const previewData = {
      id: template.id,
      name: template.name,
      slug: template.slug,
      description: template.description,
      previewImage: template.previewImage,
      thumbnailImage: template.thumbnailImage,
      supportedSections: template.supportedSections,
      layoutType: template.layoutType,
      defaultConfig: template.defaultConfig,
      category: template.category,
      plans: template.plans,
      isAvailable,
      isPremium,
      componentPath: template.componentPath,
      artifactAssets: template.artifactAssets as Record<string, string> | null,
      processingStatus: template.processingStatus,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };

    return NextResponse.json({
      message: "Template preview retrieved successfully",
      data: previewData,
    });
  } catch (error) {
    console.error("Error fetching template preview:", error);
    return NextResponse.json({ message: "Failed to fetch template preview" }, { status: 500 });
  }
}
