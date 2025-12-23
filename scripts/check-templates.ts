import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function checkTemplates() {
  try {
    console.log("🔍 Checking existing templates in database...\n");

    const templates = await prisma.template.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        supportedSections: true,
        isActive: true,
        layoutType: true,
        isNextJsTemplate: true,
      },
      orderBy: { name: "asc" },
    });

    if (templates.length === 0) {
      console.log("❌ No templates found in database");
      return;
    }

    console.log(`✅ Found ${templates.length} templates:\n`);

    templates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name} (${template.slug})`);
      console.log(`   ID: ${template.id}`);
      console.log(`   Active: ${template.isActive}`);
      console.log(`   Next.js: ${template.isNextJsTemplate}`);
      console.log(`   Layout: ${template.layoutType}`);
      console.log(
        `   Supported Sections: ${template.supportedSections?.length ? template.supportedSections.join(", ") : "NONE ❌"}`
      );
      console.log("");
    });

    // Check if any templates are missing supportedSections
    const templatesWithoutSections = templates.filter(
      (t) => !t.supportedSections || t.supportedSections.length === 0
    );

    if (templatesWithoutSections.length > 0) {
      console.log("🚨 ISSUE FOUND: Templates missing supportedSections:");
      templatesWithoutSections.forEach((t) => {
        console.log(`   - ${t.name} (${t.slug})`);
      });
      console.log("\n💡 These templates need supportedSections defined to work in Funeral Builder");
    }
  } catch (error) {
    console.error("❌ Error checking templates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTemplates();
