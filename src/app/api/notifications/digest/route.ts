import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { renderNotificationDigestEmail } from "@/lib/emailTemplates/notificationDigest";

/**
 * POST /api/notifications/digest
 * Generate and send notification digest email
 * Query params: period=daily|weekly
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get period from query params
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get("period") as "daily" | "weekly") || "daily";

    // Get user with notification preferences
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now);
    if (period === "daily") {
      startDate.setDate(now.getDate() - 1);
    } else {
      startDate.setDate(now.getDate() - 7);
    }

    // Fetch notifications from the period
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // If no notifications, don't send email
    if (notifications.length === 0) {
      return NextResponse.json({ message: "No notifications to send" }, { status: 200 });
    }

    // Count unread notifications
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    // Generate email HTML
    const emailHtml = await renderNotificationDigestEmail({
      userName: user.name || "User",
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        createdAt: n.createdAt.toISOString(),
      })),
      period,
      unreadCount,
    });

    // Send email
    await sendEmail({
      to: user.email,
      subject: `Your ${period === "daily" ? "Daily" : "Weekly"} Notification Digest`,
      html: emailHtml,
    });

    return NextResponse.json({
      message: "Digest sent successfully",
      notificationCount: notifications.length,
      unreadCount,
    });
  } catch (error) {
    console.error("Error sending notification digest:", error);
    return NextResponse.json({ error: "Failed to send digest" }, { status: 500 });
  }
}

/**
 * GET /api/notifications/digest
 * Preview digest email (for testing)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get("period") as "daily" | "weekly") || "daily";

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now);
    if (period === "daily") {
      startDate.setDate(now.getDate() - 1);
    } else {
      startDate.setDate(now.getDate() - 7);
    }

    // Fetch notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    // Generate and return HTML for preview
    const emailHtml = await renderNotificationDigestEmail({
      userName: user.name || "User",
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        createdAt: n.createdAt.toISOString(),
      })),
      period,
      unreadCount,
    });

    return new NextResponse(emailHtml, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error generating digest preview:", error);
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 });
  }
}
