#!/usr/bin/env node

/**
 * Build script for all templates in src/app/templates/
 * This runs during deployment to build templates as static sites
 * Output goes to public/templates-built/{slug}/
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, "../src/app/templates");
const OUTPUT_DIR = path.join(__dirname, "../public/templates-built");

async function buildTemplate(templateName) {
  const templatePath = path.join(TEMPLATES_DIR, templateName);
  const packageJsonPath = path.join(templatePath, "package.json");

  // Skip if not a template directory (no package.json)
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`⏭️  Skipping ${templateName} (not a template)`);
    return;
  }

  console.log(`\n🔨 Building template: ${templateName}`);

  try {
    // Run npm install
    console.log(`   📦 Installing dependencies...`);
    execSync("npm install", {
      cwd: templatePath,
      stdio: "inherit",
    });

    // Run build
    console.log(`   🏗️  Building...`);
    execSync("npm run build", {
      cwd: templatePath,
      stdio: "inherit",
    });

    // Copy dist to public
    const distPath = path.join(templatePath, "dist");
    const outputPath = path.join(OUTPUT_DIR, templateName);

    if (fs.existsSync(distPath)) {
      console.log(`   📁 Copying build output to public/templates-built/${templateName}/`);

      // Create output directory
      fs.mkdirSync(outputPath, { recursive: true });

      // Copy all files from dist to output
      copyDir(distPath, outputPath);

      console.log(`   ✅ ${templateName} built successfully`);
    } else {
      console.warn(`   ⚠️  No dist folder found for ${templateName}`);
    }
  } catch (error) {
    console.error(`   ❌ Failed to build ${templateName}:`, error);
    throw error;
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function buildAllTemplates() {
  console.log("🚀 Building all templates...\n");

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Get all directories in templates folder
  const entries = fs.readdirSync(TEMPLATES_DIR, { withFileTypes: true });
  const templateDirs = entries
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !entry.name.startsWith(".") && !entry.name.startsWith("preview"))
    .map((entry) => entry.name);

  console.log(`Found ${templateDirs.length} template(s): ${templateDirs.join(", ")}\n`);

  // Build each template
  for (const templateDir of templateDirs) {
    try {
      await buildTemplate(templateDir);
    } catch {
      console.error(`Failed to build ${templateDir}, continuing...`);
    }
  }

  console.log("\n✅ All templates built successfully!");
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildAllTemplates().catch((error) => {
    console.error("❌ Build failed:", error);
    process.exit(1);
  });
}

export { buildAllTemplates, buildTemplate };
