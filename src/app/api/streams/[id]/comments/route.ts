import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/streams/[id]/comments
 * Add a comment to a stream
 * Body: { content: string, anonymousName?: string }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id: streamId } = await params;
    const body = await req.json();
    const { content, anonymousName } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Comment content required" }, { status: 400 });
    }

    // Check if stream exists and allows comments
    const stream = await prisma.memorialStream.findUnique({
      where: { id: streamId },
      select: {
        id: true,
        allowComments: true,
        allowAnonymous: true,
        keywordBlacklist: true,
        slowModeInterval: true,
        blockedViewers: true,
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (!stream.allowComments) {
      return NextResponse.json({ error: "Comments are disabled" }, { status: 403 });
    }

    if (!session?.user && !stream.allowAnonymous) {
      return NextResponse.json({ error: "Anonymous comments not allowed" }, { status: 403 });
    }

    // Check if user is blocked
    const userId = session?.user?.id || "anonymous";
    if (stream.blockedViewers && stream.blockedViewers.includes(userId)) {
      return NextResponse.json({ error: "You are blocked from commenting" }, { status: 403 });
    }

    // Check slow mode
    if (stream.slowModeInterval && stream.slowModeInterval > 0) {
      const lastComment = await prisma.streamComment.findFirst({
        where: {
          streamId,
          userId: session?.user?.id || undefined,
          authorEmail: !session?.user?.id ? session?.user?.email || null : undefined,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          createdAt: true,
        },
      });

      if (lastComment) {
        const timeSinceLastComment = Date.now() - lastComment.createdAt.getTime();
        const slowModeMs = stream.slowModeInterval * 1000;

        if (timeSinceLastComment < slowModeMs) {
          const waitTimeSeconds = Math.ceil((slowModeMs - timeSinceLastComment) / 1000);
          return NextResponse.json(
            {
              error: "Slow mode active",
              message: `Please wait ${waitTimeSeconds} seconds before commenting again`,
              waitTime: waitTimeSeconds,
            },
            { status: 429 }
          );
        }
      }
    }

    // Check keyword blacklist
    let isHidden = false;
    let moderationReason: string | null = null;

    if (stream.keywordBlacklist && stream.keywordBlacklist.length > 0) {
      const contentLower = content.toLowerCase();
      const foundKeyword = stream.keywordBlacklist.find((keyword: string) =>
        contentLower.includes(keyword.toLowerCase())
      );

      if (foundKeyword) {
        isHidden = true;
        moderationReason = `Contains blacklisted word: "${foundKeyword}"`;
      }
    }

    // Create comment
    const displayName = session?.user?.name || anonymousName || "Anonymous";

    const comment = await prisma.streamComment.create({
      data: {
        streamId,
        userId: session?.user?.id,
        content: content.trim(),
        authorName: displayName,
        authorEmail: session?.user?.email || null,
        timestamp: null, // Will be set during playback for live comments
        isHidden,
        moderationReason,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Update comment count
    await prisma.memorialStream.update({
      where: { id: streamId },
      data: {
        totalComments: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Error adding comment:", error);
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json(
        { error: "Failed to add comment", details: String(error) },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}

/**
 * GET /api/streams/[id]/comments
 * Get comments for a stream
 * Query params: limit (default 100), offset (default 0)
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: streamId } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const comments = await prisma.streamComment.findMany({
      where: {
        streamId,
        isHidden: false, // Don't show hidden comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        timestamp: "asc",
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.streamComment.count({
      where: {
        streamId,
        isHidden: false,
      },
    });

    return NextResponse.json({
      comments,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json(
        { error: "Failed to fetch comments", details: String(error) },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}
