import fs from "fs";
import os from "os";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function createTempExtractionBase(prefix = "template-extract-") {
  const tmpBase = await fs.promises.mkdtemp(path.join(os.tmpdir(), prefix));
  return tmpBase;
}

export function extractionPathsForBase(tmpBase: string) {
  const extractionDir = path.join(tmpBase, uuidv4());
  return { tmpBase, extractionDir };
}

export async function ensureExtractionDir(extractionDir: string) {
  await fs.promises.mkdir(extractionDir, { recursive: true });
}

export async function checkExtractionQuota(
  extractionDir: string,
  maxBytes = 50 * 1024 * 1024,
  maxFiles = 2000
) {
  // walk directory and compute total bytes and file count
  let total = 0;
  let count = 0;
  function walkSync(p: string) {
    const entries = fs.readdirSync(p, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(p, e.name);
      if (e.isDirectory()) {
        walkSync(full);
        continue;
      }
      if (e.isFile()) {
        count++;
        try {
          const st = fs.statSync(full);
          total += st.size;
        } catch {}
      }
    }
  }
  try {
    walkSync(extractionDir);
  } catch (e) {
    return { ok: false, reason: `quota-check-failed: ${String((e as Error)?.message || e)}` };
  }
  if (total > maxBytes) return { ok: false, reason: `exceeds-bytes:${total}` };
  if (count > maxFiles) return { ok: false, reason: `exceeds-files:${count}` };
  return { ok: true, total, count };
}

export async function cleanupExtractionBase(tmpBase: string) {
  try {
    await fs.promises.rm(tmpBase, { recursive: true, force: true });
  } catch (err) {
    console.warn("Failed to cleanup extraction base", tmpBase, err);
  }
}
