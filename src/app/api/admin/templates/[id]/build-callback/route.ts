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
    const builtArtifactUrl = body.builtArtifactUrl || null;

    console.log(`[build-callback] builtArtifactUrl:`, builtArtifactUrl || "NOT PROVIDED");
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
        console.log(
          `[build-callback] Built artifact URL: ${builtArtifactUrl?.slice(0, 80) || "NOT PROVIDED"}...`
        );

        // Check if we have pre-built files from GitHub Actions
        const usePreBuiltFiles = !!builtArtifactUrl;
        console.log(`[build-callback] Using pre-built files: ${usePreBuiltFiles}`);

        if (!candidateUrl && !builtArtifactUrl) {
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
          `[build-callback] Downloading artifact from ${(usePreBuiltFiles ? builtArtifactUrl : candidateUrl)?.slice(0, 80)}...`
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
            console.log(`[build-callback] 📦 Downloading pre-built files from GitHub Actions`);
            console.log(`[build-callback] Built artifact URL: ${builtArtifactUrl}`);
            console.log(`[build-callback] Source artifact URL: ${candidateUrl}`);
            console.log(`[build-callback] usePreBuiltFiles: ${usePreBuiltFiles}`);

            // Download pre-built ZIP - add authentication header if it's a Cloudinary URL
            const builtZipPath = path.join(tmpBase, "built.zip");
            let builtRes;

            if (
              builtArtifactUrl!.includes("cloudinary.com") &&
              builtArtifactUrl!.includes("/authenticated/")
            ) {
              // For authenticated Cloudinary URLs, generate signed URL
              const { v2: cloudinary } = await import("cloudinary");
              cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
              });

              // Extract public_id from URL (skip version number like v1234567890)
              const publicId =
                builtArtifactUrl!.match(/\/authenticated\/v\d+\/(.+)$/)?.[1] ||
                builtArtifactUrl!.match(/\/upload\/v\d+\/(.+)$/)?.[1] ||
                builtArtifactUrl!.match(/\/authenticated\/(.+)$/)?.[1] ||
                builtArtifactUrl!.match(/\/upload\/(.+)$/)?.[1];
              console.log(`[build-callback] Generating signed URL for: ${publicId}`);

              const signedUrl = cloudinary.url(publicId!, {
                resource_type: "raw",
                type: "authenticated",
                sign_url: true,
              });

              console.log(`[build-callback] Generated signed URL: ${signedUrl.slice(0, 100)}...`);
              builtRes = await fetch(signedUrl);
            } else {
              // Regular URL
              console.log(
                `[build-callback] Using regular URL (not authenticated): ${builtArtifactUrl}`
              );
              builtRes = await fetch(builtArtifactUrl!);
            }

            if (!builtRes.ok) {
              console.error(`[build-callback] ❌ Failed to fetch built artifact`);
              console.error(`[build-callback] Status: ${builtRes.status}`);
              console.error(`[build-callback] URL attempted: ${builtArtifactUrl}`);
              console.error(
                `[build-callback] Is authenticated Cloudinary: ${builtArtifactUrl!.includes("cloudinary.com") && builtArtifactUrl!.includes("/authenticated/")}`
              );
              throw new Error(`Failed to fetch built artifact: ${builtRes.status}`);
            }
            const builtAb = await builtRes.arrayBuffer();
            await fs.promises.writeFile(builtZipPath, Buffer.from(builtAb));
            console.log(
              `[build-callback] ✓ Downloaded pre-built files (${builtAb.byteLength} bytes)`
            );

            // Extract pre-built files
            const builtDir = path.join(tmpBase, "dist");
            fs.mkdirSync(builtDir, { recursive: true });
            const builtZip = new AdmZip(builtZipPath);
            builtZip.extractAllTo(builtDir, true);
            console.log(`[build-callback] ✓ Extracted pre-built files to ${builtDir}`);

            // Check what was extracted
            const distFiles = await fs.promises.readdir(builtDir);
            console.log(`[build-callback] 📁 Extracted files (${distFiles.length}): ${distFiles.join(", ")}`);
            
            // Check if index.html exists
            const indexPath = path.join(builtDir, "index.html");
            const hasIndex = fs.existsSync(indexPath);
            console.log(`[build-callback] index.html exists at root: ${hasIndex}`);
            
            if (!hasIndex) {
              // Maybe it's in a subdirectory?
              for (const file of distFiles) {
                const fullPath = path.join(builtDir, file);
                const stat = await fs.promises.stat(fullPath);
                if (stat.isDirectory()) {
                  const subFiles = await fs.promises.readdir(fullPath);
                  console.log(`[build-callback] Contents of ${file}/: ${subFiles.join(", ")}`);
                }
              }
            }

            // Upload to Cloudinary
            const { uploadTemplateBuiltFiles } = await import("@/lib/templates/upload-built-files");
            builtAssets = await uploadTemplateBuiltFiles(id, builtDir);
            
            console.log(`[build-callback] ✅ Uploaded ${Object.keys(builtAssets).length} pre-built files`);
            console.log(`[build-callback] index.html in builtAssets: ${!!builtAssets["index.html"]}`);
            if (builtAssets["index.html"]) {
              console.log(`[build-callback] ✓ index.html URL: ${builtAssets["index.html"]}`);
            } else {
              console.error(`[build-callback] ❌ index.html NOT in uploaded files!`);
              console.error(`[build-callback] Uploaded files: ${Object.keys(builtAssets).join(", ")}`);
            }
            console.log(
              `[build-callback] ✅ Uploaded ${Object.keys(builtAssets).length} pre-built files`
            );

            if (!builtAssets["index.html"]) {
              console.warn(`[build-callback] ⚠️ WARNING: index.html not found in built files!`);
            } else {
              console.log(`[build-callback] ✓ index.html: ${builtAssets["index.html"]}`);
            }
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

              // Download and extract pre-built files from GitHub Actions
              console.log(`[build-callback] 📥 Downloading pre-built files from GitHub Actions...`);

              if (!builtArtifactUrl) {
                throw new Error(
                  "No builtArtifactUrl provided - build may have failed in GitHub Actions"
                );
              }

              const builtZipPath = path.join(tmpBase, "built-template.zip");
              const builtResponse = await fetch(builtArtifactUrl);
              if (!builtResponse.ok) {
                throw new Error(`Failed to download built files: ${builtResponse.statusText}`);
              }
              const builtBuffer = Buffer.from(await builtResponse.arrayBuffer());
              fs.writeFileSync(builtZipPath, builtBuffer);
              console.log(
                `[build-callback] ✓ Downloaded built files (${builtBuffer.length} bytes)`
              );

              // Extract built files
              const distPath = path.join(tmpBase, "built");
              fs.mkdirSync(distPath, { recursive: true });
              const builtZip = new AdmZip(builtZipPath);
              builtZip.extractAllTo(distPath, true);
              console.log(`[build-callback] ✓ Extracted pre-built files to ${distPath}`);

              if (fs.existsSync(distPath)) {
                console.log(`[build-callback] ✓ Found build output at: ${distPath}`);
                const distFiles = await fs.promises.readdir(distPath);
                console.log(`[build-callback] 📁 Build output contains: ${distFiles.join(", ")}`);

                const { uploadTemplateBuiltFiles } = await import(
                  "@/lib/templates/upload-built-files"
                );
                const uploadStart = Date.now();
                builtAssets = await uploadTemplateBuiltFiles(id, distPath);
                console.log(
                  `[build-callback] ✅ Uploaded ${Object.keys(builtAssets).length} files in ${Date.now() - uploadStart}ms`
                );

                // Verify index.html was uploaded (critical for preview)
                if (!builtAssets["index.html"]) {
                  console.warn(`[build-callback] ⚠️ WARNING: index.html not found in built files!`);
                  console.warn(
                    `[build-callback] Available files: ${Object.keys(builtAssets).join(", ")}`
                  );
                } else {
                  console.log(
                    `[build-callback] ✓ index.html uploaded: ${builtAssets["index.html"]}`
                  );
                }
              } else {
                console.error(`[build-callback] ❌ No dist or build folder found after build!`);
              }

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

          return NextResponse.json({
            message: "OK - Assets processed",
            builtFiles: Object.keys(builtAssets).length,
            hasPreview: !!assets.previewImage,
            hasThumbnail: !!assets.thumbnailImage,
            hasIndexHtml: !!builtAssets["index.html"],
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
