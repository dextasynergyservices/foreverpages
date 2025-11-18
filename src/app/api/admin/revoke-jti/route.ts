import { NextRequest, NextResponse } from "next/server";
import { revokeJti, appendRevocationAudit } from "@/lib/rateLimiter";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-admin-key") || "";
  const expected = process.env.ADMIN_API_KEY || "";
  if (!expected || apiKey !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { jti, ttlSeconds } = body;
  if (!jti) return NextResponse.json({ error: "jti required" }, { status: 400 });

  const ttl = typeof ttlSeconds === "number" && ttlSeconds > 0 ? ttlSeconds : 60 * 60 * 24;

  const success = await revokeJti(jti, ttl);
  if (!success) return NextResponse.json({ error: "failed" }, { status: 500 });
  // record audit event
  try {
    await appendRevocationAudit({
      when: Date.now(),
      action: "revoke",
      jti,
      ttlSeconds: ttl,
      actor: apiKey ? "api-key" : null,
    });
  } catch (e) {
    // non-fatal
    console.warn("Failed to append audit", e);
  }

  return NextResponse.json({ success: true });
}
