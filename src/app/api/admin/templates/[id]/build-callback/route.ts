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
      hasBuiltArtifactUrl: !!body.builtArtifactUrl,
      hasLogs: !!body.logs,
      runUrl: body.runUrl,
    });

    const logs = body.logs || body.buildLog || null;
    const artifactUrl = body.artifactUrl || body.artifactsUrl || null;
    const builtFilesBase64 = body.builtFilesBase64 || null;

    console.log(
      `[build-callback] builtFilesBase64:`,
      builtFilesBase64 ? "PROVIDED" : "NOT PROVIDED"
    );
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

    // If validated, download artifact and create PR new
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
        console.log(
          `[build-callback] Built files: ${builtFilesBase64 ? "PROVIDED" : "NOT PROVIDED"}`
        );

        // Check if we have pre-built files from GitHub Actions
        const usePreBuiltFiles = !!builtFilesBase64;
        console.log(`[build-callback] Using pre-built files: ${usePreBuiltFiles}`);

        if (!candidateUrl && !builtFilesBase64) {
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

        console.log(
          `[build-callback] Processing ${usePreBuiltFiles ? "pre-built files" : "source artifact"} from ${candidateUrl?.slice(0, 80)}...`
        );

        // Download artifact, extract, and directly create PR
        try {
          const tmpDir = path.join(os.tmpdir(), "foreverpages-templates");
          await fs.promises.mkdir(tmpDir, { recursive: true });
          const tmpBase = fs.mkdtempSync(path.join(tmpDir, `template-${id}-`));
          const zipPath = path.join(tmpBase, "artifact.zip");

          // Download source artifact for asset processing (preview/thumbnail)
          console.log(
            `[build-callback] Downloading source from: ${candidateUrl?.substring(0, 100)}...`
          );
          const res = await fetch(candidateUrl!);
          if (!res.ok) throw new Error(`Failed to fetch artifact: ${res.status}`);
          const ab = await res.arrayBuffer();
          await fs.promises.writeFile(zipPath, Buffer.from(ab));
          console.log(`[build-callback] Downloaded source artifact (${ab.byteLength} bytes)`);

          // Extract source
          const zip = new AdmZip(zipPath);
          zip.extractAllTo(tmpBase, true);
          console.log(`[build-callback] Extracted source artifact to ${tmpBase}`);

          // Process template assets (preview/thumbnail) - but don't let this block the build
          let assets: { previewImage: string | null; thumbnailImage: string | null } = {
            previewImage: null,
            thumbnailImage: null,
          };
          try {
            console.log(`[build-callback] Processing template assets for ${id}`);
            console.log(
              `[build-callback] Cloudinary config present: cloud=${!!process.env.CLOUDINARY_CLOUD_NAME}, key=${!!process.env.CLOUDINARY_API_KEY}, secret=${!!process.env.CLOUDINARY_API_SECRET}`
            );
            assets = await processTemplateAssets(id, tmpBase);
            console.log(
              `[build-callback] ✓ Assets processed: preview=${!!assets.previewImage}, thumbnail=${!!assets.thumbnailImage}`
            );
          } catch (assetErr) {
            console.error(
              `[build-callback] ⚠️ Asset processing failed, but continuing with build:`,
              assetErr instanceof Error ? assetErr.message : String(assetErr)
            );
          }

          // Build template or download pre-built files
          let builtAssets: Record<string, string> = {};
          const buildProcessStart = Date.now();

          if (usePreBuiltFiles) {
            console.log(`[build-callback] 📦 Using pre-built files from GitHub Actions`);

            // Decode the base64 files map - GitHub Actions already uploaded files to Cloudinary
            const builtFilesJson = Buffer.from(builtFilesBase64!, "base64").toString("utf-8");
            builtAssets = JSON.parse(builtFilesJson);

            console.log(
              `[build-callback] ✅ Received ${Object.keys(builtAssets).length} pre-built files`
            );
            console.log(`[build-callback] index.html available: ${!!builtAssets["index.html"]}`);

            if (builtAssets["index.html"]) {
              console.log(`[build-callback] ✓ index.html URL: ${builtAssets["index.html"]}`);
            } else {
              console.error(`[build-callback] ❌ index.html NOT in built files!`);
              console.error(
                `[build-callback] Available files: ${Object.keys(builtAssets).slice(0, 10).join(", ")}...`
              );
            }

            console.log(
              `[build-callback] ⏱️  Total build process time: ${Date.now() - buildProcessStart}ms`
            );
          } else {
            console.log(`[build-callback] 🔨 Starting build process for template ${id}`);
            console.log(
              `[build-callback] Runtime: ${process.env.VERCEL ? "Vercel" : "Local"}, Node: ${process.version}`
            );
            console.log(
              `[build-callback] Function timeout: ${process.env.VERCEL_FUNCTION_TIMEOUT || "unknown"}s`
            );
            console.log(`[build-callback] Temp directory: ${tmpBase}`);
            console.log(`[build-callback] Directory writable: ${fs.existsSync(tmpBase)}`);

            try {
              const { execSync } = await import("child_process");
              console.log(`[build-callback] ✓ Imported execSync, type: ${typeof execSync}`);

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
                console.error(`[build-callback] ❌ No package.json found in template`);
                throw new Error("No package.json found in template - cannot build");
              }
              console.log(`[build-callback] ✓ Found package.json in ${templateDir}`);

              // Verify package.json has build script
              const packageJsonPath = path.join(templateDir, "package.json");
              const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, "utf-8"));
              console.log(
                `[build-callback] 📦 Package name: ${packageJson.name}, scripts: ${Object.keys(packageJson.scripts || {}).join(", ")}`
              );

              if (!packageJson.scripts?.build) {
                console.error(`[build-callback] ❌ No build script in package.json`);
                throw new Error("No build script found in package.json");
              }

              // Build locally (no pre-built files from GitHub Actions)

              console.log(
                `[build-callback] ⏱️  Total build process time: ${Date.now() - buildProcessStart}ms`
              );
            } catch (buildErr) {
              const errorMsg = buildErr instanceof Error ? buildErr.message : String(buildErr);
              const errorStack = buildErr instanceof Error ? buildErr.stack : "";
              console.error(`[build-callback] ❌ Build failed: ${errorMsg}`);
              console.error(`[build-callback] Stack trace:`, errorStack);

              // Store detailed build error
              await prisma.template.update({
                where: { id },
                data: {
                  processingLogs: `Build failed: ${errorMsg}\n\nStack: ${errorStack}\n\nTemplate validation and sections will still be processed.`,
                },
              });
            }
          } // end of else block (building locally)

          // Log final build status
          if (Object.keys(builtAssets).length === 0) {
            console.error(
              `[build-callback] ⚠️ CRITICAL: No built assets were uploaded! Preview will not work.`
            );
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
          console.log(
            `[build-callback] 📊 Summary: ${Object.keys(builtAssets).length} built files, preview: ${!!assets.previewImage}, thumbnail: ${!!assets.thumbnailImage}`
          );

          // Cleanup temp directory
          try {
            await fs.promises.rm(tmpBase, { recursive: true, force: true });
          } catch (e) {
            console.warn("Failed to cleanup temp directory", e);
          }

          // Create PR for the template with all built files
          let prUrl: string | null = null;
          let prNumber: string | null = null;
          try {
            console.log(`[build-callback] Creating PR for template ${id}`);
            const { createPrForTemplate } = await import("@/lib/github/pr");
            const template = await prisma.template.findUnique({
              where: { id },
              select: { slug: true, name: true },
            });

            if (template) {
              const branchName = `template/${template.slug}-${Date.now()}`;
              const configJsonContent = JSON.stringify(
                {
                  name: template.name,
                  slug: template.slug,
                  description: `Template: ${template.name}`,
                },
                null,
                2
              );

              // Download all built files from Cloudinary and prepare for PR
              const files = [
                {
                  path: `src/app/templates/${template.slug}/config.json`,
                  content: configJsonContent,
                },
              ];

              console.log(
                `[build-callback] Downloading ${Object.keys(builtAssets).length} files from Cloudinary for PR`
              );

              // Download each built file and add to PR
              for (const [filePath, url] of Object.entries(builtAssets)) {
                try {
                  const response = await fetch(url);
                  if (response.ok) {
                    const content = await response.text();
                    files.push({
                      path: `src/app/templates/${template.slug}/${filePath}`,
                      content,
                    });
                    console.log(
                      `[build-callback] ✓ Downloaded ${filePath} (${content.length} bytes)`
                    );
                  } else {
                    console.warn(
                      `[build-callback] Failed to download ${filePath}: ${response.status}`
                    );
                  }
                } catch (downloadError) {
                  console.warn(`[build-callback] Error downloading ${filePath}:`, downloadError);
                }
              }

              console.log(`[build-callback] Creating PR with ${files.length} files`);

              const pr = await createPrForTemplate(
                branchName,
                files,
                `Add template: ${template.name}`,
                `Auto-generated PR for template \`${template.slug}\`\n\nTemplate ID: ${id}\nBuilt files: ${Object.keys(builtAssets).length}\nFiles in PR: ${files.length}`,
                "develop"
              );

              if (pr) {
                prUrl = pr.url;
                prNumber = String(pr.number);
                console.log(`[build-callback] ✓ PR created: ${prUrl}`);

                // Update template with PR info
                await prisma.template.update({
                  where: { id },
                  data: {
                    prUrl,
                    prNumber,
                    processingLogs: `Template validated, built, and PR created successfully: ${prUrl}`,
                  },
                });
              }
            }
          } catch (prError) {
            console.warn(`[build-callback] Failed to create PR:`, prError);
            // Don't fail the whole process if PR creation fails
          }

          return NextResponse.json({
            message: "OK - Assets processed",
            builtFiles: Object.keys(builtAssets).length,
            hasPreview: !!assets.previewImage,
            hasThumbnail: !!assets.thumbnailImage,
            hasIndexHtml: !!builtAssets["index.html"],
            prUrl,
            prNumber,
          });
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : String(e);
          const errorStack = e instanceof Error ? e.stack : "";
          console.error(`[build-callback] ✗ FATAL: Failed to process assets for template ${id}`);
          console.error(`[build-callback] Error message: ${errorMsg}`);
          console.error(`[build-callback] Stack trace:`, errorStack);
          console.error(`[build-callback] This error prevented the build process from running`);

          await prisma.template.update({
            where: { id },
            data: {
              processingStatus: "ERROR",
              processingLogs: `Failed to process assets (build was not attempted): ${errorMsg}\n\nStack: ${errorStack}`,
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
