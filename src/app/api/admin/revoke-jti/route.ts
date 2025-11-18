import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revokeJti } from "@/lib/rateLimiter";

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
  const { jti, ttlSeconds } = body;
  if (!jti) return NextResponse.json({ error: "jti required" }, { status: 400 });

  const success = await revokeJti(jti, Number(ttlSeconds) || 60 * 60 * 24);
  if (!success) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ success: true });
}
