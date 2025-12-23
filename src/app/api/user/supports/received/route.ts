import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/user/supports/received
 * Get supports received by the current user's memorials
 * Query params: page (default 1), limit (default 10)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await prisma.memorialSupport.count({
      where: {
        memorialOwnerId: userId,
      },
    });

    // Get supports received for user's memorials with pagination
    const receivedSupports = await prisma.memorialSupport.findMany({
      where: {
        memorialOwnerId: userId,
      },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        memorialOwner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Get memorial information for each support
    const supportsWithMemorials = await Promise.all(
      receivedSupports.map(async (support) => {
        // Find the memorial this support was received for
        const memorial = await prisma.memorial.findFirst({
          where: {
            ownerId: support.memorialOwnerId,
          },
          select: {
            id: true,
            slug: true,
            firstName: true,
            lastName: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        });

        return {
          id: support.id,
          amount: support.amount,
          currency: support.currency,
          message: support.message,
          donorName: support.donorName,
          donorEmail: support.donorEmail,
          accountType: support.accountType,
          createdAt: support.createdAt.toISOString(),
          memorial,
          memorialOwner: support.memorialOwner,
          donor: support.donor,
        };
      })
    );

    return NextResponse.json({
      success: true,
      supports: supportsWithMemorials,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching received supports:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch received supports",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
