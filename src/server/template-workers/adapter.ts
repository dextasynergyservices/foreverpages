import fs from "fs";
import path from "path";
import util from "util";
import { exec as childExec } from "child_process";

const exec = util.promisify(childExec) as (
  cmd: string,
  opts?: { cwd?: string; timeout?: number }
) => Promise<{ stdout: string; stderr: string }>;

type AdapterResult = { integrated: boolean; reason?: string };

export async function runAdapter(extractionDir: string): Promise<AdapterResult> {
  try {
    const pkgPath = path.join(extractionDir, "package.json");
    let isVite = false;
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        if (
          (pkg.dependencies && pkg.dependencies.vite) ||
          (pkg.devDependencies && pkg.devDependencies.vite)
        )
          isVite = true;
      } catch {}
    }
    if (!isVite) {
      if (
        fs.existsSync(path.join(extractionDir, "vite.config.js")) ||
        fs.existsSync(path.join(extractionDir, "vite.config.ts"))
      )
        isVite = true;
    }

    if (!isVite) return { integrated: false, reason: "not-vite" };

    // find entry
    const candidates = [
      "src/App.tsx",
      "src/App.jsx",
      "src/main.tsx",
      "src/main.jsx",
      "src/index.tsx",
      "src/index.jsx",
    ];
    let entry: string | null = null;
    for (const c of candidates) {
      const p = path.join(extractionDir, c);
      if (fs.existsSync(p)) {
        entry = p;
        break;
      }
    }
    const tj = path.join(extractionDir, "template.json");
    if (!entry && fs.existsSync(tj)) {
      try {
        const tjd = JSON.parse(fs.readFileSync(tj, "utf8"));
        if (tjd.entry) entry = path.join(extractionDir, tjd.entry);
      } catch {}
    }

    if (!entry) return { integrated: false, reason: "no-entry" };

    // create a work dir under the extraction for integration checks
    const work = path.join(extractionDir, "__integrate");
    if (!fs.existsSync(work)) fs.mkdirSync(work, { recursive: true });
    const wrapperPath = path.join(work, "MemorialTemplate.tsx");
    let rel = path.relative(path.dirname(wrapperPath), entry).replace(/\\/g, "/");
    rel = rel.replace(/\.tsx?$/i, "");
    const wrapperSource = `import React from \"react\";\nimport ViteApp from \"${rel}\";\n\ntype TemplateProps = Record<string, unknown>;\n\nconst ViteAppTyped = ViteApp as React.ComponentType<Record<string, unknown>>;\n\nexport const MemorialTemplate: React.FC<TemplateProps> = (props) => {\n  return React.createElement(ViteAppTyped, { ...props });\n};\n\nexport default MemorialTemplate;\n`;
    fs.writeFileSync(wrapperPath, wrapperSource, "utf8");

    // Minimal ESLint config to perform basic parsing/linting of the wrapper only
    const eslintConfigPath = path.join(work, ".eslintrc.adapter.json");
    const eslintConfig = {
      parser: "@typescript-eslint/parser",
      parserOptions: { ecmaVersion: 2020, sourceType: "module", ecmaFeatures: { jsx: true } },
      plugins: ["@typescript-eslint"],
      rules: {},
    };
    fs.writeFileSync(eslintConfigPath, JSON.stringify(eslintConfig, null, 2), "utf8");

    // Create an isolated tsconfig inside the work dir to avoid loading repo-wide types and libs
    const tcPath = path.join(work, "tsconfig.json");
    const tsconfig = {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        jsx: "react-jsx",
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: "bundler",
        skipLibCheck: true,
        strict: false,
        lib: ["ES2022", "DOM"],
        types: ["node", "vite/client"],
      },
      files: [
        path.relative(work, wrapperPath).replace(/\\/g, "/"),
        path.relative(work, entry).replace(/\\/g, "/"),
      ],
    };
    fs.writeFileSync(tcPath, JSON.stringify(tsconfig, null, 2), "utf8");

    // Run ESLint and TypeScript inside the work dir
    try {
      await exec(
        `pnpm -s eslint --config "${eslintConfigPath}" "${wrapperPath}" --ext .ts,.tsx --max-warnings=0`,
        { cwd: work, timeout: 60_000 }
      );
    } catch {
      try {
        fs.unlinkSync(wrapperPath);
      } catch {}
      return { integrated: false, reason: "eslint-failed" };
    }

    try {
      await exec(`pnpm -s tsc -p "${work}"`, { cwd: work, timeout: 60_000 });
    } catch {
      try {
        fs.unlinkSync(wrapperPath);
      } catch {}
      return { integrated: false, reason: "tsc-failed" };
    }

    return { integrated: true };
  } catch {
    return { integrated: false, reason: "adapter-error" };
  }
}
