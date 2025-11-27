import fs from "fs";
import path from "path";
import child from "child_process";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function run(cmd, opts = {}) {
  console.log(">", cmd);
  return child.execSync(cmd, { stdio: "inherit", env: process.env, ...opts });
}

function detectVite(dir) {
  const pkgPath = path.join(dir, "package.json");
  if (!fs.existsSync(pkgPath)) return false;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    if (
      (pkg.dependencies && pkg.dependencies.vite) ||
      (pkg.devDependencies && pkg.devDependencies.vite)
    )
      return true;
  } catch (err) {
    console.warn("Failed to parse package.json", pkgPath, err && err.message);
  }
  if (
    fs.existsSync(path.join(dir, "vite.config.js")) ||
    fs.existsSync(path.join(dir, "vite.config.ts"))
  )
    return true;
  return false;
}

function findEntry(dir) {
  const candidates = [
    "src/App.tsx",
    "src/App.jsx",
    "src/main.tsx",
    "src/main.jsx",
    "src/index.tsx",
    "src/index.jsx",
  ];
  for (const c of candidates) {
    const p = path.join(dir, c);
    if (fs.existsSync(p)) return p;
  }
  const tj = path.join(dir, "template.json");
  if (fs.existsSync(tj)) {
    try {
      const tjd = JSON.parse(fs.readFileSync(tj, "utf8"));
      if (tjd.entry) return path.join(dir, tjd.entry);
    } catch (err) {
      console.warn("Failed to parse template.json", tj, err && err.message);
    }
  }
  return null;
}

function synthesizeWrapper(entryPath, outDir) {
  let relEntry = path.relative(outDir, entryPath).replace(/\\/g, "/");
  relEntry = relEntry.replace(/\.tsx?$/i, "");
  const wrapper =
    'import React from "react";\n' +
    `import ViteApp from \"${relEntry}\";\n\n` +
    "type TemplateProps = Record<string, unknown>;\n\n" +
    "const ViteAppTyped = ViteApp as React.ComponentType<Record<string, unknown>>;\n\n" +
    "export const MemorialTemplate: React.FC<TemplateProps> = (props) => {\n" +
    "  return React.createElement(ViteAppTyped, { ...props });\n" +
    "};\n\nexport default MemorialTemplate;\n";

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const wrapperPath = path.join(outDir, "MemorialTemplate.tsx");
  fs.writeFileSync(wrapperPath, wrapper, "utf8");
  return wrapperPath;
}

function integrate(sampleExtractDir) {
  console.log("Integrating sample:", sampleExtractDir);
  if (!fs.existsSync(sampleExtractDir)) {
    console.error("Sample extract dir does not exist:", sampleExtractDir);
    return { integrated: false, reason: "no-extract" };
  }
  if (!detectVite(sampleExtractDir)) return { integrated: false, reason: "not-vite" };
  const entry = findEntry(sampleExtractDir);
  if (!entry) return { integrated: false, reason: "no-entry" };
  const work = path.join(sampleExtractDir, "__integrate");
  if (!fs.existsSync(work)) fs.mkdirSync(work, { recursive: true });
  const wrapperPath = synthesizeWrapper(entry, work);
  console.log("Wrapper written:", wrapperPath);
  try {
    run(`pnpm -s eslint "${wrapperPath}" --ext .ts,.tsx --max-warnings=0`, { cwd: process.cwd() });
  } catch (err) {
    console.error("ESLint failed for wrapper:", err && err.message);
    return { integrated: false, reason: "eslint-failed" };
  }

  // Create an isolated tsconfig in the work dir to avoid repo-wide type noise
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
  const tcPath = path.join(work, "tsconfig.json");
  fs.writeFileSync(tcPath, JSON.stringify(tsconfig, null, 2), "utf8");

  try {
    run(`pnpm -s tsc -p "${work}"`, { cwd: process.cwd() });
  } catch (err) {
    console.error("TypeScript check failed for wrapper:", err && err.message);
    return { integrated: false, reason: "tsc-failed" };
  }

  return { integrated: true, wrapperPath };
}

if (process.argv[1] === __filename) {
  const sampleExtractDir = path.resolve(__dirname, "../.template-test/extracted");
  const res = integrate(sampleExtractDir);
  console.log("Result:", res);
}

export { integrate };
