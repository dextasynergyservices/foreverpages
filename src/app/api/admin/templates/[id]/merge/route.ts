import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mergePr } from "@/lib/github/pr";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  // Basic admin gate - ensure user has isAdmin flag on DB user record
  if (!user?.email) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN"))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const templateId = params.id;
  const tpl = await prisma.template.findUnique({ where: { id: templateId } });
  if (!tpl) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (!tpl.prNumber) return NextResponse.json({ error: "no_pr" }, { status: 400 });

  try {
    type MergeResult = { sha?: string; merged?: boolean; message?: string } | null;
    const mergeResult = (await mergePr(Number(tpl.prNumber), "merge")) as MergeResult;
    const merged = Boolean(mergeResult?.merged);
    const sha = mergeResult?.sha || null;
    const message = mergeResult?.message || null;
    await prisma.template.update({
      where: { id: templateId },
      data: { processingStatus: merged ? "PUBLISHED" : "VALIDATED" },
    });

    return NextResponse.json({ ok: true, merged, sha, message });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
