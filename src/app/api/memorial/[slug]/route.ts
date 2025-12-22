import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json({ success: false, error: "Slug is required" }, { status: 400 });
    }

    // Get current user session (optional, for checking ownership)
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    // Fetch memorial with all related data
    const memorial = await prisma.memorial.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        userTemplate: {
          include: {
            baseTemplate: {
              select: {
                id: true,
                name: true,
                supportedSections: true,
              },
            },
          },
        },
        posts: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        comments: {
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        timeline: {
          orderBy: { date: "asc" },
        },
        family: true,
        candles: {
          take: 50,
        },
        flowers: {
          take: 50,
        },
        guestbook: {
          where: { isApproved: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!memorial) {
      return NextResponse.json({ success: false, error: "Memorial not found" }, { status: 404 });
    }

    // Check if memorial is published or if user is the owner
    const isOwner = currentUserId === memorial.ownerId;

    if (!memorial.isPublished && !isOwner) {
      return NextResponse.json(
        { success: false, error: "Memorial not found or not published" },
        { status: 404 }
      );
    }

    // Increment view count (skip if owner is viewing)
    if (!isOwner) {
      await prisma.memorial.update({
        where: { id: memorial.id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        memorial,
        isOwner,
      },
    });
  } catch (error) {
    console.error("Error fetching memorial:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch memorial",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// PATCH endpoint for updating memorial
export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const memorial = await prisma.memorial.findUnique({
      where: { slug },
      select: { id: true, ownerId: true, isPublished: true, publishedAt: true },
    });

    if (!memorial) {
      return NextResponse.json({ success: false, error: "Memorial not found" }, { status: 404 });
    }

    if (memorial.ownerId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { isPublished, ...updateData } = body;

    // Build the update data using Prisma's types
    const baseUpdateData = {
      ...updateData,
      lastEditedBy: session.user.id,
      lastEditedAt: new Date(),
      version: { increment: 1 },
    };

    // Handle publish/unpublish logic
    if (typeof isPublished === "boolean") {
      if (isPublished) {
        // Publishing: set isPublished and publishedAt if not already published
        baseUpdateData.isPublished = true;
        if (!memorial.isPublished && !memorial.publishedAt) {
          baseUpdateData.publishedAt = new Date();
        }
      } else {
        // Unpublishing: clear isPublished, slug, and publishedAt to return to draft state
        baseUpdateData.isPublished = false;
        baseUpdateData.slug = { set: null };
        baseUpdateData.publishedAt = { set: null };
      }
    }

    // Update memorial
    const updatedMemorial = await prisma.memorial.update({
      where: { slug },
      data: baseUpdateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedMemorial,
    });
  } catch (error) {
    console.error("Error updating memorial:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update memorial",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
