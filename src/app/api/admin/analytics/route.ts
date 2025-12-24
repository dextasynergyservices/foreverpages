/**
 * Admin Analytics API
 * GET /api/admin/analytics
 * Returns comprehensive analytics data with time-series for charts
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import log from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true },
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Get query params for date range
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "30d"; // 7d, 30d, 90d, 1y

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let startDate: Date;
    let previousStartDate: Date;
    let groupByFormat: "day" | "week" | "month" = "day";

    switch (range) {
      case "7d":
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
        groupByFormat = "day";
        break;
      case "90d":
        startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000);
        groupByFormat = "week";
        break;
      case "1y":
        startDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(today.getTime() - 730 * 24 * 60 * 60 * 1000);
        groupByFormat = "month";
        break;
      default: // 30d
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
        groupByFormat = "day";
    }

    // Fetch all data in parallel
    const [
      // Overview stats
      totalUsers,
      verifiedUsers,
      totalRevenue,
      totalPayments,
      activeSubscriptions,
      totalMemorials,
      totalTemplates,

      // Users time series (fetch raw dates for in-memory grouping)
      usersTimeSeries,
      previousPeriodUsersCount,

      // Revenue time series (fetch raw dates/amounts for in-memory grouping)
      revenueTimeSeries,
      previousPeriodRevenueSum,

      // Plan distribution
      planDistribution,

      // Memorial stats - Count separately since there's no MemorialStats model
      memorialsPublished,
      memorialsDraft,
      memorialsPublic,
      memorialsPrivate,

      // Recent activity
      recentPayments,
      recentSignups,

      // Template usage
      templateUsage,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Verified users
      prisma.user.count({ where: { emailVerified: { not: null } } }),

      // Total revenue
      prisma.payment.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true },
      }),

      // Total payments
      prisma.payment.count({ where: { status: "SUCCESS" } }),

      // Active subscriptions
      prisma.subscription.count({ where: { status: "ACTIVE" } }),

      // Total memorials
      prisma.memorial.count(),

      // Total templates
      prisma.template.count({ where: { isActive: true } }),

      // Users time series (current period)
      prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),

      // Previous period users count
      prisma.user.count({
        where: { createdAt: { gte: previousStartDate, lt: startDate } },
      }),

      // Revenue time series (current period)
      prisma.payment.findMany({
        where: { status: "SUCCESS", createdAt: { gte: startDate } },
        select: { createdAt: true, amount: true },
        orderBy: { createdAt: "asc" },
      }),

      // Previous period revenue sum
      prisma.payment.aggregate({
        where: {
          status: "SUCCESS",
          createdAt: { gte: previousStartDate, lt: startDate },
        },
        _sum: { amount: true },
      }),

      // Plan distribution - groupBy is valid for relation IDs
      // Note: We'll need to fetch Plan names separately
      prisma.user.groupBy({
        by: ["currentPlanId"],
        _count: true,
        where: { currentPlanId: { not: null } },
      }),

      // Memorial statistics (Manual counts since groupBy status isn't reliable if key doesn't exist)
      prisma.memorial.count({ where: { isPublished: true } }),
      prisma.memorial.count({ where: { isPublished: false } }),
      prisma.memorial.count({ where: { visibility: "PUBLIC" } }),
      prisma.memorial.count({ where: { visibility: "PRIVATE" } }),

      // Recent payments
      prisma.payment.findMany({
        where: { status: "SUCCESS" },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          selectedCurrency: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          plan: { select: { name: true } },
        },
      }),

      // Recent signups
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          createdAt: true,
          currentPlan: { select: { name: true } },
        },
      }),

      // Template usage - groupBy baseTemplateId
      prisma.userTemplate.groupBy({
        by: ["baseTemplateId"],
        _count: true,
        orderBy: { _count: { baseTemplateId: "desc" } },
        take: 5,
      }),
    ]);

    // Process users time series into chart data (In-memory aggregation)
    const userChartData = aggregateTimeSeries(
      usersTimeSeries.map((u) => ({ date: u.createdAt, value: 1 })),
      groupByFormat,
      startDate,
      now
    );

    // Process revenue time series into chart data (In-memory aggregation)
    const revenueChartData = aggregateTimeSeries(
      revenueTimeSeries.map((p) => ({ date: p.createdAt, value: Number(p.amount) })),
      groupByFormat,
      startDate,
      now
    );

    // Get plan names for distribution
    const planIds = planDistribution
      .map((p) => p.currentPlanId)
      .filter((id): id is string => id !== null);

    const plans = await prisma.plan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true },
    });

    const planMap = new Map(plans.map((p) => [p.id, p.name]));
    const planChartData = planDistribution.map((p) => ({
      name: (p.currentPlanId && planMap.get(p.currentPlanId)) || "Unknown",
      value: p._count,
    }));

    // Get template names for usage
    const templateIds = templateUsage.map((t) => t.baseTemplateId);
    const templates = await prisma.template.findMany({
      where: { id: { in: templateIds } },
      select: { id: true, name: true },
    });
    const templateMap = new Map(templates.map((t) => [t.id, t.name]));
    const templateChartData = templateUsage.map((t) => ({
      name: templateMap.get(t.baseTemplateId) || "Unknown",
      value: t._count,
    }));

    // Calculate growth percentages
    const currentPeriodUsersCount = usersTimeSeries.length;
    const userGrowth =
      previousPeriodUsersCount > 0
        ? ((currentPeriodUsersCount - previousPeriodUsersCount) / previousPeriodUsersCount) * 100
        : 100;

    const currentPeriodRevenue = revenueTimeSeries.reduce(
      (acc, item) => acc + Number(item.amount || 0),
      0
    );
    const prevRevenue = Number(previousPeriodRevenueSum._sum.amount || 0);
    const revenueGrowth =
      prevRevenue > 0 ? ((currentPeriodRevenue - prevRevenue) / prevRevenue) * 100 : 100;

    // Memorial chart data construction
    const memorialChartData = [
      { name: "Published", value: memorialsPublished },
      { name: "Drafts", value: memorialsDraft },
      { name: "Public", value: memorialsPublic },
      { name: "Private", value: memorialsPrivate },
    ];

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          verifiedUsers,
          verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
          totalRevenue: Number(totalRevenue._sum.amount || 0),
          totalPayments,
          activeSubscriptions,
          totalMemorials,
          totalTemplates,
        },
        growth: {
          users: {
            current: currentPeriodUsersCount,
            previous: previousPeriodUsersCount,
            percentage: Math.round(userGrowth * 100) / 100,
          },
          revenue: {
            current: currentPeriodRevenue,
            previous: prevRevenue,
            percentage: Math.round(revenueGrowth * 100) / 100,
          },
        },
        charts: {
          users: userChartData,
          revenue: revenueChartData,
          plans: planChartData,
          memorials: memorialChartData,
          templates: templateChartData,
        },
        recentActivity: {
          payments: recentPayments.map((p) => ({
            id: p.id,
            amount: Number(p.amount),
            currency: p.selectedCurrency,
            userName: p.user?.name || "Unknown",
            userEmail: p.user?.email || "",
            planName: p.plan?.name || "Unknown",
            date: p.createdAt,
          })),
          signups: recentSignups.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            verified: !!u.emailVerified,
            plan: u.currentPlan?.name || "No Plan",
            date: u.createdAt,
          })),
        },
      },
    });
  } catch (error) {
    log.error("[ADMIN ANALYTICS ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

// Helper function to aggregate time series data in-memory
function aggregateTimeSeries(
  dataItems: Array<{ date: Date; value: number }>,
  format: "day" | "week" | "month",
  startDate: Date,
  endDate: Date
): Array<{ date: string; value: number }> {
  const result: Map<string, number> = new Map();

  // Initialize all buckets with 0
  const current = new Date(startDate);
  // Clone to iterate without modifying startDate
  const iterDate = new Date(current);

  // Set time to start of day to avoid partial day comparison issues
  iterDate.setHours(0, 0, 0, 0);
  const endDateTime = endDate.getTime();

  while (iterDate.getTime() <= endDateTime) {
    const key = formatDate(iterDate, format);
    // Only set if not already set (for week/month granularity which might hit same key multiple times if not careful, though the loop increment handles it)
    if (!result.has(key)) {
      result.set(key, 0);
    }

    if (format === "day") {
      iterDate.setDate(iterDate.getDate() + 1);
    } else if (format === "week") {
      iterDate.setDate(iterDate.getDate() + 7);
    } else {
      iterDate.setMonth(iterDate.getMonth() + 1);
    }
  }

  // Aggregate data points
  for (const item of dataItems) {
    const key = formatDate(new Date(item.date), format);
    // If the date falls within our range but somehow wasn't initialized (e.g. edge cases), careful
    // But generally keys should match if formatDate is consistent.
    const currentVal = result.get(key) || 0;
    result.set(key, currentVal + item.value);
  }

  // Convert map to array of objects
  return Array.from(result.entries()).map(([date, value]) => ({ date, value }));
}

// Format date helper
function formatDate(date: Date, format: "day" | "week" | "month"): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  if (format === "day") {
    return `${months[date.getMonth()]} ${date.getDate()}`;
  } else if (format === "week") {
    // For weekly, maybe show "MMM DD" of the start of week
    return `${months[date.getMonth()]} ${date.getDate()}`;
  } else {
    // Monthly
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }
}
