import { NextResponse } from "next/server";
import { dispatchTemplateBuild } from "@/lib/github/dispatch";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Basic auth/acl should be enforced by middleware; assume admin-only route.
  try {
    const tpl = await prisma.template.findUnique({ where: { id } });
    if (!tpl) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!tpl.packageUrl)
      return NextResponse.json({ error: "No package URL available" }, { status: 400 });

    const callbackUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/admin/templates/${id}/build-callback`;
    await dispatchTemplateBuild(id, tpl.packageUrl, callbackUrl);

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("Failed to dispatch rebuild", e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
