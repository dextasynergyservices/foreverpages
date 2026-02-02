import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface PreferencesBody {
  subscriptionId: string;
  tributeNotifications?: boolean;
  livestreamNotifications?: boolean;
  anniversaryNotifications?: boolean;
  systemNotifications?: boolean;
}

/**
 * PATCH /api/push/preferences
 * Update notification preferences for a subscription
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: PreferencesBody = await request.json();
    const { subscriptionId, ...preferences } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID required" }, { status: 400 });
    }

    // Verify ownership
    const subscription = await prisma.pushSubscription.findFirst({
      where: {
        id: subscriptionId,
        userId: user.id,
      },
    });

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Update preferences
    const updated = await prisma.pushSubscription.update({
      where: { id: subscriptionId },
      data: {
        ...(preferences.tributeNotifications !== undefined && {
          tributeNotifications: preferences.tributeNotifications,
        }),
        ...(preferences.livestreamNotifications !== undefined && {
          livestreamNotifications: preferences.livestreamNotifications,
        }),
        ...(preferences.anniversaryNotifications !== undefined && {
          anniversaryNotifications: preferences.anniversaryNotifications,
        }),
        ...(preferences.systemNotifications !== undefined && {
          systemNotifications: preferences.systemNotifications,
        }),
      },
      select: {
        id: true,
        tributeNotifications: true,
        livestreamNotifications: true,
        anniversaryNotifications: true,
        systemNotifications: true,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: updated,
    });
  } catch (error) {
    console.error("[PATCH /api/push/preferences] Error:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
