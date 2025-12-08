import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user's current subscription and plan
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        currentPlan: true,
        subscriptions: {
          where: {
            status: {
              in: ["ACTIVE", "GRACE_PERIOD"],
            },
          },
          take: 1,
          orderBy: { expiresAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const currentSubscription = user.subscriptions?.[0];
    const currentPlan = user.currentPlan;

    // If no active subscription, return only free tier templates
    const whereClause = currentPlan
      ? {
          isActive: true,
          plans: {
            some: {
              id: currentPlan.id,
            },
          },
        }
      : {
          isActive: true,
          plans: {
            some: {
              slug: "free",
            },
          },
        };

    const templates = await prisma.template.findMany({
      where: whereClause,
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
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }],
    });

    return NextResponse.json({
      message: "Available templates retrieved successfully",
      data: {
        templates,
        subscription: {
          status: currentSubscription?.status || "INACTIVE",
          expiresAt: currentSubscription?.expiresAt,
          inGracePeriod: currentSubscription?.inGracePeriod || false,
          planName: currentPlan?.name,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching available templates:", error);
    return NextResponse.json({ message: "Failed to fetch available templates" }, { status: 500 });
  }
}
