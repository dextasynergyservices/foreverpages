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

          // Process template assets (preview/thumbnail)
          console.log(`[build-callback] Processing template assets for ${id}`);
          const assets = await processTemplateAssets(id, tmpBase);

          // Build template and upload to Cloudinary
          console.log(`[build-callback] Building template for ${id}`);
          let builtAssets: Record<string, string> = {};

          try {
            const { execSync } = await import("child_process");

            // Find template directory
            let templateDir = tmpBase;
            const entries = await fs.promises.readdir(tmpBase, { withFileTypes: true });
            let hasPackageJson = entries.some((e) => e.name === "package.json");

            if (!hasPackageJson) {
              for (const entry of entries) {
                if (entry.isDirectory()) {
                  const subPath = path.join(tmpBase, entry.name);
                  const subEntries = await fs.promises.readdir(subPath);
                  if (subEntries.includes("package.json")) {
                    templateDir = subPath;
                    hasPackageJson = true;
                    console.log(`[build-callback] Found template in subdirectory: ${entry.name}`);
                    break;
                  }
                }
              }
            }

            // Verify package.json exists before building
            if (!hasPackageJson) {
              throw new Error("No package.json found in template - cannot build");
            }

            // Verify package.json has build script
            const packageJsonPath = path.join(templateDir, "package.json");
            const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, "utf-8"));
            if (!packageJson.scripts?.build) {
              throw new Error("No build script found in package.json");
            }

            // Install and build
            console.log(`[build-callback] Installing dependencies in ${templateDir}...`);
            execSync("npm install", { cwd: templateDir, stdio: "inherit" });

            console.log(`[build-callback] Running build...`);
            execSync("npm run build", { cwd: templateDir, stdio: "inherit" });

            // Find dist folder
            let distPath = path.join(templateDir, "dist");
            if (!fs.existsSync(distPath)) {
              distPath = path.join(templateDir, "build");
            }

            if (fs.existsSync(distPath)) {
              const { uploadTemplateBuiltFiles } = await import(
                "@/lib/templates/upload-built-files"
              );
              builtAssets = await uploadTemplateBuiltFiles(id, distPath);
              console.log(`[build-callback] ✅ Uploaded ${Object.keys(builtAssets).length} files`);

              // Verify index.html was uploaded (critical for preview)
              if (!builtAssets["index.html"]) {
                console.warn(`[build-callback] ⚠️ Warning: index.html not found in built files`);
              }
            } else {
              console.warn(`[build-callback] ⚠️ No dist or build folder found after build`);
            }
          } catch (buildErr) {
            const errorMsg = buildErr instanceof Error ? buildErr.message : String(buildErr);
            console.error(`[build-callback] ❌ Build failed: ${errorMsg}`);
            // Store build error but continue with sections
            await prisma.template.update({
              where: { id },
              data: {
                processingLogs: `Build failed: ${errorMsg}. Template validation and sections will still be processed.`,
              },
            });
          }

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

          // Update template with all assets
          console.log(`[build-callback] Updating template with assets and build artifacts`);
          await prisma.template.update({
            where: { id },
            data: {
              processingStatus: "VALIDATED",
              processingLogs: "Template validated, built, and assets uploaded successfully",
              ...(assets.previewImage && { previewImage: assets.previewImage }),
              ...(assets.thumbnailImage && { thumbnailImage: assets.thumbnailImage }),
              ...(Object.keys(builtAssets).length > 0 && { artifactAssets: builtAssets }),
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
