import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/streams/[id]/analytics
 * Get stream analytics and metrics
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const streamId = params.id;

    // Check if stream exists
    const stream = await prisma.memorialStream.findUnique({
      where: { id: streamId },
      include: {
        memorial: {
          select: {
            ownerId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    // Get memorial to check ownership
    const memorial = await prisma.memorial.findUnique({
      where: { id: stream.memorialId },
      select: { ownerId: true },
    });

    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    // Only owner can see analytics
    if (session?.user?.id !== memorial.ownerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get viewer statistics
    const allViewers = await prisma.streamViewer.findMany({
      where: { streamId },
      select: { userId: true, guestName: true },
    });

    const totalUniqueViewers = new Set(allViewers.filter((v) => v.userId).map((v) => v.userId))
      .size;
    const anonymousViewers = allViewers.filter((v) => !v.userId && v.guestName).length;
    const registeredViewers = allViewers.filter((v) => v.userId).length;

    // Get engagement metrics
    const totalComments = await prisma.streamComment.count({
      where: { streamId },
    });

    const totalReactions = await prisma.streamReaction.count({
      where: { streamId },
    });

    // Get reaction breakdown
    const reactionBreakdown = await prisma.streamReaction.groupBy({
      by: ["type"],
      where: { streamId },
      _count: {
        type: true,
      },
    });

    // Get time-series analytics data
    const analyticsData = await prisma.streamAnalytics.findMany({
      where: { streamId },
      orderBy: {
        timestamp: "asc",
      },
    });

    // Calculate engagement rate
    const engagementRate =
      totalUniqueViewers > 0 ? ((totalComments + totalReactions) / totalUniqueViewers) * 100 : 0;

    // Calculate top moments (most engaged timestamps)
    const comments = await prisma.streamComment.findMany({
      where: { streamId },
      select: { createdAt: true, content: true },
    });

    const reactionsData = await prisma.streamReaction.findMany({
      where: { streamId },
      select: { createdAt: true },
    });

    // Group by 5-minute windows to find engagement spikes
    const momentMap = new Map<string, { viewers: number; comments: number; reactions: number }>();

    analyticsData.forEach((data) => {
      const timeKey = new Date(data.timestamp).toISOString().slice(0, 16); // Minute precision
      momentMap.set(timeKey, {
        viewers: data.concurrentViewers,
        comments: 0,
        reactions: 0,
      });
    });

    comments.forEach((comment) => {
      const timeKey = new Date(comment.createdAt).toISOString().slice(0, 16);
      const moment = momentMap.get(timeKey);
      if (moment) moment.comments += 1;
    });

    reactionsData.forEach((reaction) => {
      const timeKey = new Date(reaction.createdAt).toISOString().slice(0, 16);
      const moment = momentMap.get(timeKey);
      if (moment) moment.reactions += 1;
    });

    const topMoments = Array.from(momentMap.entries())
      .map(([timestamp, data]) => ({
        timestamp,
        viewers: data.viewers,
        comments: data.comments,
        reactions: data.reactions,
        engagementScore: data.comments * 2 + data.reactions + data.viewers * 0.1,
        description: `${data.comments} comments, ${data.reactions} reactions, ${data.viewers} viewers`,
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 5);

    // Simple sentiment analysis based on keywords
    const positiveKeywords = [
      "beautiful",
      "love",
      "wonderful",
      "amazing",
      "perfect",
      "thank",
      "bless",
      "peace",
      "rest",
      "honor",
      "remember",
      "cherish",
      "❤️",
      "🙏",
      "💙",
    ];
    const negativeKeywords = ["sad", "miss", "sorry", "grief", "pain", "loss", "difficult"];

    const commentTexts = comments.map((c) => c.content);
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;
    const topPositiveComments: string[] = [];
    const topNegativeComments: string[] = [];

    commentTexts.forEach((text) => {
      const lowerText = text.toLowerCase();
      const hasPositive = positiveKeywords.some((kw) => lowerText.includes(kw));
      const hasNegative = negativeKeywords.some((kw) => lowerText.includes(kw));

      if (hasPositive && !hasNegative) {
        positiveCount++;
        if (topPositiveComments.length < 5) topPositiveComments.push(text);
      } else if (hasNegative && !hasPositive) {
        negativeCount++;
        if (topNegativeComments.length < 5) topNegativeComments.push(text);
      } else {
        neutralCount++;
      }
    });

    const totalSentiment = positiveCount + neutralCount + negativeCount || 1;
    const sentiment = {
      positive: Math.round((positiveCount / totalSentiment) * 100),
      neutral: Math.round((neutralCount / totalSentiment) * 100),
      negative: Math.round((negativeCount / totalSentiment) * 100),
      topPositiveComments,
      topNegativeComments,
    };

    return NextResponse.json({
      analytics: {
        stream: {
          id: stream.id,
          title: stream.title,
          status: stream.status,
          startedAt: stream.startedAt,
          endedAt: stream.endedAt,
          duration: stream.actualDuration,
        },
        viewership: {
          peakViewers: stream.peakViewers,
          totalViews: stream.totalViews,
          totalUniqueViewers,
          anonymousViewers,
          registeredViewers,
          averageWatchTime: stream.averageWatchTime,
          replayViews: stream.replayViews,
        },
        engagement: {
          totalComments,
          totalReactions,
          engagementRate: Math.round(engagementRate * 100) / 100,
          reactionBreakdown: reactionBreakdown.map((r) => ({
            type: r.type,
            count: r._count.type,
          })),
        },
        timeline: analyticsData.map((data) => ({
          timestamp: data.timestamp,
          concurrentViewers: data.concurrentViewers,
          totalViewers: data.totalViewers,
          averageBitrate: data.averageBitrate,
          bufferRatio: data.bufferRatio,
        })),
        topMoments,
        sentiment,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
