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

    // Check if user has any published memorials
    const publishedMemorial = await prisma.memorial.findFirst({
      where: {
        ownerId: session.user.id,
        isPublished: true,
      },
      select: {
        id: true,
        slug: true,
        firstName: true,
        lastName: true,
      },
    });

    return NextResponse.json({
      message: "Published status retrieved successfully",
      data: {
        hasPublished: !!publishedMemorial,
        publishedMemorial,
      },
    });
  } catch (error) {
    console.error("Error fetching published status:", error);
    return NextResponse.json({ message: "Failed to fetch published status" }, { status: 500 });
  }
}
