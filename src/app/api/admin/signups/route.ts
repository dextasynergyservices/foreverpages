/**
 * Admin Signups API
 * GET /api/admin/signups
 * Returns paginated list of signups with filters
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
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

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const planId = searchParams.get("planId") || "";
    const verified = searchParams.get("verified") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (planId) {
      where.currentPlanId = planId;
    }

    if (verified === "true") {
      where.emailVerified = { not: null };
    } else if (verified === "false") {
      where.emailVerified = null;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Fetch users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          emailVerified: true,
          createdAt: true,
          currentPlan: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          payments: {
            where: { status: "SUCCESS" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              amount: true,
              selectedCurrency: true,
              createdAt: true,
              paystackReference: true,
            },
          },
          subscriptions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              status: true,
              startDate: true,
              expiresAt: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users: users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          verified: !!user.emailVerified,
          verifiedAt: user.emailVerified,
          plan: {
            id: user.currentPlan?.id,
            name: user.currentPlan?.name || "No Plan",
            slug: user.currentPlan?.slug,
          },
          payment: user.payments[0]
            ? {
                id: user.payments[0].id,
                amount: Number(user.payments[0].amount),
                currency: user.payments[0].selectedCurrency,
                reference: user.payments[0].paystackReference,
                paidAt: user.payments[0].createdAt,
              }
            : null,
          subscription: user.subscriptions[0]
            ? {
                id: user.subscriptions[0].id,
                status: user.subscriptions[0].status,
                startDate: user.subscriptions[0].startDate,
                expiresAt: user.subscriptions[0].expiresAt,
              }
            : null,
          signupDate: user.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[ADMIN SIGNUPS ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch signups" }, { status: 500 });
  }
}
