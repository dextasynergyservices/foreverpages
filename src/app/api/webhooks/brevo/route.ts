/**
 * Brevo Webhook Handler
 * Handles email delivery, open, click, bounce, and spam events
 * POST /api/webhooks/brevo
 */

import { NextRequest, NextResponse } from "next/server";
import { updateEmailStatus } from "@/lib/email-logger";
import log from "@/lib/logger";

/**
 * Brevo webhook event structure
 */
interface BrevoWebhookEvent {
  event: "delivered" | "opened" | "click" | "hard_bounce" | "soft_bounce" | "complaint" | "spam";
  "message-id": string;
  email: string;
  date: string;
  ts?: number;
  subject?: string;
  tag?: string;
  link?: string;
  reason?: string;
}

export async function POST(req: NextRequest) {
  try {
    const events: BrevoWebhookEvent[] = await req.json();

    log.info(`[BREVO WEBHOOK] Received ${events.length} event(s)`);

    // Process each event
    for (const event of events) {
      await processBrevoEvent(event);
    }

    return NextResponse.json({ success: true, processed: events.length });
  } catch (error) {
    log.error("[BREVO WEBHOOK ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

async function processBrevoEvent(event: BrevoWebhookEvent) {
  try {
    const messageId = event["message-id"];

    log.info(`[BREVO WEBHOOK] Processing ${event.event} for ${event.email}`);

    switch (event.event) {
      case "delivered":
        await updateEmailStatus({
          messageId,
          status: "DELIVERED",
        });
        break;

      case "opened":
        await updateEmailStatus({
          messageId,
          status: "OPENED",
        });
        break;

      case "click":
        await updateEmailStatus({
          messageId,
          status: "CLICKED",
        });
        break;

      case "hard_bounce":
      case "soft_bounce":
        await updateEmailStatus({
          messageId,
          status: "BOUNCED",
          errorMessage: event.reason || "Email bounced",
        });
        break;

      case "complaint":
      case "spam":
        await updateEmailStatus({
          messageId,
          status: "COMPLAINED",
          errorMessage: `Marked as spam: ${event.reason || "User reported spam"}`,
        });
        break;

      default:
        log.info(`[BREVO WEBHOOK] Unknown event type: ${event.event}`);
    }
  } catch (error) {
    log.error(`[BREVO WEBHOOK ERROR] Failed to process event:`, error);
  }
}

/**
 * Verify Brevo webhook signature (optional security)
 * You would need to configure this in your Brevo webhook settings
 */
// function verifyBrevoSignature(req: NextRequest): boolean {
//   const signature = req.headers.get("x-mailin-signature");
//   const webhookSecret = process.env.BREVO_WEBHOOK_SECRET;

//   if (!webhookSecret) {
//     // If no secret configured, allow all webhooks (development mode)
//     return true;
//   }

//   if (!signature) {
//     return false;
//   }

//   // Implement signature verification logic here if needed
//   // Brevo uses HMAC SHA256 for webhook signatures

//   return true;
// }
