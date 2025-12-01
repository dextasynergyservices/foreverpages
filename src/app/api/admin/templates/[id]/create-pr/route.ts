import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { createPrForTemplate } from "@/lib/github/pr";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  try {
    const tpl = await prisma.template.findUnique({ where: { id } });
    if (!tpl) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Prefer storagePath (persisted files) for PR creation
    const storage = tpl.storagePath;
    if (!storage)
      return NextResponse.json({ error: "No persisted files available" }, { status: 400 });

    // collect files
    function collectFiles(dir: string) {
      const out: { path: string; content: string }[] = [];
      const stack = [dir];
      while (stack.length) {
        const p = stack.pop()!;
        const entries = fs.readdirSync(p, { withFileTypes: true });
        for (const e of entries) {
          const full = path.join(p, e.name);
          if (e.isDirectory()) {
            if (e.name === "node_modules" || e.name === ".git") continue;
            stack.push(full);
            continue;
          }
          if (e.isFile()) {
            const rel = path.relative(process.cwd(), full).replace(/\\/g, "/");
            const content = fs.readFileSync(full, "utf8");
            out.push({ path: rel, content });
          }
        }
      }
      return out;
    }

    const files = collectFiles(storage);
    if (!files.length)
      return NextResponse.json({ error: "No files to create PR" }, { status: 400 });

    const slug = tpl.slug || `template-${id}`;
    const safeSlug = String(slug || "")
      .toLowerCase()
      .replace(/[^a-z0-9\-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
    const branch = `template/${safeSlug}-${id}-${Date.now()}`;
    const title = `Add template ${slug}`;
    const body = `Manual PR for template ${slug} (id: ${id})`;

    try {
      const pr = await createPrForTemplate(branch, files, title, body, "develop");
      await prisma.template.update({
        where: { id },
        data: { prNumber: pr.number.toString(), prUrl: pr.url },
      });
      return NextResponse.json({ ok: true, prUrl: pr.url });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("Failed to create PR manually", e);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("create-pr error", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
