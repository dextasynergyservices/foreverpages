import fs from "fs";
import path from "path";
import os from "os";

export async function cleanupOldExtractions(daysOld = 7) {
  const tmp = os.tmpdir();
  const prefix = "template-extract-";
  const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000;
  try {
    const entries = await fs.promises.readdir(tmp, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (!e.name.startsWith(prefix)) continue;
      const full = path.join(tmp, e.name);
      const stat = await fs.promises.stat(full);
      if (stat.mtime.getTime() < cutoff) {
        try {
          await fs.promises.rm(full, { recursive: true, force: true });
        } catch (err) {
          console.warn("Failed to remove old extraction", full, err);
        }
      }
    }
  } catch (err) {
    console.warn("Error during cleanupOldExtractions", err);
  }
}
