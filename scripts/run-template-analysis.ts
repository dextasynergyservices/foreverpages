#!/usr/bin/env tsx
import path from "path";
import fs from "fs";

async function main() {
  const target = process.argv[2] || "scripts/template-to-fix/Light Template";
  const abs = path.resolve(process.cwd(), target);
  if (!fs.existsSync(abs)) {
    console.error("Target path does not exist:", abs);
    process.exit(2);
  }
  try {
    const mod = await import("../src/server/template-workers/process");
    if (!mod || typeof mod.runHeavyAnalysis !== "function") {
      console.error("runHeavyAnalysis not found in module");
      process.exit(3);
    }
    console.log(`Running analysis on ${abs} ...`);
    const res = await mod.runHeavyAnalysis(abs);
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error("Error running analysis:", e);
    process.exit(1);
  }
}

main();
