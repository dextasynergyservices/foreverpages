import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/memorials/check-slug?slug=example-slug
 * Check if a memorial slug is available
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Slug is required", available: false }, { status: 400 });
    }

    // Check if slug meets format requirements
    if (slug.length < 3 || slug.length > 50) {
      return NextResponse.json(
        { error: "Slug must be 3-50 characters", available: false },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return NextResponse.json(
        {
          error: "Slug can only contain letters, numbers, hyphens, and underscores",
          available: false,
        },
        { status: 400 }
      );
    }

    // Check if slug exists in database
    const existing = await prisma.memorial.findUnique({
      where: { slug },
      select: { id: true },
    });

    return NextResponse.json({
      available: !existing,
      slug,
    });
  } catch (error) {
    console.error("Error checking slug availability:", error);
    return NextResponse.json(
      { error: "Failed to check slug availability", available: false },
      { status: 500 }
    );
  }
}
