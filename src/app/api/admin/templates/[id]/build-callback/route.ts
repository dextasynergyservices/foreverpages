import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@/generated/prisma";
import { createPrForTemplate } from "@/lib/github/pr";
import fs from "fs";
import os from "os";
import path from "path";
import AdmZip from "adm-zip";

const prisma = new PrismaClient();
export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    if (!id) return NextResponse.json({ message: "Missing template id" }, { status: 400 });

    // Validate callback secret header
    const secretHeader =
      request.headers.get("x-build-callback-secret") ||
      request.headers.get("X-BUILD-CALLBACK-SECRET");
    const expected = process.env.TEMPLATE_BUILD_CALLBACK_SECRET || null;
    if (expected && secretHeader !== expected) {
      console.warn("Invalid callback secret for template callback", { id });
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });

    console.log(`[build-callback] Received callback for template ${id}:`, {
      status: body.status,
      hasArtifactUrl: !!body.artifactUrl,
      hasLogs: !!body.logs,
      runUrl: body.runUrl,
    });

    const logs = body.logs || body.buildLog || null;
    const artifactUrl = body.artifactUrl || body.artifactsUrl || null;
    const assetsMap = body.assetsMap || body.artifactAssets || null;
    const runUrl = body.runUrl || null;
    const status = body.status || (logs ? "VALIDATED" : "ERROR");

    const baseData = {
      processingLogs: logs ? String(logs).slice(0, 20000) : undefined,
      processingLogsUrl: runUrl || artifactUrl || undefined,
      processingStatus: status === "VALIDATED" ? "VALIDATED" : "ERROR",
    };

    const finalData = {
      ...baseData,
      ...(artifactUrl ? { packageUrl: artifactUrl } : {}),
      ...(assetsMap ? { artifactAssets: assetsMap } : {}),
    };

    console.log(`[build-callback] Updating template ${id} with status:`, status);
    await prisma.template.update({
      where: { id },
      data: finalData as unknown as Prisma.TemplateUpdateInput,
    });

    // If validated, download artifact and create PR
    try {
      if (status === "VALIDATED") {
        console.log(`[build-callback] Status is VALIDATED, proceeding to PR creation for ${id}`);

        // mark as processing while we download and create PR
        await prisma.template.update({
          where: { id },
          data: {
            processingStatus: "PROCESSING",
            processingLogs: "Build validated; downloading artifact and creating PR...",
          },
        });

        // Prefer artifactUrl returned by the build; fall back to the template.packageUrl stored earlier.
        let candidateUrl: string | null = artifactUrl || null;
        if (!candidateUrl) {
          const tplRec = await prisma.template.findUnique({
            where: { id },
            select: { packageUrl: true },
          });
          candidateUrl = tplRec?.packageUrl || null;
        }

        if (!candidateUrl) {
          console.warn(
            `[build-callback] No artifact URL for template ${id}. Callback has artifactUrl=${!!artifactUrl}, DB has packageUrl=${!!(await prisma.template.findUnique({ where: { id }, select: { packageUrl: true } }))?.packageUrl}`
          );

          // Nothing to fetch — restore VALIDATED and exit
          await prisma.template.update({
            where: { id },
            data: {
              processingStatus: "VALIDATED",
              processingLogs:
                (finalData.processingLogs as string) || "Validated but no artifact URL available",
            },
          });
          return NextResponse.json({ message: "OK - no artifact URL" });
        }

        console.log(`[build-callback] Downloading artifact from ${candidateUrl.slice(0, 80)}...`);

        // Download artifact, extract, and directly create PR
        try {
          const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), `template-${id}-`));
          const zipPath = path.join(tmpBase, "artifact.zip");

          // Download artifact
          const res = await fetch(candidateUrl);
          if (!res.ok) throw new Error(`Failed to fetch artifact: ${res.status}`);
          const ab = await res.arrayBuffer();
          await fs.promises.writeFile(zipPath, Buffer.from(ab));
          console.log(`[build-callback] Downloaded artifact (${ab.byteLength} bytes)`);

          // Extract
          const zip = new AdmZip(zipPath);
          zip.extractAllTo(tmpBase, true);
          console.log(`[build-callback] Extracted artifact to ${tmpBase}`);

          // Get template info for PR details
          const tpl = await prisma.template.findUnique({ where: { id } });
          if (!tpl) throw new Error("Template record not found");

          const slug = tpl.slug || `template-${id}`;
          const safeSlug = String(slug || "")
            .toLowerCase()
            .replace(/[^a-z0-9\-_]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 60);
          const branch = `template/${safeSlug}-${id}-${Date.now()}`;

          // Collect files relative to repo root
          function collectRelativeFiles(dir: string) {
            const out: { path: string; content: string }[] = [];
            const stack = [dir];
            while (stack.length) {
              const p = stack.pop()!;
              const entries = fs.readdirSync(p, { withFileTypes: true });
              for (const e of entries) {
                const full = path.join(p, e.name);
                if (e.isDirectory()) {
                  if (
                    e.name === "node_modules" ||
                    e.name === ".git" ||
                    e.name === "dist" ||
                    e.name === "build"
                  )
                    continue;
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

          const files = collectRelativeFiles(tmpBase);
          if (!files.length) throw new Error("No files extracted from artifact");

          const title = `Add template ${slug}`;
          const body = `Automated template upload for ${slug} (id: ${id}).\n\nBuild logs:\n${logs || "(no logs)"}\n`;

          // Create PR
          console.log(`[build-callback] Creating PR for template ${id} with ${files.length} files`);
          const pr = await createPrForTemplate(branch, files, title, body, "develop");

          // Update template with PR info
          await prisma.template.update({
            where: { id },
            data: {
              prNumber: pr.number.toString(),
              prUrl: pr.url,
              processingStatus: "VALIDATED",
              processingLogs: "PR created successfully",
            },
          });

          console.log(`[build-callback] ✓ PR created successfully for template ${id}: ${pr.url}`);

          // Cleanup temp directory
          try {
            await fs.promises.rm(tmpBase, { recursive: true, force: true });
          } catch (e) {
            console.warn("Failed to cleanup temp directory", e);
          }

          return NextResponse.json({ message: "OK - PR created", prUrl: pr.url });
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : String(e);
          console.error(`[build-callback] ✗ Failed to create PR for template ${id}:`, e);
          await prisma.template.update({
            where: { id },
            data: {
              processingStatus: "ERROR",
              processingLogs: `Failed to create PR: ${errorMsg}`,
            },
          });
          return NextResponse.json({ message: "OK - PR creation failed", error: errorMsg });
        }
      }
    } catch (e) {
      console.warn("Error while processing remote build artifact", e);
    }

    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error("Build callback error", err);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
