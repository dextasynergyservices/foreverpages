/**
 * Notification Digest Scheduler
 *
 * This file contains functions to send scheduled notification digests.
 * These should be called by a cron job or scheduled task service.
 *
 * Options for scheduling:
 * 1. Vercel Cron Jobs (vercel.json)
 * 2. External cron service (e.g., cron-job.org, EasyCron)
 * 3. GitHub Actions scheduled workflow
 * 4. Node-cron (if using a long-running Node process)
 */

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { renderNotificationDigestEmail } from "@/lib/emailTemplates/notificationDigest";

interface DigestResult {
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ userId: string; error: string }>;
}

/**
 * Send daily notification digests to all users
 */
export async function sendDailyDigests(): Promise<DigestResult> {
  const result: DigestResult = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    console.log(`Processing daily digests for ${users.length} users`);

    // Calculate date range (last 24 hours)
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    for (const user of users) {
      try {
        // Fetch user's notifications from the last 24 hours
        const notifications = await prisma.notification.findMany({
          where: {
            userId: user.id,
            createdAt: {
              gte: yesterday,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Skip if no notifications
        if (notifications.length === 0) {
          result.skipped++;
          continue;
        }

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
          period: "daily",
          unreadCount,
        });

        // Send email
        await sendEmail({
          to: user.email,
          subject: "Your Daily Notification Digest",
          html: emailHtml,
        });

        result.success++;
        console.log(`✓ Sent daily digest to ${user.email}`);
      } catch (error) {
        result.failed++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        result.errors.push({ userId: user.id, error: errorMessage });
        console.error(`✗ Failed to send digest to ${user.email}:`, error);
      }
    }

    console.log(
      `Daily digest complete: ${result.success} sent, ${result.failed} failed, ${result.skipped} skipped`
    );
    return result;
  } catch (error) {
    console.error("Error in sendDailyDigests:", error);
    throw error;
  }
}

/**
 * Send weekly notification digests to all users
 */
export async function sendWeeklyDigests(): Promise<DigestResult> {
  const result: DigestResult = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    console.log(`Processing weekly digests for ${users.length} users`);

    // Calculate date range (last 7 days)
    const now = new Date();
    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 7);

    for (const user of users) {
      try {
        // Fetch user's notifications from the last 7 days
        const notifications = await prisma.notification.findMany({
          where: {
            userId: user.id,
            createdAt: {
              gte: lastWeek,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Skip if no notifications
        if (notifications.length === 0) {
          result.skipped++;
          continue;
        }

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
          period: "weekly",
          unreadCount,
        });

        // Send email
        await sendEmail({
          to: user.email,
          subject: "Your Weekly Notification Digest",
          html: emailHtml,
        });

        result.success++;
        console.log(`✓ Sent weekly digest to ${user.email}`);
      } catch (error) {
        result.failed++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        result.errors.push({ userId: user.id, error: errorMessage });
        console.error(`✗ Failed to send digest to ${user.email}:`, error);
      }
    }

    console.log(
      `Weekly digest complete: ${result.success} sent, ${result.failed} failed, ${result.skipped} skipped`
    );
    return result;
  } catch (error) {
    console.error("Error in sendWeeklyDigests:", error);
    throw error;
  }
}
