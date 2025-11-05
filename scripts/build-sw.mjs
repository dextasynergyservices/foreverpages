#!/usr/bin/env node

import { execSync } from "child_process";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

console.log("Building TypeScript service worker...");

try {
  // Compile the service worker using TypeScript
  execSync("npx tsc -p tsconfig.sw.json", {
    stdio: "inherit",
    cwd: join(__dirname, ".."),
  });

  console.log("✅ Service worker compiled successfully to public/sw.js");
} catch (error) {
  console.error("❌ Failed to compile service worker:", error.message);
  process.exit(1);
}
