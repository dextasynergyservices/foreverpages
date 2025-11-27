import fs from "fs";
import path from "path";

export type DependencyIssue = { pkg: string; reason: string };

// Simple blacklist/whitelist mechanism. In production, these should be
// driven by config and probably stored in a secure store.
const DEFAULT_BLACKLIST = new Set(["left-pad-malicious", "some-ssh-lib", "node-ipc"]);

export function checkPackageDependencies(extractionDir: string) {
  const pkgPath = path.join(extractionDir, "package.json");
  if (!fs.existsSync(pkgPath)) return { ok: true, issues: [] as DependencyIssue[] };
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const deps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});
    const issues: DependencyIssue[] = [];
    for (const d of Object.keys(deps)) {
      if (DEFAULT_BLACKLIST.has(d)) {
        issues.push({ pkg: d, reason: "blacklisted" });
      }
    }
    return { ok: issues.length === 0, issues };
  } catch (e: unknown) {
    return {
      ok: false,
      issues: [{ pkg: "package.json", reason: String((e as Error)?.message || e) }],
    };
  }
}
