/**
 * Admin Stats API
 * GET /api/admin/stats
 * Returns dashboard statistics
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import log from "@/lib/logger";

export async function GET() {
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

    // Get date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Fetch all stats in parallel
    const [
      totalUsers,
      verifiedUsers,
      totalRevenue,
      totalPayments,
      activeSubscriptions,
      usersToday,
      usersThisMonth,
      usersLastMonth,
      revenueThisMonth,
      revenueLastMonth,
      recentSignups,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Verified users
      prisma.user.count({
        where: { emailVerified: { not: null } },
      }),

      // Total revenue (successful payments only)
      prisma.payment.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true },
      }),

      // Total payments
      prisma.payment.count({
        where: { status: "SUCCESS" },
      }),

      // Active subscriptions
      prisma.subscription.count({
        where: { status: "ACTIVE" },
      }),

      // Users registered today
      prisma.user.count({
        where: { createdAt: { gte: today } },
      }),

      // Users registered this month
      prisma.user.count({
        where: { createdAt: { gte: thisMonth } },
      }),

      // Users registered last month
      prisma.user.count({
        where: {
          createdAt: { gte: lastMonth, lte: lastMonthEnd },
        },
      }),

      // Revenue this month
      prisma.payment.aggregate({
        where: {
          status: "SUCCESS",
          createdAt: { gte: thisMonth },
        },
        _sum: { amount: true },
      }),

      // Revenue last month
      prisma.payment.aggregate({
        where: {
          status: "SUCCESS",
          createdAt: { gte: lastMonth, lte: lastMonthEnd },
        },
        _sum: { amount: true },
      }),

      // Recent signups (last 10)
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          createdAt: true,
          currentPlan: {
            select: {
              name: true,
              slug: true,
            },
          },
          payments: {
            where: { status: "SUCCESS" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              amount: true,
              selectedCurrency: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    // Calculate growth percentages
    const userGrowth =
      usersLastMonth > 0 ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100 : 100;

    const revenueGrowth =
      revenueLastMonth._sum.amount && Number(revenueLastMonth._sum.amount) > 0
        ? ((Number(revenueThisMonth._sum.amount || 0) - Number(revenueLastMonth._sum.amount)) /
            Number(revenueLastMonth._sum.amount)) *
          100
        : 100;

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
        },
        growth: {
          usersToday,
          usersThisMonth,
          usersLastMonth,
          userGrowth: Math.round(userGrowth * 100) / 100,
          revenueThisMonth: Number(revenueThisMonth._sum.amount || 0),
          revenueLastMonth: Number(revenueLastMonth._sum.amount || 0),
          revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        },
        recentSignups: recentSignups.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          verified: !!user.emailVerified,
          plan: user.currentPlan?.name || "No Plan",
          amount: user.payments[0]?.amount
            ? `${user.payments[0].amount} ${user.payments[0].selectedCurrency}`
            : "N/A",
          signupDate: user.createdAt,
        })),
      },
    });
  } catch (error) {
    log.error("[ADMIN STATS ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}
