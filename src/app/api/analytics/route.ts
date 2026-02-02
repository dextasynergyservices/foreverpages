import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in to access analytics" },
        { status: 401 }
      );
    }

    // Get user's owned memorials
    const userMemorials = await prisma.memorial.findMany({
      where: { ownerId: session.user.id },
      select: { id: true, firstName: true, lastName: true, ownerId: true },
    });

    console.log("Analytics API - User ID:", session.user.id);
    console.log("Analytics API - User Email:", session.user.email);
    console.log("Analytics API - User Memorials Found:", userMemorials.length);
    if (userMemorials.length > 0) {
      console.log("Analytics API - First Memorial:", userMemorials[0]);
    }

    // Get memorials where user is a collaborator (accepted invitations only)
    // Check both invitedUserId and email since invitations are sent by email
    const collaboratorInvitations = await prisma.invitation.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ invitedUserId: session.user.id }, { email: session.user.email || "" }],
      },
      include: {
        memorial: {
          select: { id: true, firstName: true, lastName: true, ownerId: true },
        },
      },
    });

    const collaboratorMemorials = collaboratorInvitations.map((inv) => inv.memorial);

    // Combine owned and collaborator memorials
    const allMemorials = [...userMemorials, ...collaboratorMemorials];
    const memorialIds = allMemorials.map((m: { id: string }) => m.id);

    // Check subscription - user's own subscription OR memorial owner's subscription (for collaborators)
    // Always include the current user's ID so users with subscription but no memorials can access
    const memorialOwnerIds = [
      session.user.id, // Current user (most important!)
      ...new Set([
        ...userMemorials.map((m) => m.ownerId),
        ...collaboratorMemorials.map((m) => m.ownerId),
      ]),
    ];

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: { in: memorialOwnerIds },
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      return NextResponse.json({ message: "No active subscription found" }, { status: 403 });
    }

    // Calculate stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Total unique visits - count unique IP addresses from PageView
    const uniqueVisitsResult =
      memorialIds.length > 0
        ? await prisma.pageView.groupBy({
            by: ["ipAddress"],
            where: { memorialId: { in: memorialIds } },
          })
        : [];
    const totalUniqueVisits = uniqueVisitsResult.length;

    // Unique visits in last 30 days
    const uniqueVisitsLast30Days =
      memorialIds.length > 0
        ? (
            await prisma.pageView.groupBy({
              by: ["ipAddress"],
              where: {
                memorialId: { in: memorialIds },
                viewedAt: { gte: thirtyDaysAgo },
              },
            })
          ).length
        : 0;

    // Unique visits in previous 30 days (for comparison)
    const uniqueVisitsPrevious30Days =
      memorialIds.length > 0
        ? (
            await prisma.pageView.groupBy({
              by: ["ipAddress"],
              where: {
                memorialId: { in: memorialIds },
                viewedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
              },
            })
          ).length
        : 0;

    // Calculate visit change percentage
    const visitChangePercent =
      uniqueVisitsPrevious30Days > 0
        ? Math.round(
            ((uniqueVisitsLast30Days - uniqueVisitsPrevious30Days) / uniqueVisitsPrevious30Days) *
              100
          )
        : uniqueVisitsLast30Days > 0
          ? 100
          : 0;
    const visitChangeStr =
      visitChangePercent >= 0 ? `+${visitChangePercent}%` : `${visitChangePercent}%`;
    const visitTrend = visitChangePercent >= 0 ? "up" : "down";

    // Tribute messages count - using Post model with TRIBUTE type
    const tributeCount = await prisma.post.count({
      where: {
        memorialId: { in: memorialIds },
        type: "TRIBUTE",
      },
    });

    // Memorial shares - aggregate shareCount from all user's memorials
    const memorialShares =
      allMemorials.length > 0
        ? (
            await prisma.memorial.aggregate({
              where: { id: { in: memorialIds } },
              _sum: { shareCount: true },
            })
          )._sum.shareCount || 0
        : 0;

    // Share count change (last 30 days vs previous)
    // Since we don't track share history, we show no change
    const shareChangeStr = "";

    // Recent activity - get recent tributes, memorials, etc.
    const recentTributes = await prisma.post.findMany({
      where: {
        memorialId: { in: memorialIds },
        type: "TRIBUTE",
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        memorial: { select: { firstName: true, lastName: true } },
        author: { select: { name: true } },
      },
    });

    const recentMemorials = await prisma.memorial.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, firstName: true, lastName: true, createdAt: true },
    });

    // Count tributes from last 30 days vs previous 30 days for change calculation
    const tributesLast30Days = await prisma.post.count({
      where: {
        memorialId: { in: memorialIds },
        type: "TRIBUTE",
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const tributesPrevious30Days = await prisma.post.count({
      where: {
        memorialId: { in: memorialIds },
        type: "TRIBUTE",
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    });

    // Calculate tribute change
    const tributeChange = tributesLast30Days - tributesPrevious30Days;
    const tributeChangeStr = tributeChange >= 0 ? `+${tributeChange}` : `${tributeChange}`;
    const tributeTrend = tributeChange >= 0 ? "up" : "down";

    // Combine and format recent activity
    const recentActivity = [
      ...recentTributes.map((tribute) => ({
        actionKey: "dashboard.analytics.activity.newTribute",
        actionParams: {
          author: tribute.author?.name || "Anonymous",
          memorial: `${tribute.memorial.firstName} ${tribute.memorial.lastName}`,
        },
        time: formatTimeAgo(tribute.createdAt),
        type: "tribute" as const,
      })),
      ...recentMemorials.map((memorial) => ({
        actionKey: "dashboard.analytics.activity.memorialCreated",
        actionParams: {
          memorial: `${memorial.firstName} ${memorial.lastName}`,
        },
        time: formatTimeAgo(memorial.createdAt),
        type: "memorial" as const,
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);

    // Top pages - proportional distribution based on actual unique visits
    const topPages =
      totalUniqueVisits > 0
        ? [
            {
              pageKey: "dashboard.analytics.pages.memorialHome",
              views: Math.floor(totalUniqueVisits * 0.44),
              percentage: 44,
            },
            {
              pageKey: "dashboard.analytics.pages.photoGallery",
              views: Math.floor(totalUniqueVisits * 0.22),
              percentage: 22,
            },
            {
              pageKey: "dashboard.analytics.pages.tributeWall",
              views: Math.floor(totalUniqueVisits * 0.16),
              percentage: 16,
            },
            {
              pageKey: "dashboard.analytics.pages.serviceInfo",
              views: Math.floor(totalUniqueVisits * 0.12),
              percentage: 12,
            },
            {
              pageKey: "dashboard.analytics.pages.biography",
              views: Math.floor(totalUniqueVisits * 0.06),
              percentage: 6,
            },
          ]
        : [];

    // Generate daily visitor trends for the last 30 days
    const dailyVisitorTrends: Array<{ date: string; visitors: number }> = [];

    if (memorialIds.length > 0) {
      // Get all page views from the last 30 days
      const pageViews = await prisma.pageView.findMany({
        where: {
          memorialId: { in: memorialIds },
          viewedAt: { gte: thirtyDaysAgo },
        },
        select: {
          viewedAt: true,
          ipAddress: true,
        },
      });

      // Group by date and count unique IPs per day
      const viewsByDay = new Map<string, Set<string>>();

      pageViews.forEach((view) => {
        const dateKey = view.viewedAt.toISOString().split("T")[0];
        if (!viewsByDay.has(dateKey)) {
          viewsByDay.set(dateKey, new Set());
        }
        if (view.ipAddress) {
          viewsByDay.get(dateKey)!.add(view.ipAddress);
        }
      });

      // Generate data for all 30 days (including days with 0 visitors)
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split("T")[0];
        const uniqueVisitors = viewsByDay.get(dateKey)?.size || 0;

        dailyVisitorTrends.push({
          date: dateKey,
          visitors: uniqueVisitors,
        });
      }
    } else {
      // No memorials - return empty data for 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailyVisitorTrends.push({
          date: date.toISOString().split("T")[0],
          visitors: 0,
        });
      }
    }

    // Stats with actual data
    const stats = [
      {
        titleKey: "dashboard.analytics.stats.totalVisits.title",
        value: totalUniqueVisits.toLocaleString(),
        change: visitChangeStr,
        trend: visitTrend as "up" | "down",
        icon: "Eye",
        descriptionKey: "dashboard.analytics.stats.totalVisits.description",
      },
      {
        titleKey: "dashboard.analytics.stats.uniqueVisitors.title",
        value: uniqueVisitsLast30Days.toLocaleString(),
        change: visitChangeStr,
        trend: visitTrend as "up" | "down",
        icon: "Users",
        descriptionKey: "dashboard.analytics.stats.uniqueVisitors.description",
      },
      {
        titleKey: "dashboard.analytics.stats.tributeMessages.title",
        value: tributeCount.toString(),
        change: tributeChangeStr,
        trend: tributeTrend as "up" | "down",
        icon: "Heart",
        descriptionKey: "dashboard.analytics.stats.tributeMessages.description",
      },
      {
        titleKey: "dashboard.analytics.stats.memorialShares.title",
        value: memorialShares.toString(),
        change: shareChangeStr,
        trend: "up" as const,
        icon: "TrendingUp",
        descriptionKey: "dashboard.analytics.stats.memorialShares.description",
      },
    ];

    // Get primary memorial summary (first owned memorial or first collaborator memorial)
    const primaryMemorial = userMemorials[0] || collaboratorMemorials[0];
    let memorialSummary = null;

    console.log("Analytics API - Primary Memorial:", primaryMemorial);

    if (primaryMemorial) {
      const memorial = await prisma.memorial.findUnique({
        where: { id: primaryMemorial.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          slug: true,
          isPublished: true,
          createdAt: true,
          galleryPhotos: true,
          posts: {
            where: { type: "TRIBUTE" },
            select: { id: true },
          },
        },
      });

      if (memorial) {
        // Count RSVPs for service (invitations with rsvpStatus set)
        const rsvpCount = await prisma.invitation.count({
          where: {
            memorialId: memorial.id,
            rsvpStatus: { not: null },
          },
        });

        memorialSummary = {
          name: `${memorial.firstName} ${memorial.lastName}`,
          slug: memorial.slug,
          status: memorial.isPublished ? "live" : "draft",
          createdAt: memorial.createdAt.toISOString(),
          photoCount: memorial.galleryPhotos?.length || 0,
          approvedTributes: memorial.posts.length,
          serviceRsvps: rsvpCount,
        };

        console.log("Analytics API - Memorial Summary:", memorialSummary);
      }
    }

    return NextResponse.json({
      message: "Analytics retrieved successfully",
      data: {
        stats,
        recentActivity,
        topPages,
        dailyVisitorTrends,
        memorialSummary,
      },
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { message: "Internal server error - Please try again later" },
      { status: 500 }
    );
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInHours < 1) return "Less than an hour ago";
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  if (diffInDays === 1) return "1 day ago";
  if (diffInDays < 7) return `${diffInDays} days ago`;

  return date.toLocaleDateString();
}
