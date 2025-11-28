// Background worker that performs static checks without executing uploaded code.
// Uses programmatic TypeScript compiler API and ESLint Node API to lint/compile files.
import fs from "fs";
import path from "path";
import ts from "typescript";
import { ESLint } from "eslint";
import { exec } from "child_process";
import util from "util";
import { scanFiles } from "@/lib/template/securityScan";
import { checkPackageDependencies } from "@/lib/template/dependencyCheck";
import { checkExtractionQuota } from "@/server/template-extracts/tempExtract";

const execAsync = util.promisify(exec);

const DEFAULT_TIMEOUT_MS = 20_000;

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

async function runTypeScriptCheck(files: string[], cwd?: string) {
  if (!files.length) return { raw: "", filtered: "", ignoredCount: 0 };
  // Attempt to load a tsconfig/jsconfig from the extraction root (if present)
  // to allow path aliases (e.g. `@/`) used by Vite projects.
  let configOptions: ts.CompilerOptions | undefined = undefined;
  let parsedFileNames: string[] | undefined = undefined;
  try {
    const base = typeof cwd === "string" && cwd.length ? cwd : process.cwd();
    const tsconfigPath = path.join(base, "tsconfig.json");
    const jsconfigPath = path.join(base, "jsconfig.json");
    let cfgPath: string | null = null;
    if (fs.existsSync(tsconfigPath)) cfgPath = tsconfigPath;
    else if (fs.existsSync(jsconfigPath)) cfgPath = jsconfigPath;
    if (cfgPath) {
      const raw = fs.readFileSync(cfgPath, "utf-8");
      const parsed = ts.parseConfigFileTextToJson(cfgPath, raw).config;
      const parsedResult = ts.parseJsonConfigFileContent(parsed, ts.sys, path.dirname(cfgPath));
      configOptions = parsedResult.options as ts.CompilerOptions;
      // Use the resolved file list from the tsconfig parser when available so that
      // user-specified `include`/`exclude` globs are respected (e.g. excluding
      // temp extraction directories or local AppData paths). The parser returns
      // file paths which may be relative; normalize to absolute paths.
      if (Array.isArray(parsedResult.fileNames) && parsedResult.fileNames.length) {
        parsedFileNames = parsedResult.fileNames.map((fn) =>
          path.isAbsolute(fn) ? fn : path.join(path.dirname(cfgPath), fn)
        );
      }
    }
  } catch {}

  // If configOptions doesn't provide helpful path mappings, add a fallback
  // mapping for the common Vite alias `@/` -> `src/`.
  const fallbackPaths = {
    baseUrl: "./",
    paths: { "@/*": ["src/*"] },
  } as unknown as ts.CompilerOptions;

  const baseOptions: ts.CompilerOptions = {
    noEmit: true,
    allowJs: true,
    checkJs: false,
    // Prefer the automatic React JSX runtime to better match modern templates
    // (this reduces classic-import related diagnostics for many Vite/CRA projects)
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
    skipLibCheck: true,
  };

  // Merge options: start from base, then apply any tsconfig options if present.
  // If tsconfig does not provide `paths`, apply a fallback mapping for `@/*`.
  const hasPaths =
    configOptions && typeof (configOptions as ts.CompilerOptions).paths !== "undefined";
  const options: ts.CompilerOptions = {
    ...baseOptions,
    ...(configOptions || {}),
    ...(hasPaths ? {} : (fallbackPaths as object)),
  };

  // If tsconfig provided a resolved fileNames list, prefer that (it respects includes/excludes).
  const fileList =
    Array.isArray(parsedFileNames) && parsedFileNames.length ? parsedFileNames : files;

  // If a shim file exists in the cwd/extraction root, include it in the program
  // so its `declare module` and JSX runtime shims are recognized by TSC.
  try {
    const base = typeof cwd === "string" && cwd.length ? cwd : process.cwd();
    const shimCandidate = path.join(base, "__template_shims.d.ts");
    if (fs.existsSync(shimCandidate) && !fileList.includes(shimCandidate)) {
      (fileList as string[]).push(shimCandidate);
    }
  } catch {}

  const program = ts.createProgram(fileList, options);
  const diagnostics = ts.getPreEmitDiagnostics(program) || [];
  if (diagnostics.length === 0) return { raw: "", filtered: "", ignoredCount: 0 };

  // Filter out benign diagnostics (missing module/declaration files)
  const benignCodes = new Set([2307, 7016]);
  const benignModuleNames = new Set([
    "react",
    "react-dom",
    "@types/react",
    "@types/react-dom",
    "next",
    "@tanstack/react-query",
    "react-router-dom",
    "sonner",
    "@/components/ui/toaster",
    "@/components/ui/sonner",
    "@/components/ui/tooltip",
  ]);
  const rawLines: string[] = [];
  const filteredLines: string[] = [];
  let ignoredCount = 0;

  for (const d of diagnostics) {
    const file = d.file;
    const pos =
      typeof d.start === "number" && file ? file.getLineAndCharacterOfPosition(d.start) : undefined;
    const fileName = file ? file.fileName : "";
    const msg = ts.flattenDiagnosticMessageText(d.messageText, "\n");
    const line = fileName ? `${fileName}:${pos?.line}:${pos?.character} - ${msg}` : msg;
    rawLines.push(line);
    // If diagnostic code is benign, or message indicates missing a known frontend module, ignore it
    let isBenign = false;
    if (d.code && benignCodes.has(d.code)) isBenign = true;
    const modMatch =
      msg.match(/Cannot find module '\s*([^']+)\s*'/i) ||
      msg.match(/Cannot find module "([^"]+)"/i) ||
      msg.match(/cannot find module '([^']+)'/i) ||
      msg.match(/cannot find module "([^"]+)"/i);
    if (modMatch && modMatch[1]) {
      const modName = modMatch[1].trim();
      if (benignModuleNames.has(modName)) isBenign = true;
    }

    // Some templates reference the global `React` UMD symbol while also being modules.
    // TypeScript emits a diagnostic like "'React' refers to a UMD global, but the current file is a module."
    // Treat that diagnostic as benign for uploaded templates since we don't install runtime deps.
    if (/refers to a UMD global/i.test(msg)) isBenign = true;

    if (isBenign) {
      ignoredCount++;
      continue;
    }
    filteredLines.push(line);
  }

  return { raw: rawLines.join("\n"), filtered: filteredLines.join("\n"), ignoredCount };
}

async function runEslintCheck(files: string[], cwd: string) {
  try {
    const eslint = new ESLint({ cwd });
    const results = await eslint.lintFiles(files);
    const formatter = await eslint.loadFormatter("stylish");
    const out = formatter.format(results);
    return { raw: out, filtered: out, ignored: false };
  } catch (e: unknown) {
    const msg = String((e as Error)?.message || e);
    // Treat missing config as informational (skip ESLint)
    if (/Could not find config file/i.test(msg) || /no ESLint configuration found/i.test(msg)) {
      return { raw: msg, filtered: "", ignored: true };
    }
    // Treat missing plugin/package (e.g. eslint-plugin-...) as non-fatal for template checks
    if (/Cannot find package/i.test(msg) || /Error: Failed to load plugin/i.test(msg)) {
      return { raw: msg, filtered: "", ignored: true };
    }
    return { raw: msg, filtered: msg, ignored: false };
  }
}

type TsCheckResult = { raw: string; filtered: string; ignoredCount: number };
type EslintCheckResult = { raw: string; filtered: string; ignored: boolean };

function runSecurityScanOnFiles(files: string[]) {
  try {
    const results = scanFiles(files);
    return results.map((r) => {
      if (r.line && r.column) return `${r.file}:${r.line}:${r.column} - ${r.message}`;
      if (r.line) return `${r.file}:${r.line} - ${r.message}`;
      return `${r.file} - ${r.message}`;
    });
  } catch (e: unknown) {
    return [`Security scan failed: ${String((e as Error)?.message || e)}`];
  }
}

function withTimeout<T>(p: Promise<T>, ms = DEFAULT_TIMEOUT_MS, msg = "Timed out") {
  let timer: NodeJS.Timeout;
  const t = new Promise<T>((_, rej) => {
    timer = setTimeout(() => rej(new Error(msg)), ms);
  });
  return Promise.race([p, t]).finally(() => clearTimeout(timer));
}

export async function runHeavyAnalysis(extractionDir: string) {
  try {
    const dockerImage = process.env.TEMPLATE_WORKER_DOCKER_IMAGE;
    // Reject if package.json contains blacklisted deps
    const depCheck = checkPackageDependencies(extractionDir);
    if (!depCheck.ok) {
      return {
        success: false,
        output: `Dependency check failed: ${JSON.stringify(depCheck.issues)}`,
      };
    }

    // Enforce extraction quota early to avoid scanning large uploads
    const quota = await checkExtractionQuota(extractionDir);
    if (!quota.ok) {
      return { success: false, output: `Extraction quota exceeded: ${quota.reason}` };
    }
    async function isDockerAvailable() {
      try {
        await withTimeout(execAsync("docker info"), 5_000, "Docker info timed out");
        return true;
      } catch {
        return false;
      }
    }

    // Programmatic checks are the default: collect TS-only files and all JS/TS files
    const tsFiles = collectFiles(extractionDir, [".ts", ".tsx"]);
    const allFiles = collectFiles(extractionDir, [".ts", ".tsx", ".js", ".jsx"]);

    // Inject a small shim declaration file for common frontend deps so TSC
    // doesn't error on missing runtime packages (we do not install deps).
    const shimPath = path.join(extractionDir, "__template_shims.d.ts");
    const shimModules = [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@tanstack/react-query",
      "react-router-dom",
      "sonner",
      "lucide-react",
      "clsx",
      "@types/react",
      "@types/react-dom",
      "class-variance-authority",
      "@radix-ui/react-dialog",
      "@radix-ui/react-slot",
    ];
    try {
      // Always overwrite the shim with a minimal, non-conflicting set of
      // third-party module declarations. This prevents template-provided
      // shims (which may declare `react` or global types) from causing
      // duplicate identifier diagnostics during worker analysis.
      const lines: string[] = [];
      for (const m of shimModules) {
        // For known third-party modules we'll provide minimal declarations below,
        // but still add a basic `declare module` line first to be safe.
        lines.push(`declare module "${m}";`);
      }

      // Provide focused, minimal declarations for libraries that expose types
      // commonly used by templates (avoid declaring `react` or global React types).
      lines.push(
        "",
        "// Minimal React runtime/type shims used by templates",
        'declare module "react" {',
        "  export type ReactNode = any;",
        "  export type ElementRef<T> = any;",
        "  export type ComponentProps<T extends keyof any> = any;",
        "  export type ComponentPropsWithoutRef<T> = any;",
        "  export type ComponentPropsWithRef<T> = any;",
        "  export interface HTMLAttributes<T> { className?: string; }",
        "  export interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {}",
        "  export type CSSProperties = any;",
        "}",
        "",
        "// Minimal cva/VariantProps shim",
        'declare module "class-variance-authority" {',
        "  export function cva(base?: any, opts?: any): any;",
        "  export type VariantProps<T = any> = any;",
        "}",
        "",
        "// Radix dialog/slot minimal shims",
        'declare module "@radix-ui/react-dialog" {',
        "  export type DialogProps = any;",
        "  export const Root: any;",
        "  export const Trigger: any;",
        "  export const Content: any;",
        "  export const Overlay: any;",
        "  export const Close: any;",
        "  export const Portal: any;",
        "  export const Title: any;",
        "  export const Description: any;",
        "}",
        "",
        'declare module "@radix-ui/react-slot" {',
        "  const Slot: any;",
        "  export { Slot };",
        "  export default Slot;",
        "}",
        "",
        "// Minimal lucide/clsx/sonner shims",
        'declare module "lucide-react" {',
        "  export type LucideProps = { className?: string; size?: number | string };",
        "  export const X: (p: LucideProps) => any;",
        "  export const Search: (p: LucideProps) => any;",
        "  export default function LucideIcon(props: LucideProps): any;",
        "}",
        "",
        'declare module "clsx" {',
        "  function clsx(...args: any[]): string;",
        "  export default clsx;",
        "}",
        "",
        'declare module "sonner" {',
        "  export const toast: any;",
        "}"
      );

      fs.writeFileSync(shimPath, lines.join("\n"), "utf-8");
      if (!tsFiles.includes(shimPath)) tsFiles.push(shimPath);
    } catch (e: unknown) {
      console.warn("Failed to write template shim:", String((e as Error)?.message || e));
    }

    const tsPromise = runTypeScriptCheck(tsFiles, extractionDir);
    const eslintPromise = runEslintCheck(allFiles, extractionDir);

    const [tsOut, eslintOut] = await Promise.all([
      withTimeout(tsPromise, DEFAULT_TIMEOUT_MS, "TypeScript check timed out"),
      withTimeout(eslintPromise, DEFAULT_TIMEOUT_MS, "ESLint timed out"),
    ]);

    const securityFindings = runSecurityScanOnFiles(allFiles);

    const outputParts: string[] = [];
    const tsRes = (tsOut as TsCheckResult) || { raw: "", filtered: "", ignoredCount: 0 };
    const tsRaw = tsRes.raw || "";
    const tsFiltered = tsRes.filtered || "";
    // If there are no filtered (real) issues, avoid dumping the raw diagnostic list
    // (it contains many noisy "Cannot find module" messages for missing runtime deps).
    if (tsFiltered) {
      if (tsRaw) outputParts.push("TypeScript (raw):\n" + tsRaw);
      // Present TS diagnostics as warnings (non-blocking) so admins can see type issues
      // without preventing uploads. Prefix as 'TypeScript (warnings)'.
      outputParts.push("TypeScript (warnings):\n" + tsFiltered);
    } else if (tsRes.ignoredCount && tsRes.ignoredCount > 0) {
      outputParts.push(`TypeScript: ${tsRes.ignoredCount} benign diagnostics ignored`);
    }

    const esRes = (eslintOut as EslintCheckResult) || { raw: "", filtered: "", ignored: false };
    const eslintRaw = esRes.raw || "";
    const eslintFiltered = esRes.filtered || "";
    if (eslintRaw) outputParts.push("ESLint (raw):\n" + eslintRaw);
    if (eslintFiltered) outputParts.push("ESLint (issues):\n" + eslintFiltered);
    if (securityFindings && securityFindings.length)
      outputParts.push("Security scan:\n" + securityFindings.join("\n"));

    let output = outputParts.join("\n\n");
    // success is true only if there are no filtered ESLint issues and no security findings.
    // TypeScript diagnostics from uploaded templates are treated as warnings because
    // template authors may use different TS configs or non-standard typings. Keeping
    // TS diagnostics as non-blocking avoids rejecting uploads for template-local type
    // issues while still surfacing them to admins for inspection.
    const hasEslintIssues = !!eslintFiltered && eslintFiltered.trim().length > 0;
    const hasSecurity = securityFindings && securityFindings.length > 0;

    // By default, ESLint issues are warnings (non-blocking) because templates
    // may use custom lint configs and plugins not present in the worker. Set
    // TEMPLATE_ENFORCE_LINT=1 to make ESLint failures block uploads in CI/strict
    // environments.
    const enforceLint = process.env.TEMPLATE_ENFORCE_LINT === "1";
    const lintBlocking = enforceLint ? hasEslintIssues : false;
    const success = !lintBlocking && !hasSecurity;

    // Optionally run docker parity checks only when explicitly requested
    // Only allow docker parity when explicitly enabled and not on production node
    // Use the canonical env var `TEMPLATE_ALLOW_LOCAL_PARITY` across the codebase
    const allowLocalParity = process.env.TEMPLATE_ALLOW_LOCAL_PARITY === "1";
    const runDockerParity = Boolean(
      dockerImage && allowLocalParity && process.env.NODE_ENV !== "production"
    );
    if (runDockerParity) {
      const dockerAvailable = await isDockerAvailable();
      if (dockerAvailable) {
        const dockerCmd = [
          "shopt -s globstar nullglob",
          "files=(**/*.ts **/*.tsx)",
          "if [ ${#files[@]} -gt 0 ]; then",
          "  npx tsc --noEmit || true",
          "else",
          "  echo 'No TS files found, skipping tsc'",
          "fi",
          "npx eslint . || true",
        ].join("\n");

        const cmd = `docker run --rm -v "${extractionDir}:/work" -w /work ${dockerImage} /bin/bash -lc "${dockerCmd}"`;
        try {
          const { stdout, stderr } = await withTimeout(
            execAsync(cmd),
            DEFAULT_TIMEOUT_MS * 3,
            "Docker worker timed out"
          );
          const dockerOut = `${stdout || ""}\n${stderr || ""}`.trim();
          if (dockerOut.length) output += `\n\nDocker parity output:\n${dockerOut}`;
        } catch (e: unknown) {
          output += `\n\nDocker parity failed: ${String((e as Error)?.message || e)}`;
        }
      } else {
        output += "\n\nDocker parity skipped: docker not available";
      }
    }

    return { success, output };
  } catch (err: unknown) {
    return { success: false, output: String((err as Error)?.message || err) };
  }
}
