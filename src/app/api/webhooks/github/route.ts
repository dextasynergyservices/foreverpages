import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";
import { syncMergedTemplateToRepo } from "@/server/template-workers";

/**
 * GitHub Webhook Handler
 * POST /api/webhooks/github
 *
 * Handles GitHub webhook events for template PR merges
 * Verifies webhook signature and triggers post-merge sync
 */

async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const hash = createHmac("sha256", secret).update(payload).digest("hex");
  const expectedSignature = `sha256=${hash}`;
  return Buffer.from(signature).equals(Buffer.from(expectedSignature));
}

export async function POST(req: Request) {
  try {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      console.warn("[GitHub Webhook] No GITHUB_WEBHOOK_SECRET configured");
      return NextResponse.json({ error: "webhook_secret_not_configured" }, { status: 500 });
    }

    // Get raw body for signature verification
    const payload = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    if (!signature) {
      console.warn("[GitHub Webhook] Missing signature header");
      return NextResponse.json({ error: "missing_signature" }, { status: 400 });
    }

    // Verify webhook signature
    try {
      const isValid = await verifyWebhookSignature(payload, signature, secret);
      if (!isValid) {
        console.warn("[GitHub Webhook] Invalid signature");
        return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
      }
    } catch (e) {
      console.error("[GitHub Webhook] Signature verification error:", e);
      return NextResponse.json({ error: "signature_verification_failed" }, { status: 401 });
    }

    // Parse the webhook payload
    const event = JSON.parse(payload);
    const eventType = req.headers.get("x-github-event");

    console.log(`[GitHub Webhook] Received ${eventType} event`);

    // Handle pull_request events
    if (eventType === "pull_request") {
      const action = event.action;
      const pr = event.pull_request;

      console.log(`[GitHub Webhook] PR #${pr.number} action: ${action}`);

      // Only process merged PRs
      if (action === "closed" && pr.merged) {
        console.log(`[GitHub Webhook] Processing merged PR #${pr.number}`);

        // Extract template ID from PR title or branch
        // Expected format: "Add template {slug}" or "template/{slug}-{templateId}-{timestamp}"
        const templateIdMatch =
          pr.title.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/) ||
          pr.head?.ref?.match(
            /template\/[^-]+-([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/
          );

        if (!templateIdMatch) {
          console.warn(`[GitHub Webhook] Could not extract template ID from PR #${pr.number}`);
          return NextResponse.json({ ok: true, warning: "could_not_extract_template_id" });
        }

        const templateId = templateIdMatch[1] || templateIdMatch[0];

        console.log(`[GitHub Webhook] Found template ID: ${templateId}`);

        // Find the template in DB
        const template = await prisma.template.findUnique({ where: { id: templateId } });
        if (!template) {
          console.warn(`[GitHub Webhook] Template ${templateId} not found in DB`);
          return NextResponse.json({ ok: true, warning: "template_not_found" });
        }

        // Trigger post-merge sync
        try {
          await syncMergedTemplateToRepo(templateId, pr.number, pr.merge_commit_sha);
          console.log(`[GitHub Webhook] Post-merge sync completed for template ${templateId}`);
          return NextResponse.json({ ok: true, synced: true });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(`[GitHub Webhook] Post-merge sync failed for template ${templateId}:`, e);
          return NextResponse.json({ ok: false, error: msg }, { status: 500 });
        }
      }

      return NextResponse.json({ ok: true, skipped: "event_not_processed" });
    }

    // Acknowledge other event types
    console.log(`[GitHub Webhook] Ignoring event type: ${eventType}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[GitHub Webhook] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "GitHub Webhook Handler - POST only" });
}
