import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface SubscriptionKeys {
  p256dh: string;
  auth: string;
}

interface PushSubscriptionBody {
  endpoint: string;
  keys: SubscriptionKeys;
  deviceType?: string;
}

/**
 * POST /api/push/subscribe
 * Subscribe to push notifications
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: PushSubscriptionBody = await request.json();
    const { endpoint, keys, deviceType } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 });
    }

    // Get user agent for device info
    const userAgent = request.headers.get("user-agent") || undefined;

    // Upsert subscription (update if exists, create if not)
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
        deviceType: deviceType || detectDeviceType(userAgent),
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
        deviceType: deviceType || detectDeviceType(userAgent),
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      message: "Push notifications enabled",
    });
  } catch (error) {
    console.error("[POST /api/push/subscribe] Error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe to push notifications" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/push/subscribe
 * Unsubscribe from push notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint required" }, { status: 400 });
    }

    // Delete subscription
    await prisma.pushSubscription.deleteMany({
      where: {
        userId: user.id,
        endpoint,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Push notifications disabled",
    });
  } catch (error) {
    console.error("[DELETE /api/push/subscribe] Error:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe from push notifications" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/push/subscribe
 * Get user's push subscriptions
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        deviceType: true,
        tributeNotifications: true,
        livestreamNotifications: true,
        anniversaryNotifications: true,
        systemNotifications: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("[GET /api/push/subscribe] Error:", error);
    return NextResponse.json({ error: "Failed to get subscriptions" }, { status: 500 });
  }
}

// Helper to detect device type from user agent
function detectDeviceType(userAgent?: string): string {
  if (!userAgent) return "unknown";

  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    if (/tablet|ipad/i.test(ua)) return "tablet";
    return "mobile";
  }
  return "desktop";
}
