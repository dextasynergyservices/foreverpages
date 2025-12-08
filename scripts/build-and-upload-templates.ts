/**
 * Script to manually build and upload existing templates
 * This populates the artifactAssets field for templates that don't have built files yet
 */

import { PrismaClient } from "../src/generated/prisma/index.js";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { uploadTemplateBuiltFiles } from "../src/lib/templates/upload-built-files.js";

const execAsync = promisify(exec);
const prisma = new PrismaClient();

async function buildAndUploadTemplate(templateId: string, slug: string) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📦 Processing: ${slug}`);
  console.log(`   ID: ${templateId}`);

  const templatePath = path.join(process.cwd(), "src", "app", "templates", slug);

  try {
    // Check if template directory exists
    await fs.access(templatePath);
    console.log(`   ✓ Found template directory`);
  } catch {
    console.log(`   ✗ Template directory not found: ${templatePath}`);
    return false;
  }

  try {
    // Check if package.json exists
    const packageJsonPath = path.join(templatePath, "package.json");
    await fs.access(packageJsonPath);
    console.log(`   ✓ Found package.json`);
  } catch {
    console.log(`   ⚠ No package.json - skipping`);
    return false;
  }

  try {
    // Install dependencies if node_modules doesn't exist
    const nodeModulesPath = path.join(templatePath, "node_modules");
    try {
      await fs.access(nodeModulesPath);
      console.log(`   ✓ Dependencies already installed`);
    } catch {
      console.log(`   📥 Installing dependencies...`);
      await execAsync("npm install", { cwd: templatePath });
      console.log(`   ✓ Dependencies installed`);
    }

    // Build the template
    console.log(`   🔨 Building template...`);
    await execAsync("npm run build", { cwd: templatePath });
    console.log(`   ✓ Build completed`);

    // Check if dist folder exists
    const distPath = path.join(templatePath, "dist");
    await fs.access(distPath);
    console.log(`   ✓ Dist folder created`);

    // Upload built files to Cloudinary
    console.log(`   ☁️  Uploading to Cloudinary...`);
    const builtAssets = await uploadTemplateBuiltFiles(templateId, distPath);
    console.log(`   ✓ Uploaded ${Object.keys(builtAssets).length} files`);

    // Update database
    await prisma.template.update({
      where: { id: templateId },
      data: {
        artifactAssets: builtAssets,
        processingStatus: "PUBLISHED",
      },
    });
    console.log(`   ✓ Database updated`);

    console.log(`\n   ✅ SUCCESS: ${slug} is now ready for preview!`);
    if (builtAssets["index.html"]) {
      console.log(`   🔗 Preview URL: ${builtAssets["index.html"]}`);
    }

    return true;
  } catch (err) {
    console.error(`   ❌ ERROR: Failed to process ${slug}:`, err);
    return false;
  }
}

async function main() {
  console.log("🚀 Building and uploading existing templates...\n");

  // Get all templates
  const allTemplates = await prisma.template.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      processingStatus: true,
      artifactAssets: true,
    },
  });

  // Filter templates without artifactAssets or without index.html
  const templates = allTemplates.filter((t) => {
    if (!t.artifactAssets) return true;
    const assets = t.artifactAssets as Record<string, string>;
    return !assets["index.html"];
  });

  if (templates.length === 0) {
    console.log("✓ All templates already have built assets!");
    return;
  }

  console.log(`Found ${templates.length} template(s) without built assets:\n`);

  for (const template of templates) {
    console.log(`- ${template.name} (${template.slug})`);
  }

  console.log("\nStarting build process...");

  let successCount = 0;
  let failedCount = 0;

  for (const template of templates) {
    const success = await buildAndUploadTemplate(template.id, template.slug);
    if (success) {
      successCount++;
    } else {
      failedCount++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failedCount}`);
  console.log(`   📈 Total: ${templates.length}`);
  console.log(`\n🎉 Done! Templates are now ready for live preview.\n`);
}

main()
  .catch((e) => {
    console.error("❌ Fatal error:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
