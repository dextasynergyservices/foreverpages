/**
 * Script to check template preview capabilities
 * Verifies which templates can use live preview
 */

import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function checkTemplatePreviewCapabilities() {
  console.log("🔍 Checking template preview capabilities...\n");

  const templates = await prisma.template.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      componentPath: true,
      artifactAssets: true,
      previewImage: true,
      thumbnailImage: true,
      processingStatus: true,
    },
  });

  console.log(`Found ${templates.length} template(s)\n`);

  for (const template of templates) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📋 ${template.name} (${template.slug})`);
    console.log(`   ID: ${template.id}`);
    console.log(`   Status: ${template.processingStatus}`);

    // Check bundled template
    const hasBundledComponent =
      template.componentPath && template.componentPath.includes("components/templates");
    if (hasBundledComponent) {
      console.log(`   ✅ Live Preview: YES (Bundled Template)`);
      console.log(`      Method: TemplateRenderer via /templates/preview/${template.id}`);
      console.log(`      Path: ${template.componentPath}`);
    }

    // Check uploaded template with built artifacts
    const artifactAssets = template.artifactAssets as Record<string, string> | null;
    const hasBuiltArtifact =
      artifactAssets && typeof artifactAssets === "object" && "index.html" in artifactAssets;

    if (hasBuiltArtifact) {
      console.log(`   ✅ Live Preview: YES (Uploaded Template)`);
      console.log(`      Method: Built artifact iframe`);
      console.log(`      URL: ${artifactAssets["index.html"]}`);
      console.log(`      Assets: ${Object.keys(artifactAssets).length} file(s)`);
    }

    // Check fallback to preview image
    if (!hasBundledComponent && !hasBuiltArtifact) {
      if (template.previewImage) {
        console.log(`   📸 Static Preview: YES (Preview Image)`);
        console.log(`      URL: ${template.previewImage}`);
      } else if (template.thumbnailImage) {
        console.log(`   📸 Static Preview: YES (Thumbnail Image)`);
        console.log(`      URL: ${template.thumbnailImage}`);
      } else {
        console.log(`   ⏳ Placeholder: Will show placeholder`);
        if (template.processingStatus === "PROCESSING") {
          console.log(`      Reason: Template is still processing`);
        } else {
          console.log(`      Reason: No preview available yet`);
        }
      }
    }

    console.log("");
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log("\n📊 Summary:");

  const bundledCount = templates.filter(
    (t) => t.componentPath && t.componentPath.includes("components/templates")
  ).length;

  const uploadedCount = templates.filter((t) => {
    const assets = t.artifactAssets as Record<string, string> | null;
    return assets && typeof assets === "object" && "index.html" in assets;
  }).length;

  const imageCount = templates.filter(
    (t) =>
      !(t.componentPath && t.componentPath.includes("components/templates")) &&
      !(
        t.artifactAssets &&
        typeof t.artifactAssets === "object" &&
        "index.html" in (t.artifactAssets as Record<string, string>)
      ) &&
      (t.previewImage || t.thumbnailImage)
  ).length;

  const placeholderCount = templates.filter(
    (t) =>
      !(t.componentPath && t.componentPath.includes("components/templates")) &&
      !(
        t.artifactAssets &&
        typeof t.artifactAssets === "object" &&
        "index.html" in (t.artifactAssets as Record<string, string>)
      ) &&
      !t.previewImage &&
      !t.thumbnailImage
  ).length;

  console.log(`   🎬 Live Preview (Bundled): ${bundledCount}`);
  console.log(`   🚀 Live Preview (Uploaded): ${uploadedCount}`);
  console.log(`   📸 Static Image: ${imageCount}`);
  console.log(`   🎨 Placeholder: ${placeholderCount}`);
  console.log(
    `   📈 Coverage: ${Math.round(((bundledCount + uploadedCount + imageCount) / templates.length) * 100)}%\n`
  );
}

checkTemplatePreviewCapabilities()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
