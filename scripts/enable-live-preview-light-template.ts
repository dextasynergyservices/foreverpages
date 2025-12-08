/**
 * Script to update light-template with componentPath for live preview
 */

import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function updateLightTemplateForLivePreview() {
  console.log("🔧 Updating light-template for live preview...\n");

  // Find light-template
  const template = await prisma.template.findUnique({
    where: { slug: "light-template" },
    select: { id: true, name: true, slug: true, componentPath: true },
  });

  if (!template) {
    console.error("❌ light-template not found in database");
    process.exit(1);
  }

  console.log(`Found: ${template.name} (${template.slug})`);
  console.log(`Current componentPath: ${template.componentPath || "null"}\n`);

  // Update componentPath
  const componentPath = "components/templates/components/light-template";

  await prisma.template.update({
    where: { id: template.id },
    data: {
      componentPath: componentPath,
    },
  });

  console.log(`✅ Updated componentPath to: ${componentPath}`);
  console.log(`\n🎬 light-template will now use LIVE PREVIEW via TemplateRenderer`);
  console.log(`   Preview URL: /templates/preview/${template.id}\n`);

  // Verify update
  const updated = await prisma.template.findUnique({
    where: { id: template.id },
    select: { componentPath: true },
  });

  console.log(`Verification: componentPath = ${updated?.componentPath}`);
}

updateLightTemplateForLivePreview()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
