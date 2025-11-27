import { runHeavyAnalysis } from "./process";
import { PrismaClient } from "@/generated/prisma";
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

const queue: Job[] = [];
let running = false;

async function processNext() {
  if (running) return;
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
    } catch (e) {
      console.warn("Failed to update template status while skipping local processing", e);
    }
    running = false;
    if (queue.length) processNext();
    return;
  }
  try {
    console.log(`Processing template ${job.templateId} at ${job.extractionDir}`);
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
    }
  } catch (err) {
    console.error("Worker error:", err);
    try {
      await prisma.template.update({
        where: { id: job.templateId },
        data: { processingStatus: "ERROR" },
      });
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
  }
}

export function enqueueTemplateProcessing(templateId: string, extractionDir: string) {
  queue.push({ templateId, extractionDir });
  // try to start processing
  processNext();
}
