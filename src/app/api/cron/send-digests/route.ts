import { NextRequest, NextResponse } from "next/server";
import { sendDailyDigests, sendWeeklyDigests } from "@/lib/notificationDigestScheduler";
import log from "@/lib/logger";

/**
 * POST /api/cron/send-digests
 * Trigger notification digest sending
 * Query params: type=daily|weekly
 *
 * This endpoint should be protected and called by:
 * - Vercel Cron Jobs
 * - External cron service
 * - Manual trigger for testing
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      log.error("CRON_SECRET environment variable is not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get digest type from query params
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "daily";

    let result;

    if (type === "daily") {
      log.info("Starting daily digest send...");
      result = await sendDailyDigests();
    } else if (type === "weekly") {
      log.info("Starting weekly digest send...");
      result = await sendWeeklyDigests();
    } else {
      return NextResponse.json({ error: "Invalid digest type" }, { status: 400 });
    }

    return NextResponse.json({
      message: `${type} digests sent successfully`,
      result,
    });
  } catch (error) {
    log.error("Error in digest cron job:", error);
    return NextResponse.json({ error: "Failed to send digests" }, { status: 500 });
  }
}

/**
 * GET /api/cron/send-digests
 * Get status of digest system
 */
export async function GET() {
  return NextResponse.json({
    message: "Notification digest cron endpoint",
    usage: "POST with ?type=daily or ?type=weekly",
    authorization: "Required: Bearer token in Authorization header",
  });
}
