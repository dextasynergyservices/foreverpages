import { runHeavyAnalysis } from "./process";
import { PrismaClient } from "@/generated/prisma";
import type { Prisma } from "@/generated/prisma";
import fs from "fs";
import path from "path";
import os from "os";
import util from "util";
import AdmZip from "adm-zip";
import { exec as childExec } from "child_process";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { dispatchTemplateBuild } from "@/lib/github/dispatch";
import { createPrForTemplate } from "@/lib/github/pr";
import { cleanupOldExtractions } from "@/server/cleanup/cleanupExtracts";
import { runAdapter } from "./adapter";
import { pollUntilBuildComplete } from "@/lib/github/polling";

type ExecResult = { stdout: string; stderr: string };
const exec = util.promisify(childExec) as (
  cmd: string,
  opts?: { cwd?: string; timeout?: number }
) => Promise<ExecResult>;

const prisma = new PrismaClient();

type Job = { templateId: string; extractionDir: string; payload?: Prisma.JsonValue };
type DbJob = { id: string; templateId: string; extractionDir?: string; payload?: Prisma.JsonValue };

const queue: Job[] = [];
let running = false;
const dbMap = new Map<string, string>();
const JOB_DIR = path.join(process.cwd(), ".template-job-queue");

async function ensureJobDir() {
  try {
    await fs.promises.mkdir(JOB_DIR, { recursive: true });
  } catch (e) {
    console.warn("Failed to ensure job dir", e);
  }
}

async function persistJobToDisk(job: Job) {
  try {
    const fname = `${Date.now()}-${job.templateId}-${Math.random().toString(36).slice(2, 8)}.json`;
    const tmp = path.join(JOB_DIR, fname + ".tmp");
    const dest = path.join(JOB_DIR, fname);
    await fs.promises.writeFile(tmp, JSON.stringify(job), "utf8");
    await fs.promises.rename(tmp, dest);
  } catch (e) {
    console.warn("Failed to persist job to disk", e);
  }
}

async function loadDiskJobs() {
  try {
    await ensureJobDir();
    const entries = await fs.promises.readdir(JOB_DIR);
    for (const e of entries) {
      // Try to atomically claim the file by renaming it to a unique name including PID
      const src = path.join(JOB_DIR, e);
      const claimed = path.join(JOB_DIR, `${e}.claimed-${process.pid}-${Date.now()}`);
      try {
        await fs.promises.rename(src, claimed);
      } catch {
        // another process likely claimed it; skip
        continue;
      }
      try {
        const data = await fs.promises.readFile(claimed, "utf8");
        const job: Job = JSON.parse(data);
        queue.push(job);
        // remove the claimed file now that it's in memory
        await fs.promises.unlink(claimed).catch(() => {});
      } catch (err) {
        console.warn("Failed to read/queue claimed job", err);
        // try to remove to avoid stuck files
        await fs.promises.unlink(claimed).catch(() => {});
      }
    }
  } catch (e) {
    console.warn("Failed to load disk jobs", e);
  }
}

// Attempt to claim a pending DB job atomically and return it.
async function claimDbJob(): Promise<DbJob | null> {
  try {
    // Find a pending job
    const now = new Date();
    const job = await prisma.templateJob.findFirst({
      where: { status: "PENDING", updatedAt: { lte: now } },
      orderBy: { createdAt: "asc" },
      select: { id: true, templateId: true, extractionDir: true, payload: true },
    });
    if (!job) return null;
    const claimed = await prisma.templateJob.updateMany({
      where: { id: job.id, status: "PENDING" },
      data: {
        status: "CLAIMED",
        claimedAt: new Date(),
        claimedBy: `${process.env.HOSTNAME || "local"}:${process.pid}`,
      },
    });
    if (claimed.count === 0) return null; // someone else claimed it
    // refetch the job
    const j = await prisma.templateJob.findUnique({
      where: { id: job.id },
      select: { id: true, templateId: true, extractionDir: true, payload: true },
    });
    if (!j) return null;
    return {
      id: j.id,
      templateId: j.templateId,
      extractionDir: j.extractionDir || undefined,
      payload: j.payload || undefined,
    };
  } catch (e) {
    console.warn("Failed to claim DB job", e);
    return null;
  }
}

// Mark DB job done
async function markDbJobDone(id: string) {
  try {
    await prisma.templateJob.update({
      where: { id },
      data: { status: "DONE", updatedAt: new Date() },
    });
  } catch (e) {
    console.warn("Failed to mark DB job done", e);
  }
}

// On failure, increment attempt and either requeue (PENDING) or mark FAILED after max attempts
async function retryOrFailDbJob(id: string, errorMsg?: string) {
  try {
    const MAX = Number(process.env.TEMPLATE_JOB_MAX_ATTEMPTS || "3");
    const job = await prisma.templateJob.findUnique({ where: { id }, select: { attempt: true } });
    const attempt = (job?.attempt || 0) + 1;
    if (attempt >= MAX) {
      await prisma.templateJob.update({
        where: { id },
        data: { status: "FAILED", attempt, error: errorMsg || undefined, updatedAt: new Date() },
      });
    } else {
      // compute exponential backoff (base seconds)
      const base = Number(process.env.TEMPLATE_JOB_BACKOFF_BASE_SEC || "10");
      const backoffSec = Math.pow(2, attempt - 1) * base; // 10,20,40,...
      const nextAttempt = new Date(Date.now() + backoffSec * 1000);
      // reset claimed info and schedule next attempt by setting updatedAt in the future
      await prisma.templateJob.update({
        where: { id },
        data: {
          status: "PENDING",
          attempt,
          error: errorMsg || undefined,
          claimedAt: null,
          claimedBy: null,
          updatedAt: nextAttempt,
        },
      });
    }
  } catch (e) {
    console.warn("Failed to retry/fail DB job", e);
  }
}

/**
 * Handle remote GitHub build: dispatch, poll for completion, create PR
 */
async function handleRemoteBuildWithPolling(templateId: string, packageUrl: string): Promise<void> {
  try {
    console.log(`[queue] 🔄 Starting remote build workflow for template ${templateId}`);

    // Dispatch the build
    const callbackUrl =
      process.env.TEMPLATE_BUILD_CALLBACK_URL ||
      `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/admin/templates/${templateId}/build-callback`;

    console.log(`[queue] 📤 Dispatching GitHub build for ${templateId}`);
    await dispatchTemplateBuild(templateId, packageUrl, callbackUrl);

    // Update status
    await prisma.template.update({
      where: { id: templateId },
      data: {
        processingStatus: "PROCESSING",
        processingLogs: "Build dispatched to GitHub, polling for completion...",
      },
    });

    // Poll for build completion (10 minute timeout, 15 second intervals)
    console.log(`[queue] ⏳ Polling for build completion for ${templateId}`);
    const buildSucceeded = await pollUntilBuildComplete(templateId, 600, 15);

    if (!buildSucceeded) {
      console.error(`[queue] ❌ Build failed or timed out for ${templateId}`);
      await prisma.template.update({
        where: { id: templateId },
        data: {
          processingStatus: "ERROR",
          processingLogs: "GitHub build failed or timed out",
        },
      });
      return;
    }

    // Build succeeded - now create PR from the artifact
    console.log(`[queue] ✓ Build succeeded for ${templateId}, creating PR...`);

    try {
      // Download artifact - use os.tmpdir() and ensure parent exists
      const tmpDir = path.join(os.tmpdir(), "foreverpages-templates");
      await fs.promises.mkdir(tmpDir, { recursive: true });
      const tmpBase = fs.mkdtempSync(path.join(tmpDir, `template-${templateId}-`));
      const zipPath = path.join(tmpBase, "artifact.zip");

      console.log(`[queue] 📥 Downloading artifact from ${packageUrl.slice(0, 80)}...`);
      const res = await fetch(packageUrl);
      if (!res.ok) throw new Error(`Failed to fetch artifact: ${res.status}`);
      const ab = await res.arrayBuffer();
      await fs.promises.writeFile(zipPath, Buffer.from(ab));

      // Extract
      console.log(`[queue] 📦 Extracting artifact (${ab.byteLength} bytes)`);
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(tmpBase, true);

      // Get template info
      const tpl = await prisma.template.findUnique({ where: { id: templateId } });
      if (!tpl) throw new Error("Template not found");

      const slug = tpl.slug || `template-${templateId}`;
      const safeSlug = String(slug || "")
        .toLowerCase()
        .replace(/[^a-z0-9\-_]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);
      const branch = `template/${safeSlug}-${templateId}-${Date.now()}`;

      // Collect files
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
              // Get path relative to tmpBase, not process.cwd()
              const rel = path.relative(tmpBase, full).replace(/\\/g, "/");
              const content = fs.readFileSync(full, "utf8");
              out.push({ path: rel, content });
            }
          }
        }
        return out;
      }

      const files = collectRelativeFiles(tmpBase);
      if (!files.length) throw new Error("No files extracted from artifact");

      // Create PR
      const title = `Add template ${slug}`;
      const body = `Automated template upload for ${slug} (id: ${templateId}).\n\nGitHub Actions build completed successfully.`;

      console.log(`[queue] 🔗 Creating PR with ${files.length} files for ${templateId}`);
      const pr = await createPrForTemplate(branch, files, title, body, "develop");

      // Update template with PR info
      await prisma.template.update({
        where: { id: templateId },
        data: {
          prNumber: pr.number.toString(),
          prUrl: pr.url,
          processingStatus: "VALIDATED",
          processingLogs: "PR created successfully",
        },
      });

      console.log(`[queue] ✅ PR created for ${templateId}: ${pr.url}`);

      // Cleanup
      try {
        await fs.promises.rm(tmpBase, { recursive: true, force: true });
      } catch (e) {
        console.warn("[queue] Failed to cleanup temp directory:", e);
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error(`[queue] ❌ Failed to create PR for ${templateId}:`, e);
      await prisma.template.update({
        where: { id: templateId },
        data: {
          processingStatus: "ERROR",
          processingLogs: `Failed to create PR: ${errorMsg}`,
        },
      });
    }
  } catch (e) {
    console.error(`[queue] ❌ Error in remote build workflow for ${templateId}:`, e);
    try {
      await prisma.template.update({
        where: { id: templateId },
        data: {
          processingStatus: "ERROR",
          processingLogs: `Remote build error: ${e instanceof Error ? e.message : String(e)}`,
        },
      });
    } catch (updateErr) {
      console.error("[queue] Failed to update template after error:", updateErr);
    }
  }
}

async function processNext() {
  if (running) return;
  // Load any persisted jobs first so multiple processes won't lose work
  if (queue.length === 0) {
    await loadDiskJobs();
  }
  // If still no in-memory jobs, try to claim a DB job
  if (queue.length === 0) {
    const dbJob = await claimDbJob();
    if (dbJob) {
      // push into in-memory queue for processing and remember job id on the object using a hidden property
      // push into in-memory queue for processing and remember job id in module-level map
      const jb: Job = {
        templateId: dbJob.templateId,
        extractionDir:
          dbJob.extractionDir ||
          path.join(process.cwd(), "tmp", `extracted-${dbJob.templateId}-${Date.now()}`),
        payload: dbJob.payload || undefined,
      };
      queue.push(jb);
      // Map using DB job id so we can finish it later
      dbMap.set(jb.templateId + "@" + jb.extractionDir, dbJob.id);
      dbMap.set(dbJob.id, dbJob.id);
    }
  }
  const job = queue.shift();
  if (!job) return;
  running = true;
  let dbJobId: string | undefined = undefined;
  // In production, local processing is disabled by default to avoid executing untrusted code on prod nodes.
  const isProd = process.env.NODE_ENV === "production";
  const allowLocal = process.env.TEMPLATE_ALLOW_LOCAL_PROCESSING === "1";
  if (isProd && !allowLocal) {
    console.warn("Local template processing disabled in production. Skipping job:", job.templateId);
    try {
      await prisma.template.update({
        where: { id: job.templateId },
        data: {
          processingStatus: "PROCESSING",
          processingLogs: "Queued for remote build dispatch",
        },
      });
      // If the template already includes an uploaded package, try to dispatch a remote build now.
      const tpl = await prisma.template.findUnique({ where: { id: job.templateId } });
      const pkgUrl = tpl?.packageUrl || undefined;
      if (pkgUrl) {
        try {
          console.log(
            `[queue] 🚀 Starting polling-based remote build for template ${job.templateId}`
          );
          // Use new polling handler that will dispatch, poll, and create PR
          await handleRemoteBuildWithPolling(job.templateId, pkgUrl);
          running = false;
          if (queue.length) processNext();
          return;
        } catch (e) {
          console.error("[queue] ❌ Polling handler failed:", e);
          // fall through to mark as error
        }
      }
    } catch (e) {
      console.warn("Failed to update template status while skipping local processing", e);
    }
    running = false;
    if (queue.length) processNext();
    return;
  }
  try {
    console.log(`Processing template ${job.templateId} at ${job.extractionDir}`);
    // If this job was claimed via DB, mark it RUNNING
    const dbJobKey = job.templateId + "@" + job.extractionDir;
    if (dbMap.has(dbJobKey)) {
      dbJobId = dbMap.get(dbJobKey)!;
      try {
        await prisma.templateJob.update({
          where: { id: dbJobId },
          data: {
            status: "RUNNING",
            claimedAt: new Date(),
            claimedBy: `${process.env.HOSTNAME || "local"}:${process.pid}`,
          },
        });
      } catch (e) {
        console.warn("Failed to mark DB job RUNNING", e);
      }
    }

    // If payload contains a packageUrl, download & extract here (worker host)
    if (job.payload && typeof job.payload === "object") {
      try {
        const payload = job.payload as Prisma.JsonObject;
        const pkgVal = payload["packageUrl"] as unknown;
        const pkg = typeof pkgVal === "string" ? pkgVal : undefined;
        if (pkg) {
          await fs.promises.mkdir(job.extractionDir, { recursive: true });
          const res = await fetch(pkg);
          if (res.ok) {
            const ab = await res.arrayBuffer();
            const zipPath = path.join(job.extractionDir, "artifact.zip");
            await fs.promises.writeFile(zipPath, Buffer.from(ab));
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(job.extractionDir, true);
          } else {
            console.warn(`Failed to fetch packageUrl ${pkg}: ${res.status}`);
          }
        }
      } catch (e) {
        console.warn("Failed to download/extract packageUrl for job", e);
      }
    }
    const res = await runHeavyAnalysis(job.extractionDir);
    // upload logs to Cloudinary (raw) and save a trimmed copy in DB
    const fullOutput = res.output ?? "";
    let logsUrl: string | undefined;
    try {
      if (fullOutput.length) {
        const up = await uploadToCloudinary(Buffer.from(fullOutput, "utf-8"), {
          folder: `templates/logs/${job.templateId}`,
          resourceType: "raw",
        });
        logsUrl = up.secure_url;
      }
    } catch (e) {
      console.warn("Failed to upload logs to Cloudinary", e);
    }

    const trimmed =
      fullOutput.length > 2000 ? fullOutput.slice(0, 2000) + "\n...[truncated]" : fullOutput;

    // If analysis succeeded, attempt automatic adapter, then persist files into the repo and generate build cache/types
    if (res.success) {
      // If the package was uploaded to cloudinary (validation.uploaded.package), prefer triggering remote build
      const tpl = await prisma.template.findUnique({ where: { id: job.templateId } });
      const pkgUrl = tpl?.packageUrl || undefined;
      // If the template included a packageUrl then prefer remote build (dispatch), otherwise we'll fall back to local persistence.
      if (pkgUrl) {
        try {
          const callbackUrl =
            process.env.TEMPLATE_BUILD_CALLBACK_URL ||
            `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/admin/templates/${job.templateId}/build-callback`;
          await dispatchTemplateBuild(job.templateId, pkgUrl, callbackUrl);
          await prisma.template.update({
            where: { id: job.templateId },
            data: { processingStatus: "PROCESSING", processingLogs: trimmed || undefined },
          });
          // cleanup extraction and continue (GitHub will callback with results)
          // If this was a DB-backed job, mark it done (remote build will create a separate job on callback)
          if (dbJobId) {
            await markDbJobDone(dbJobId);
            dbMap.delete(dbJobId);
            dbMap.delete(job.templateId + "@" + job.extractionDir);
          }
          running = false;
          return;
        } catch (e) {
          console.warn("Failed to dispatch remote build, falling back to local processing", e);
        }
      }

      // Attempt Phase 2 automatic adapter (Vite → Next) before persisting files locally
      try {
        const adapterRes = await runAdapter(job.extractionDir);
        if (adapterRes.integrated) {
          console.log("Adapter integrated template (automatic).");
          // mark as VALIDATED since adapter produced a wrapper that passed lint/tsc
          await prisma.template.update({
            where: { id: job.templateId },
            data: { processingStatus: "VALIDATED", processingLogs: trimmed || undefined },
          });
          if (dbJobId) {
            await markDbJobDone(dbJobId);
            dbMap.delete(dbJobId);
            dbMap.delete(job.templateId + "@" + job.extractionDir);
          }
        } else {
          console.log("Adapter did not integrate template:", adapterRes.reason);
        }
      } catch (e) {
        console.warn("Adapter step failed", e);
      }
      try {
        const tpl = await prisma.template.findUnique({ where: { id: job.templateId } });
        const slug = tpl?.slug || `template-${job.templateId}`;
        const repoDest = path.join(
          process.cwd(),
          "src",
          "components",
          "templates",
          "components",
          "uploaded",
          slug
        );

        // Ensure destination is within repo
        if (!repoDest.startsWith(path.join(process.cwd(), "src"))) {
          throw new Error("Invalid destination path for template persistence");
        }

        // Remove existing and copy extracted files
        await fs.promises.rm(repoDest, { recursive: true, force: true });
        await fs.promises.mkdir(repoDest, { recursive: true });

        async function copyDir(src: string, dest: string) {
          const entries = await fs.promises.readdir(src, { withFileTypes: true });
          for (const e of entries) {
            const s = path.join(src, e.name);
            const d = path.join(dest, e.name);
            if (e.isDirectory()) {
              await fs.promises.mkdir(d, { recursive: true });
              await copyDir(s, d);
            } else if (e.isFile()) {
              await fs.promises.copyFile(s, d);
            }
          }
        }

        await copyDir(job.extractionDir, repoDest);

        // Generate types (.d.ts) and a simple build cache using tsc
        const buildCacheDir = path.join(process.cwd(), ".template-build-cache", slug);
        const typesOut = path.join(buildCacheDir, "types");
        const jsOut = path.join(buildCacheDir, "js");
        await fs.promises.mkdir(typesOut, { recursive: true });
        await fs.promises.mkdir(jsOut, { recursive: true });

        // collect source files
        function collectFiles(dir: string, exts = [".ts", ".tsx", ".js", ".jsx"]) {
          const out: string[] = [];
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
                if (exts.includes(path.extname(e.name))) out.push(full);
              }
            }
          }
          return out;
        }

        const srcFiles = collectFiles(repoDest);
        if (srcFiles.length) {
          // Generate declaration files
          try {
            // Create a temporary tsconfig for declaration generation to better handle mixed JS/TS sources
            const declTsconfig = {
              compilerOptions: {
                allowJs: true,
                declaration: true,
                emitDeclarationOnly: true,
                skipLibCheck: true,
                outDir: typesOut,
                allowSyntheticDefaultImports: true,
                esModuleInterop: true,
                jsx: "react",
                module: "esnext",
                target: "ES2020",
              },
              include: [repoDest],
            } as const;
            const declConfigPath = path.join(buildCacheDir, "tsconfig.decl.json");
            await fs.promises.writeFile(
              declConfigPath,
              JSON.stringify(declTsconfig, null, 2),
              "utf-8"
            );

            await exec(`npx tsc -p "${declConfigPath}"`, { cwd: process.cwd(), timeout: 120_000 });
          } catch (e) {
            console.warn("Type generation failed", e);
          }

          // Generate JS build cache
          try {
            // Create a temporary tsconfig for JS/TS build
            const buildTsconfig = {
              compilerOptions: {
                allowJs: true,
                outDir: jsOut,
                jsx: "react",
                module: "esnext",
                target: "ES2020",
                skipLibCheck: true,
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
              },
              include: [repoDest],
            } as const;
            const buildConfigPath = path.join(buildCacheDir, "tsconfig.build.json");
            await fs.promises.writeFile(
              buildConfigPath,
              JSON.stringify(buildTsconfig, null, 2),
              "utf-8"
            );

            await exec(`npx tsc -p "${buildConfigPath}"`, { cwd: process.cwd(), timeout: 180_000 });
          } catch (e) {
            console.warn("Build cache generation failed", e);
          }
        }

        // Update template record with storage and cache paths
        await prisma.template.update({
          where: { id: job.templateId },
          data: {
            processingStatus: "VALIDATED",
            processingLogs: trimmed || undefined,
            processingLogsUrl: logsUrl || undefined,
            storagePath: repoDest,
            buildCachePath: buildCacheDir,
            typesPath: typesOut,
          },
        });

        // Create a PR branch and open PR so maintainers can review
        try {
          // sanitize slug for branch name and append timestamp for uniqueness
          const safeSlug = String(slug || "")
            .toLowerCase()
            .replace(/[^a-z0-9\-_]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 60);
          const branch = `template/${safeSlug}-${job.templateId}-${Date.now()}`;
          // collect files relative to repo root
          function collectRelativeFiles(dir: string) {
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

          const files = collectRelativeFiles(repoDest);
          const title = `Add template ${slug}`;
          const body = `Automated template upload for ${slug} (id: ${job.templateId}).\n\nLogs:\n${trimmed}\n`;
          try {
            const pr = await createPrForTemplate(branch, files, title, body, "develop");
            await prisma.template.update({
              where: { id: job.templateId },
              data: {
                prNumber: pr.number.toString(),
                prUrl: pr.url,
                processingStatus: "VALIDATED",
              },
            });
            if (dbJobId) {
              await markDbJobDone(dbJobId);
              dbMap.delete(dbJobId);
              dbMap.delete(job.templateId + "@" + job.extractionDir);
            }
          } catch (e) {
            console.warn("Failed to create PR for template", e);
            if (dbJobId) {
              await retryOrFailDbJob(dbJobId, String(e));
              dbMap.delete(dbJobId);
              dbMap.delete(job.templateId + "@" + job.extractionDir);
            }
            throw e; // rethrow so outer catch sets template ERROR status
          }
        } catch (e) {
          console.warn("Failed to persist template files or generate cache", e);
          await prisma.template.update({
            where: { id: job.templateId },
            data: {
              processingStatus: "ERROR",
              processingLogs: trimmed || undefined,
              processingLogsUrl: logsUrl || undefined,
            },
          });
        }
      } catch (e) {
        console.warn("Failed to persist template files or generate cache", e);
        await prisma.template.update({
          where: { id: job.templateId },
          data: {
            processingStatus: "ERROR",
            processingLogs: trimmed || undefined,
            processingLogsUrl: logsUrl || undefined,
          },
        });
      }
    } else {
      // analysis failed
      await prisma.template.update({
        where: { id: job.templateId },
        data: {
          processingStatus: "ERROR",
          processingLogs: trimmed || undefined,
          processingLogsUrl: logsUrl || undefined,
        },
      });
      // mark DB job failed if present
      if (dbJobId) {
        await retryOrFailDbJob(dbJobId, trimmed?.slice(0, 2000));
        dbMap.delete(dbJobId);
        dbMap.delete(job.templateId + "@" + job.extractionDir);
      }
    }
  } catch (err) {
    console.error("Worker error:", err);
    try {
      await prisma.template.update({
        where: { id: job.templateId },
        data: { processingStatus: "ERROR" },
      });
      if (dbJobId) {
        await retryOrFailDbJob(dbJobId, String(err));
        dbMap.delete(dbJobId);
        dbMap.delete(job.templateId + "@" + job.extractionDir);
      }
    } catch {}
  } finally {
    // cleanup extracted files
    try {
      // If the template has a persisted package (packageUrl), keep extraction for debugging; otherwise remove
      const t = await prisma.template.findUnique({
        where: { id: job.templateId },
        select: { packageUrl: true },
      });
      if (!t?.packageUrl) {
        await fs.promises.rm(job.extractionDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.warn("Failed to remove extractionDir", e);
    }

    // Run periodic cleanup of old extractions (non-blocking)
    try {
      cleanupOldExtractions(7).catch((err) => console.warn("cleanup failed", err));
    } catch {}
    running = false;
    // process next job
    if (queue.length) processNext();
    else {
      // if no local in-memory jobs, poll DB again after a short delay
      setTimeout(
        () => processNext().catch((e) => console.warn("processNext poll failed", e)),
        2000
      );
    }
  }
}

export async function enqueueTemplateProcessing(
  templateId: string,
  extractionDirOrNull?: string | null,
  payload?: Prisma.JsonObject,
  pushNow = false
) {
  const extractionDir =
    extractionDirOrNull || path.join(process.cwd(), "tmp", `extracted-${templateId}-${Date.now()}`);
  const job: Job = { templateId, extractionDir, payload };

  // If an extractionDir was provided explicitly, or caller requested immediate in-memory wake,
  // push into in-memory queue and persist to disk
  if (extractionDirOrNull || pushNow) {
    queue.push(job);
    persistJobToDisk(job).catch((e) => console.warn("persistJobToDisk failed", e));
  }

  // create a DB TemplateJob record for cross-host durability
  try {
    const dbJob = await prisma.templateJob.create({
      data: {
        templateId,
        extractionDir: extractionDirOrNull || undefined,
        payload: payload || (extractionDirOrNull ? { extractionDir } : undefined),
        status: "PENDING",
      },
    });

    // If we pushed the job into memory for immediate processing, map the in-memory job to DB id
    if (extractionDirOrNull || pushNow) {
      dbMap.set(job.templateId + "@" + job.extractionDir, dbJob.id);
      dbMap.set(dbJob.id, dbJob.id);
    }
  } catch (e) {
    console.warn("Failed to create DB TemplateJob", e);
  }

  // If we pushed into memory, try to start processing immediately
  if (extractionDirOrNull || pushNow) await processNext();
}
