import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@/generated/prisma";
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

    await prisma.template.update({
      where: { id },
      data: finalData as unknown as Prisma.TemplateUpdateInput,
    });

    // If validated, attempt to obtain an artifact URL (build callback's artifactUrl or stored packageUrl)
    try {
      if (status === "VALIDATED") {
        // mark as processing while we enqueue
        await prisma.template.update({
          where: { id },
          data: {
            processingStatus: "PROCESSING",
            processingLogs: "Remote build validated; enqueuing for persistence",
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
          // Nothing to fetch — restore VALIDATED and exit
          await prisma.template.update({
            where: { id },
            data: {
              processingStatus: "VALIDATED",
              processingLogs:
                (finalData.processingLogs as string) || "Validated but no artifact URL available",
            },
          });
        } else {
          // Create a DB-backed TemplateJob with payload containing the artifact URL and runUrl
          try {
            // Use the shared enqueue which will create a DB job and optionally wake local queue
            const { enqueueTemplateProcessing } = await import("@/server/template-workers/queue");
            await enqueueTemplateProcessing(
              id,
              null,
              { packageUrl: candidateUrl, runUrl: runUrl } as Prisma.JsonObject,
              true // pushNow: wake same-process worker immediately
            );
          } catch (e) {
            console.error(
              "Failed to enqueue DB TemplateJob for artifact, falling back to local extract",
              id,
              e
            );
            // fallback: try to download & enqueue locally
            try {
              const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), `template-${id}-`));
              const zipPath = path.join(tmpBase, "artifact.zip");
              const res = await fetch(candidateUrl);
              if (!res.ok) throw new Error(`Failed to fetch artifact: ${res.status}`);
              const ab = await res.arrayBuffer();
              await fs.promises.writeFile(zipPath, Buffer.from(ab));
              const zip = new AdmZip(zipPath);
              zip.extractAllTo(tmpBase, true);
              const { enqueueTemplateProcessing } = await import("@/server/template-workers/queue");
              await enqueueTemplateProcessing(id, tmpBase, undefined, true);
            } catch (ee) {
              console.error("Fallback download/extract failed", id, ee);
              await prisma.template.update({
                where: { id },
                data: {
                  processingStatus: "VALIDATED",
                  processingLogs:
                    (finalData.processingLogs as string) ||
                    "Validated but failed to download artifact",
                },
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn("Error while enqueuing remote artifact processing", e);
    }

    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error("Build callback error", err);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
