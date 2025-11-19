import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { listRevocationAudit } from "@/lib/rateLimiter";

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
    const url = new URL(req.url);
    const start = Math.max(0, Number(url.searchParams.get("start") || "0"));
    const limit = Math.max(1, Math.min(1000, Number(url.searchParams.get("limit") || "200")));
    const actionFilter = url.searchParams.get("action");
    const actor = url.searchParams.get("actor") || undefined;
    const from = url.searchParams.get("from")
      ? new Date(url.searchParams.get("from") as string)
      : undefined;
    const to = url.searchParams.get("to")
      ? new Date(url.searchParams.get("to") as string)
      : undefined;

    const all = await listRevocationAudit(1000 + start);
    let filtered = actionFilter ? all.filter((a) => a.action === actionFilter) : all;
    if (actor) filtered = filtered.filter((i) => i.actor === actor);
    if (from) filtered = filtered.filter((i) => new Date(i.when) >= from);
    if (to) filtered = filtered.filter((i) => new Date(i.when) <= to);
    const total = filtered.length;
    const slice = filtered.slice(start, start + limit);
    return NextResponse.json({ data: slice, total });
  } catch (err) {
    console.warn("Error listing audit:", err);
    const entries = await listRevocationAudit(200);
    return NextResponse.json({ data: entries, total: entries.length });
  }
}
