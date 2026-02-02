import webpush, { WebPushError } from "web-push";
import { prisma } from "@/lib/prisma";

// Configure web-push with VAPID keys
// These should be generated once and stored in environment variables
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@foreverpages.online";

// Only configure if keys are available
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export type NotificationCategory = "tribute" | "livestream" | "anniversary" | "system";

interface SendPushOptions {
  userId: string;
  payload: PushPayload;
  category: NotificationCategory;
}

interface SendPushToMultipleOptions {
  userIds: string[];
  payload: PushPayload;
  category: NotificationCategory;
}

/**
 * Send push notification to a specific user
 */
export async function sendPushNotification({
  userId,
  payload,
  category,
}: SendPushOptions): Promise<{ sent: number; failed: number }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("VAPID keys not configured, skipping push notification");
    return { sent: 0, failed: 0 };
  }

  // Get user's push subscriptions based on notification category preferences
  const categoryField = getCategoryField(category);

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      userId,
      [categoryField]: true,
    },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify(payload)
        );

        // Update last used timestamp
        await prisma.pushSubscription.update({
          where: { id: sub.id },
          data: { lastUsedAt: new Date() },
        });

        return { success: true, subscriptionId: sub.id };
      } catch (error: unknown) {
        // If subscription is invalid (410 Gone), remove it
        if (error instanceof WebPushError && error.statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { id: sub.id },
          });
          console.log(`Removed expired subscription: ${sub.id}`);
        }
        throw error;
      }
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return { sent, failed };
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToMultiple({
  userIds,
  payload,
  category,
}: SendPushToMultipleOptions): Promise<{ sent: number; failed: number }> {
  const results = await Promise.all(
    userIds.map((userId) => sendPushNotification({ userId, payload, category }))
  );

  return results.reduce(
    (acc, result) => ({
      sent: acc.sent + result.sent,
      failed: acc.failed + result.failed,
    }),
    { sent: 0, failed: 0 }
  );
}

/**
 * Send tribute notification
 */
export async function sendTributeNotification(
  memorialOwnerId: string,
  tributeAuthor: string,
  memorialName: string,
  memorialSlug: string
) {
  return sendPushNotification({
    userId: memorialOwnerId,
    payload: {
      title: "New Tribute Posted",
      body: `${tributeAuthor} left a tribute on ${memorialName}'s memorial`,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      url: `/${memorialSlug}#tributes`,
      tag: `tribute-${memorialSlug}`,
    },
    category: "tribute",
  });
}

/**
 * Send livestream starting notification
 */
export async function sendLivestreamNotification(
  userIds: string[],
  streamTitle: string,
  memorialName: string,
  memorialSlug: string
) {
  return sendPushToMultiple({
    userIds,
    payload: {
      title: "🔴 Livestream Starting",
      body: `${streamTitle} for ${memorialName} is now live`,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      url: `/${memorialSlug}`,
      tag: `livestream-${memorialSlug}`,
    },
    category: "livestream",
  });
}

/**
 * Send anniversary reminder notification
 */
export async function sendAnniversaryNotification(
  userId: string,
  memorialName: string,
  memorialSlug: string,
  anniversaryType: "birth" | "passing"
) {
  const title =
    anniversaryType === "birth" ? `🎂 Birthday Remembrance` : `🕯️ Anniversary Remembrance`;
  const body =
    anniversaryType === "birth"
      ? `Today marks ${memorialName}'s birthday. Visit their memorial to share a memory.`
      : `Today marks the anniversary of ${memorialName}'s passing. Light a candle in their memory.`;

  return sendPushNotification({
    userId,
    payload: {
      title,
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      url: `/${memorialSlug}`,
      tag: `anniversary-${memorialSlug}`,
    },
    category: "anniversary",
  });
}

/**
 * Send system notification
 */
export async function sendSystemNotification(
  userId: string,
  title: string,
  body: string,
  url?: string
) {
  return sendPushNotification({
    userId,
    payload: {
      title,
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      url: url || "/user-dashboard",
      tag: "system",
    },
    category: "system",
  });
}

// Helper to map category to database field
function getCategoryField(
  category: NotificationCategory
):
  | "tributeNotifications"
  | "livestreamNotifications"
  | "anniversaryNotifications"
  | "systemNotifications" {
  const categoryMap = {
    tribute: "tributeNotifications",
    livestream: "livestreamNotifications",
    anniversary: "anniversaryNotifications",
    system: "systemNotifications",
  } as const;

  return categoryMap[category];
}

const webPushService = {
  sendPushNotification,
  sendPushToMultiple,
  sendTributeNotification,
  sendLivestreamNotification,
  sendAnniversaryNotification,
  sendSystemNotification,
};

export default webPushService;
