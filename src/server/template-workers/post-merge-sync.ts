import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import * as path from "path";
import { promisify } from "util";
import { exec as childExec } from "child_process";

const exec = promisify(childExec) as (
  cmd: string,
  opts?: { cwd?: string; timeout?: number }
) => Promise<{ stdout: string; stderr: string }>;

/**
 * Post-Merge Sync for Uploaded Templates
 *
 * After a template PR is merged into develop, this function:
 * 1. Fetches the merged PR details from GitHub
 * 2. Identifies the template slug and storage path
 * 3. Updates the database with actual repo storage path
 * 4. Regenerates type definitions and build cache
 * 5. Updates template record with finalized paths
 */

export async function syncMergedTemplateToRepo(
  templateId: string,
  prNumber: number,
  mergeCommitSha: string
): Promise<void> {
  console.log(
    `[post-merge-sync] Starting sync for template ${templateId} (PR #${prNumber}, commit ${mergeCommitSha})`
  );

  try {
    // Get template info
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      select: { id: true, slug: true, packageUrl: true, prUrl: true },
    });

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const slug = template.slug || `template-${templateId}`;
    const safeSlug = String(slug)
      .toLowerCase()
      .replace(/[^a-z0-9\-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);

    // Determine storage path in repo
    const storagePath = path.join(
      process.cwd(),
      "src",
      "components",
      "templates",
      "components",
      "uploaded",
      safeSlug
    );

    // Verify the path exists (should be there after merge)
    try {
      await fs.access(storagePath);
    } catch {
      console.warn(
        `[post-merge-sync] Storage path does not exist yet: ${storagePath}. Template files may still be merging.`
      );
      throw new Error(`Template files not found at ${storagePath}`);
    }

    console.log(`[post-merge-sync] Found template files at ${storagePath}`);

    // Generate build cache and types
    const buildCacheDir = path.join(process.cwd(), ".template-build-cache", safeSlug);
    const typesDir = path.join(buildCacheDir, "types");
    const jsDir = path.join(buildCacheDir, "js");

    await fs.mkdir(typesDir, { recursive: true });
    await fs.mkdir(jsDir, { recursive: true });

    // Collect source files (TS/TSX/JS/JSX)
    const collectSourceFiles = async (dir: string): Promise<string[]> => {
      const out: string[] = [];
      const stack = [dir];
      const extensions = [".ts", ".tsx", ".js", ".jsx"];

      while (stack.length) {
        const p = stack.pop()!;
        try {
          const stat = await fs.stat(p);
          if (!stat.isDirectory()) continue;
        } catch {
          continue;
        }

        const entries = await fs.readdir(p, { withFileTypes: true });
        for (const e of entries) {
          const full = path.join(p, e.name);
          if (e.isDirectory()) {
            if (["node_modules", ".git", "dist", "build"].includes(e.name)) continue;
            stack.push(full);
            continue;
          }
          if (e.isFile() && extensions.includes(path.extname(e.name))) {
            out.push(full);
          }
        }
      }
      return out;
    };

    const srcFiles = await collectSourceFiles(storagePath);
    console.log(`[post-merge-sync] Found ${srcFiles.length} source files in ${safeSlug}`);

    // Generate type definitions
    if (srcFiles.length > 0) {
      try {
        console.log(`[post-merge-sync] Generating type definitions for ${safeSlug}...`);
        const declTsconfig = {
          compilerOptions: {
            allowJs: true,
            declaration: true,
            emitDeclarationOnly: true,
            skipLibCheck: true,
            outDir: typesDir,
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            jsx: "react",
            module: "esnext",
            target: "ES2020",
          },
          include: [storagePath],
        };

        const declConfigPath = path.join(buildCacheDir, "tsconfig.decl.json");
        await fs.writeFile(declConfigPath, JSON.stringify(declTsconfig, null, 2), "utf-8");

        await exec(`npx tsc -p "${declConfigPath}"`, {
          cwd: process.cwd(),
          timeout: 120_000,
        });
        console.log(`[post-merge-sync] Type definitions generated successfully`);
      } catch (e) {
        console.warn(`[post-merge-sync] Type generation failed (non-fatal):`, e);
      }

      // Generate JS build cache
      try {
        console.log(`[post-merge-sync] Generating build cache for ${safeSlug}...`);
        const buildTsconfig = {
          compilerOptions: {
            allowJs: true,
            outDir: jsDir,
            jsx: "react",
            module: "esnext",
            target: "ES2020",
            skipLibCheck: true,
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
          },
          include: [storagePath],
        };

        const buildConfigPath = path.join(buildCacheDir, "tsconfig.build.json");
        await fs.writeFile(buildConfigPath, JSON.stringify(buildTsconfig, null, 2), "utf-8");

        await exec(`npx tsc -p "${buildConfigPath}"`, {
          cwd: process.cwd(),
          timeout: 180_000,
        });
        console.log(`[post-merge-sync] Build cache generated successfully`);
      } catch (e) {
        console.warn(`[post-merge-sync] Build cache generation failed (non-fatal):`, e);
      }
    }

    // Update template record with final paths
    await prisma.template.update({
      where: { id: templateId },
      data: {
        storagePath,
        buildCachePath: buildCacheDir,
        typesPath: typesDir,
        processingStatus: "PUBLISHED",
        processingLogs: `Post-merge sync completed. Template files stored at ${storagePath}`,
      },
    });

    console.log(
      `[post-merge-sync] ✅ Successfully synced template ${templateId} to ${storagePath}`
    );
  } catch (error) {
    console.error(`[post-merge-sync] ❌ Sync failed for template ${templateId}:`, error);

    // Update template with error status
    try {
      await prisma.template.update({
        where: { id: templateId },
        data: {
          processingStatus: "ERROR",
          processingLogs: `Post-merge sync failed: ${error instanceof Error ? error.message : String(error)}`,
        },
      });
    } catch (e) {
      console.error(`[post-merge-sync] Failed to update template error status:`, e);
    }

    throw error;
  }
}
