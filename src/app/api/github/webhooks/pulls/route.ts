import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

async function verifyGithubSignature(req: NextRequest) {
  const signature = req.headers.get("x-hub-signature-256");
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!signature || !secret) return false;

  // Read raw body as ArrayBuffer
  const buf = await req.arrayBuffer();
  const hmac = crypto.createHmac("sha256", secret).update(Buffer.from(buf)).digest("hex");
  const expected = `sha256=${hmac}`;
  try {
    // Use constant-time comparison; ensure same length
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch (e) {
    console.error("Signature comparison error:", e);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify signature
    const ok = await verifyGithubSignature(req);
    if (!ok) {
      console.error("Invalid GitHub signature");
      return NextResponse.json({ ok: false, reason: "invalid_signature" }, { status: 401 });
    }

    const event = req.headers.get("x-github-event");
    if (event !== "pull_request") return NextResponse.json({ ok: false });

    // Parse payload
    const payload = await req.json();
    const pr = payload.pull_request;
    if (!pr) {
      const payloadLength = JSON.stringify(payload).length;
      console.error("Webhook payload missing pull_request", { payloadLength });
      return NextResponse.json({ ok: false, reason: "no_pr_payload" }, { status: 400 });
    }

    const branch = pr.head?.ref; // e.g., template/<slug>-<id>
    const number = pr.number;
    const url = pr.html_url;

    // parse branch name. Expect branches like `template/<slug>-<id>`
    let templateId: string | null = null;
    try {
      if (branch && branch.startsWith("template/")) {
        const after = branch.substring("template/".length);
        const parts = after.split("-");
        templateId = parts[parts.length - 1] || null;
      }
    } catch (err) {
      console.error("Error parsing branch for template id", err);
      templateId = null;
    }

    if (!templateId) {
      console.error("No template id extracted from branch", { branch });
      return NextResponse.json({ ok: false, reason: "no-template-id" });
    }

    try {
      // Update template record
      const status = pr.merged ? "PUBLISHED" : pr.state === "open" ? "VALIDATED" : "VALIDATED";
      await prisma.template.update({
        where: { id: templateId },
        data: { prNumber: number.toString(), prUrl: url, processingStatus: status },
      });
    } catch (e) {
      console.error("Prisma update failed for template", templateId, e);
      return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unhandled webhook error:", err);
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
