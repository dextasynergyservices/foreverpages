import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/user/templates/active
 * Fetch user's active UserTemplate (if any)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Find the most recent active UserTemplate for this user
    const userTemplate = await prisma.userTemplate.findFirst({
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
            previewImage: true,
            supportedSections: true,
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
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (!userTemplate) {
      return NextResponse.json({ message: "No active template found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Active template retrieved",
      data: userTemplate,
    });
  } catch (error) {
    console.error("Error fetching active template:", error);
    return NextResponse.json({ message: "Failed to fetch active template" }, { status: 500 });
  }
}
