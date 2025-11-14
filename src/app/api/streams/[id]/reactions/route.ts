import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { LivestreamReactionType } from "@/generated/prisma";

/**
 * POST /api/streams/[id]/reactions
 * Add a reaction to a stream
 * Body: { type: LivestreamReactionType, anonymousName?: string }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const streamId = params.id;
    const body = await req.json();
    const { type } = body;

    if (!type || !Object.values(LivestreamReactionType).includes(type)) {
      return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
    }

    // Check if stream exists
    const stream = await prisma.memorialStream.findUnique({
      where: { id: streamId },
      select: {
        id: true,
        allowAnonymous: true,
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (!session?.user && !stream.allowAnonymous) {
      return NextResponse.json({ error: "Anonymous reactions not allowed" }, { status: 403 });
    }

    // Create reaction
    const sessionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const reaction = await prisma.streamReaction.create({
      data: {
        streamId,
        userId: session?.user?.id,
        type,
        sessionId,
        timestamp: null, // Will be set during playback for live reactions
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

    return NextResponse.json({ reaction }, { status: 201 });
  } catch (error) {
    console.error("Error adding reaction:", error);
    return NextResponse.json({ error: "Failed to add reaction" }, { status: 500 });
  }
}

/**
 * GET /api/streams/[id]/reactions
 * Get reactions for a stream
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const streamId = params.id;

    // Get reaction counts by type
    const reactionCounts = await prisma.streamReaction.groupBy({
      by: ["type"],
      where: { streamId },
      _count: {
        type: true,
      },
    });

    // Get recent reactions
    const recentReactions = await prisma.streamReaction.findMany({
      where: { streamId },
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
        timestamp: "desc",
      },
      take: 50,
    });

    return NextResponse.json({
      counts: reactionCounts,
      recent: recentReactions,
    });
  } catch (error) {
    console.error("Error fetching reactions:", error);
    return NextResponse.json({ error: "Failed to fetch reactions" }, { status: 500 });
  }
}
