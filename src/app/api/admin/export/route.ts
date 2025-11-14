/**
 * Admin Export API
 * GET /api/admin/export
 * Returns CSV export of signups
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

    // Get query parameters for filtering
    const searchParams = req.nextUrl.searchParams;
    const planId = searchParams.get("planId") || "";
    const verified = searchParams.get("verified") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

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

    // Fetch all users matching criteria
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emailVerified: true,
        createdAt: true,
        currentPlan: {
          select: {
            name: true,
          },
        },
        payments: {
          where: { status: "SUCCESS" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            amount: true,
            selectedCurrency: true,
            paystackReference: true,
            createdAt: true,
          },
        },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            status: true,
            expiresAt: true,
          },
        },
      },
    });

    // Generate CSV
    const csvHeaders = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Plan",
      "Amount",
      "Currency",
      "Payment Reference",
      "Verified",
      "Verified At",
      "Subscription Status",
      "Subscription Expires",
      "Signup Date",
    ];

    const csvRows = users.map((user) => [
      user.id,
      user.name || "",
      user.email,
      user.phone || "",
      user.currentPlan?.name || "No Plan",
      user.payments[0]?.amount.toString() || "",
      user.payments[0]?.selectedCurrency || "",
      user.payments[0]?.paystackReference || "",
      user.emailVerified ? "Yes" : "No",
      user.emailVerified ? new Date(user.emailVerified).toISOString() : "",
      user.subscriptions[0]?.status || "",
      user.subscriptions[0]?.expiresAt
        ? new Date(user.subscriptions[0].expiresAt).toISOString()
        : "",
      new Date(user.createdAt).toISOString(),
    ]);

    // Convert to CSV string
    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="signups_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("[ADMIN EXPORT ERROR]", error);
    return NextResponse.json({ success: false, error: "Failed to export data" }, { status: 500 });
  }
}
