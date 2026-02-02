import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const condolenceSchema = z.object({
  content: z.string().min(1, "Message is required").max(5000),
  isAnonymous: z.boolean().optional().default(false),
});

/**
 * GET: Fetch all condolence posts for a memorial
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug: memorialId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    // Verify memorial exists and is accessible
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: {
        id: true,
        ownerId: true,
        visibility: true,
      },
    });

    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    // For private memorials, verify access
    if (memorial.visibility === "PRIVATE") {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Check if user is owner or has access via invitation
      if (memorial.ownerId !== session.user.id) {
        const hasAccess = await prisma.invitation.findFirst({
          where: {
            memorialId,
            invitedUserId: session.user.id,
            status: "ACCEPTED",
          },
        });

        if (!hasAccess) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }
    }

    // Fetch condolence posts with author and comments
    const [condolences, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: {
          memorialId,
          type: "CONDOLENCE",
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
            take: 5,
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.post.count({
        where: {
          memorialId,
          type: "CONDOLENCE",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: condolences,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + condolences.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching condolences:", error);
    return NextResponse.json({ error: "Failed to fetch condolences" }, { status: 500 });
  }
}

/**
 * POST: Create a new condolence post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: memorialId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify memorial exists and user has access
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: {
        id: true,
        ownerId: true,
        visibility: true,
        deceasedFirstName: true,
        deceasedLastName: true,
      },
    });

    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    // For private memorials, verify access
    if (memorial.visibility === "PRIVATE") {
      if (memorial.ownerId !== session.user.id) {
        const hasAccess = await prisma.invitation.findFirst({
          where: {
            memorialId,
            invitedUserId: session.user.id,
            status: "ACCEPTED",
          },
        });

        if (!hasAccess) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }
    }

    const body = await request.json();
    const validatedData = condolenceSchema.parse(body);

    // Create the condolence post
    const condolence = await prisma.post.create({
      data: {
        content: validatedData.content,
        type: "CONDOLENCE",
        isAnonymous: validatedData.isAnonymous,
        memorialId,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        comments: true,
        _count: {
          select: { comments: true },
        },
      },
    });

    // Notify memorial owner if different from author
    if (memorial.ownerId !== session.user.id) {
      try {
        await prisma.notification.create({
          data: {
            type: "NEW_TRIBUTE", // Using NEW_TRIBUTE for condolences
            title: "New Condolence Message",
            message: `${validatedData.isAnonymous ? "Someone" : session.user.name || "A visitor"} left a condolence message on the memorial for ${memorial.deceasedFirstName} ${memorial.deceasedLastName}`,
            userId: memorial.ownerId,
            relatedId: condolence.id,
            relatedType: "POST",
          },
        });
      } catch (notificationError) {
        console.error("Failed to create notification:", notificationError);
        // Don't fail the whole request if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      data: condolence,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating condolence:", error);
    return NextResponse.json({ error: "Failed to create condolence" }, { status: 500 });
  }
}

/**
 * DELETE: Delete a condolence post
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: memorialId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    // Verify memorial exists
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { ownerId: true },
    });

    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    // Find the post
    const post = await prisma.post.findUnique({
      where: { id: postId, memorialId, type: "CONDOLENCE" },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Condolence not found" }, { status: 404 });
    }

    // Check if user can delete (author or memorial owner)
    if (post.authorId !== session.user.id && memorial.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete the post (cascade will handle comments)
    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({
      success: true,
      message: "Condolence deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting condolence:", error);
    return NextResponse.json({ error: "Failed to delete condolence" }, { status: 500 });
  }
}
