import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@/generated/prisma";
import {
  processTemplateAssets,
  createTemplateSections,
} from "@/lib/templates/process-template-assets";
import fs from "fs";
import os from "os";
import path from "path";
import AdmZip from "adm-zip";

const prisma = new PrismaClient();
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log("[build-callback] 🔔 CALLBACK RECEIVED - Request method:", request.method);

  const { id } = await params;
  console.log("[build-callback] 🔔 Template ID:", id);

  try {
    if (!id) {
      console.log("[build-callback] ❌ Missing template id in params");
      return NextResponse.json({ message: "Missing template id" }, { status: 400 });
    }

    console.log(`[build-callback] 🔍 Processing callback for template: ${id}`);

    // Validate callback secret header
    const secretHeader =
      request.headers.get("x-build-callback-secret") ||
      request.headers.get("X-BUILD-CALLBACK-SECRET");
    const expected = process.env.TEMPLATE_BUILD_CALLBACK_SECRET || null;
    if (expected && secretHeader !== expected) {
      console.warn("[build-callback] ❌ Invalid callback secret", {
        id,
        received: !!secretHeader,
        expected: !!expected,
      });
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      console.log("[build-callback] ❌ Failed to parse JSON body");
      return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    console.log(`[build-callback] ✓ Received callback for template ${id}:`, {
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

        // Use source artifact (artifactUrl) which is publicly accessible
        let candidateUrl: string | null = artifactUrl;
        if (!candidateUrl) {
          // Fallback to packageUrl from database if not provided
          const tplRec = await prisma.template.findUnique({
            where: { id },
            select: { packageUrl: true },
          });
          candidateUrl = tplRec?.packageUrl || null;
        }

        console.log(`[build-callback] Using artifact URL: ${candidateUrl?.slice(0, 80)}...`);

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
          const tmpDir = path.join(os.tmpdir(), "foreverpages-templates");
          await fs.promises.mkdir(tmpDir, { recursive: true });
          const tmpBase = fs.mkdtempSync(path.join(tmpDir, `template-${id}-`));
          const zipPath = path.join(tmpBase, "artifact.zip");

          // Download artifact (source artifact is publicly accessible)
          console.log(`[build-callback] Downloading from: ${candidateUrl.substring(0, 100)}...`);
          const res = await fetch(candidateUrl);
          if (!res.ok) throw new Error(`Failed to fetch artifact: ${res.status}`);
          const ab = await res.arrayBuffer();
          await fs.promises.writeFile(zipPath, Buffer.from(ab));
          console.log(`[build-callback] Downloaded artifact (${ab.byteLength} bytes)`);

          // Extract
          const zip = new AdmZip(zipPath);
          zip.extractAllTo(tmpBase, true);
          console.log(`[build-callback] Extracted artifact to ${tmpBase}`);

          // NOTE: Building, artifact upload, and PR creation are handled by queue
          // This callback only processes preview/thumbnail assets and creates sections
          console.log(`[build-callback] Processing template assets for ${id}`);
          const assets = await processTemplateAssets(id, tmpBase);

          // Create template sections from config.json
          console.log(`[build-callback] Creating template sections for ${id}`);
          let sectionCreationError: string | null = null;
          try {
            const sectionStartTime = Date.now();
            await createTemplateSections(id, tmpBase);
            const sectionDuration = Date.now() - sectionStartTime;
            console.log(
              `[build-callback] ✓ Template sections created successfully in ${sectionDuration}ms`
            );
          } catch (sectionError) {
            const errorMsg =
              sectionError instanceof Error ? sectionError.message : String(sectionError);
            sectionCreationError = `Section creation failed: ${errorMsg}`;
            console.error(
              `[build-callback] ✗ Failed to create template sections for ${id}:`,
              sectionError
            );

            // Store error in database so it appears in UI
            await prisma.template.update({
              where: { id },
              data: {
                processingLogs: sectionCreationError,
                processingStatus: "ERROR",
              },
            });

            // Return early if section creation fails
            return NextResponse.json(
              {
                message: "Section creation failed",
                error: sectionCreationError,
              },
              { status: 500 }
            );
          }

          // NOTE: Building, artifact upload, and PR creation are handled by queue
          // This callback only confirms validation succeeded
          console.log(`[build-callback] Asset processing complete for template ${id}`);

          // Update template with asset URLs only (building/PR handled by queue)
          await prisma.template.update({
            where: { id },
            data: {
              processingStatus: "VALIDATED",
              processingLogs: "GitHub Actions validation completed successfully",
              ...(assets.previewImage && { previewImage: assets.previewImage }),
              ...(assets.thumbnailImage && { thumbnailImage: assets.thumbnailImage }),
            },
          });

          console.log(`[build-callback] ✓ Assets processed successfully for template ${id}`);

          // Cleanup temp directory
          try {
            await fs.promises.rm(tmpBase, { recursive: true, force: true });
          } catch (e) {
            console.warn("Failed to cleanup temp directory", e);
          }

          return NextResponse.json({ message: "OK - Assets processed" });
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : String(e);
          console.error(`[build-callback] ✗ Failed to process assets for template ${id}:`, e);
          await prisma.template.update({
            where: { id },
            data: {
              processingStatus: "ERROR",
              processingLogs: `Failed to process assets: ${errorMsg}`,
            },
          });
          return NextResponse.json({ message: "OK - Asset processing failed", error: errorMsg });
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
