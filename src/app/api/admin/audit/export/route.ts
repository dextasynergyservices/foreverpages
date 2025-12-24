import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { listRevocationAudit } from "@/lib/rateLimiter";
import log from "@/lib/logger";

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
    const actionFilter = url.searchParams.get("action") || undefined;
    const actor = url.searchParams.get("actor") || undefined;
    const from = url.searchParams.get("from")
      ? new Date((url.searchParams.get("from") as string) || "")
      : undefined;
    const to = url.searchParams.get("to")
      ? new Date((url.searchParams.get("to") as string) || "")
      : undefined;

    const all = await listRevocationAudit(5000);
    let filtered = actionFilter ? all.filter((a) => a.action === actionFilter) : all;
    if (actor) filtered = filtered.filter((i) => i.actor === actor);
    if (from) filtered = filtered.filter((i) => new Date(i.when) >= from);
    if (to) filtered = filtered.filter((i) => new Date(i.when) <= to);

    const header = ["when", "action", "jti", "actor", "ttlSeconds"];
    const rows = filtered.map((e) => [
      new Date(e.when).toISOString(),
      e.action,
      e.jti,
      e.actor || "",
      String(e.ttlSeconds ?? ""),
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=revocation_audit_${Date.now()}.csv`,
      },
    });
  } catch (err) {
    log.warn("Error exporting audit:", err);
    return NextResponse.json({ error: "export_failed" }, { status: 500 });
  }
}
