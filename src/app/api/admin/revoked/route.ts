import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { listRevokedJtis } from "@/lib/rateLimiter";

export async function GET(req: Request) {
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

  try {
    const reqUrl = new URL(req.url);
    const start = Number(reqUrl.searchParams.get("start") || "0");
    const limit = Number(reqUrl.searchParams.get("limit") || "100");
    const result = await listRevokedJtis({
      start: Math.max(0, start),
      limit: Math.max(1, Math.min(1000, limit)),
    });
    return NextResponse.json({ data: result.items, total: result.total });
  } catch (err) {
    console.warn("Failed to parse pagination params, falling back:", err);
    const result = await listRevokedJtis();
    return NextResponse.json({ data: result.items, total: result.total });
  }
}
