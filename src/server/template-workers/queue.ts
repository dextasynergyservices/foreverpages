import { runHeavyAnalysis } from "./process";
import { PrismaClient } from "@/generated/prisma";
import type { Prisma } from "@/generated/prisma";
import fs from "fs";
import path from "path";
import util from "util";
import { exec as childExec } from "child_process";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { dispatchTemplateBuild } from "@/lib/github/dispatch";
import { createPrForTemplate } from "@/lib/github/pr";
import { cleanupOldExtractions } from "@/server/cleanup/cleanupExtracts";
import { runAdapter } from "./adapter";

type ExecResult = { stdout: string; stderr: string };
const exec = util.promisify(childExec) as (
  cmd: string,
  opts?: { cwd?: string; timeout?: number }
) => Promise<ExecResult>;

const prisma = new PrismaClient();

type Job = { templateId: string; extractionDir: string };
type DbJob = { id: string; templateId: string; extractionDir?: string };

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
    const job = await prisma.templateJob.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
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
    const j = await prisma.templateJob.findUnique({ where: { id: job.id } });
    if (!j) return null;
    return { id: j.id, templateId: j.templateId, extractionDir: j.extractionDir || undefined };
  } catch (e) {
    console.warn("Failed to claim DB job", e);
    return null;
  }
}

// Mark DB job done/failed
async function finishDbJob(id: string, success: boolean, errorMsg?: string) {
  try {
    await prisma.templateJob.update({
      where: { id },
      data: {
        status: success ? "DONE" : "FAILED",
        error: errorMsg || undefined,
        updatedAt: new Date(),
      },
    });
  } catch (e) {
    console.warn("Failed to mark DB job finished", e);
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
      };
      queue.push(jb);
      dbMap.set(jb.templateId + "@" + jb.extractionDir, dbJob.id);
    }
  }
  const job = queue.shift();
  if (!job) return;
  running = true;
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
          const callbackUrl =
            process.env.TEMPLATE_BUILD_CALLBACK_URL ||
            `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/admin/templates/${job.templateId}/build-callback`;
          await dispatchTemplateBuild(job.templateId, pkgUrl, callbackUrl);
          // leave status as PROCESSING and logs as-is; remote build will callback when done
          running = false;
          if (queue.length) processNext();
          return;
        } catch (e) {
          console.warn("Failed to dispatch remote build while skipping local processing", e);
          // fall through to return so job remains marked as queued for remote processing
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
      const dbJobId = dbMap.get(dbJobKey)!;
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
          const branch = `template/${slug}-${job.templateId}`;
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
          const pr = await createPrForTemplate(branch, files, title, body, "develop");
          await prisma.template.update({
            where: { id: job.templateId },
            data: { prNumber: pr.number.toString(), prUrl: pr.url, processingStatus: "VALIDATED" },
          });
        } catch (e) {
          console.warn("Failed to create PR for template", e);
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
      if (dbMap.has(job.templateId + "@" + job.extractionDir)) {
        const id = dbMap.get(job.templateId + "@" + job.extractionDir)!;
        await finishDbJob(id, false, trimmed?.slice(0, 2000));
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
      if (dbMap.has(job.templateId + "@" + job.extractionDir)) {
        const id = dbMap.get(job.templateId + "@" + job.extractionDir)!;
        await finishDbJob(id, false, String(err));
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

export function enqueueTemplateProcessing(templateId: string, extractionDir: string) {
  const job = { templateId, extractionDir };
  queue.push(job);
  // persist job for durability across processes
  persistJobToDisk(job).catch((e) => console.warn("persistJobToDisk failed", e));
  // create a DB TemplateJob record for cross-host durability
  (async () => {
    try {
      const payload = { extractionDir };
      await prisma.templateJob.create({
        data: {
          templateId,
          extractionDir,
          payload: payload as Prisma.JsonObject,
          status: "PENDING",
        },
      });
    } catch (e) {
      console.warn("Failed to create DB TemplateJob", e);
    }
  })();
  // try to start processing
  processNext();
}
