import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendSubscriptionReminder7Days,
  sendSubscriptionCriticalAlert,
  sendAdminSubscriptionExpiredNotification,
} from "@/lib/email";

/**
 * Cron job endpoint to check for expiring subscriptions and send notifications
 * Should be called daily (e.g., via Vercel Cron or external scheduler)
 *
 * Authorization: Use CRON_SECRET to secure this endpoint
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(now.getDate() + 3);

    // Get all active subscriptions expiring within 7 days
    // Exclude subscriptions with renewalId (lifetime access - never expires)
    const expiringSubscriptions = await prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        renewalId: null, // Only check subscriptions without lifetime access
        expiresAt: {
          lte: sevenDaysFromNow,
        },
      },
      include: {
        user: true,
        plan: true,
      },
    });

    const results = {
      checked: expiringSubscriptions.length,
      reminder7Days: 0,
      reminder3Days: 0,
      reminder2Days: 0,
      reminder1Day: 0,
      reminderExpired: 0,
      gracePeriodExpired: 0,
      adminNotifications: 0,
      errors: [] as string[],
    };

    for (const subscription of expiringSubscriptions) {
      const daysRemaining = Math.ceil(
        (new Date(subscription.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const renewalLink = `${process.env.NEXT_PUBLIC_APP_URL}/packages?renew=true&subscriptionId=${subscription.id}`;

      try {
        // 7 days warning (yellow alert)
        if (daysRemaining === 7) {
          await sendSubscriptionReminder7Days(
            subscription.user.email,
            subscription.user.name || "User",
            subscription.plan.name,
            new Date(subscription.expiresAt),
            renewalLink
          );
          results.reminder7Days++;

          // Log notification sent
          await prisma.activityLog.create({
            data: {
              userId: subscription.user.id,
              action: "SUBSCRIPTION_REMINDER_7_DAYS",
              entityType: "Subscription",
              entityId: subscription.id,
              description: `7-day expiration reminder sent for ${subscription.plan.name}`,
              metadata: {
                subscriptionId: subscription.id,
                planName: subscription.plan.name,
                expiresAt: subscription.expiresAt,
              },
            },
          });
        }
        // 3 days critical alert (red alert) - daily reminders from here
        if (daysRemaining <= 3 && daysRemaining > 0) {
          await sendSubscriptionCriticalAlert(
            subscription.user.email,
            subscription.user.name || "User",
            subscription.plan.name,
            daysRemaining,
            renewalLink
          );

          if (daysRemaining === 3) results.reminder3Days++;
          if (daysRemaining === 2) results.reminder2Days++;
          if (daysRemaining === 1) results.reminder1Day++;

          await prisma.activityLog.create({
            data: {
              userId: subscription.user.id,
              action: "SUBSCRIPTION_CRITICAL_ALERT",
              entityType: "Subscription",
              entityId: subscription.id,
              description: `Critical alert sent: ${daysRemaining} day(s) remaining for ${subscription.plan.name}`,
              metadata: {
                subscriptionId: subscription.id,
                daysRemaining,
                planName: subscription.plan.name,
              },
            },
          });
        }

        // Expiration day - final alert + activate grace period
        if (daysRemaining === 0) {
          await sendSubscriptionCriticalAlert(
            subscription.user.email,
            subscription.user.name || "User",
            subscription.plan.name,
            0,
            renewalLink
          );
          results.reminderExpired++;

          // Calculate grace period end date
          const gracePeriodEnds = new Date(subscription.expiresAt);
          gracePeriodEnds.setDate(gracePeriodEnds.getDate() + subscription.gracePeriodDays);

          // Update subscription to GRACE_PERIOD status
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: "GRACE_PERIOD",
              inGracePeriod: true,
              gracePeriodEndsAt: gracePeriodEnds,
            },
          });

          await prisma.activityLog.create({
            data: {
              userId: subscription.user.id,
              action: "SUBSCRIPTION_EXPIRED",
              entityType: "Subscription",
              entityId: subscription.id,
              description: `Subscription expired: ${subscription.plan.name}. Grace period active until ${gracePeriodEnds.toLocaleDateString()}`,
              metadata: {
                subscriptionId: subscription.id,
                planName: subscription.plan.name,
                expiredAt: subscription.expiresAt,
                gracePeriodEndsAt: gracePeriodEnds,
                gracePeriodDays: subscription.gracePeriodDays,
              },
            },
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        results.errors.push(
          `Failed to process subscription ${subscription.id} for user ${subscription.user.email}: ${errorMsg}`
        );
        console.error(`Error processing subscription ${subscription.id}:`, error);
      }
    }

    // Check for subscriptions whose grace period has ended
    // Exclude subscriptions with renewalId (lifetime access)
    const gracePeriodExpired = await prisma.subscription.findMany({
      where: {
        status: "GRACE_PERIOD",
        renewalId: null, // Only check subscriptions without lifetime access
        gracePeriodEndsAt: {
          lte: now,
        },
      },
      include: {
        user: true,
        plan: true,
      },
    });

    results.gracePeriodExpired = 0;

    for (const subscription of gracePeriodExpired) {
      try {
        // Update subscription to EXPIRED
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: "EXPIRED",
            inGracePeriod: false,
          },
        });

        // Notify admin about grace period expiration
        const adminEmail = process.env.ADMIN_EMAIL || process.env.BREVO_SENDER_EMAIL;
        if (adminEmail) {
          await sendAdminSubscriptionExpiredNotification(
            adminEmail,
            subscription.user.name || "User",
            subscription.user.email,
            subscription.plan.name,
            subscription.user.id
          );
        }

        await prisma.activityLog.create({
          data: {
            userId: subscription.user.id,
            action: "SUBSCRIPTION_EXPIRED",
            entityType: "Subscription",
            entityId: subscription.id,
            description: `Grace period ended for ${subscription.plan.name}. Subscription fully expired.`,
            metadata: {
              subscriptionId: subscription.id,
              planName: subscription.plan.name,
              gracePeriodEndedAt: subscription.gracePeriodEndsAt,
            },
          },
        });

        results.gracePeriodExpired++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        results.errors.push(
          `Failed to process grace period expiration for ${subscription.id}: ${errorMsg}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Subscription expiration check completed",
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error("Error in subscription cron job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process subscriptions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
