import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { unrevokeJti, appendRevocationAudit } from "@/lib/rateLimiter";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as unknown as Record<string, unknown>);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const adminEmailsRaw = process.env.ADMIN_EMAILS || "";
  const adminEmails = adminEmailsRaw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!adminEmails.includes(String(session.user.email).toLowerCase())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { jti } = body;
  if (!jti) return NextResponse.json({ error: "jti required" }, { status: 400 });

  const ok = await unrevokeJti(jti);
  if (!ok) return NextResponse.json({ error: "failed" }, { status: 500 });
  try {
    await appendRevocationAudit({
      when: Date.now(),
      action: "unrevoke",
      jti,
      actor: String(session.user.email).toLowerCase(),
    });
  } catch (e) {
    console.warn("Failed to append audit", e);
  }

  return NextResponse.json({ success: true });
}
