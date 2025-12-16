import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking templates data...\n");

    const templates = await prisma.template.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        processingStatus: true,
        artifactAssets: true,
        previewImage: true,
        componentPath: true,
      },
    });

    console.log(`Found ${templates.length} templates:\n`);

    templates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name} (${template.id})`);
      console.log(`   Slug: ${template.slug}`);
      console.log(`   Status: ${template.processingStatus || "null"}`);
      console.log(`   Component Path: ${template.componentPath || "null"}`);
      console.log(`   Preview Image: ${template.previewImage ? "✓" : "✗"}`);

      const artifacts = template.artifactAssets as Record<string, string> | null;
      if (artifacts && Object.keys(artifacts).length > 0) {
        console.log(`   Artifact Assets: ${Object.keys(artifacts).length} files`);
        console.log(`   Has index.html: ${artifacts["index.html"] ? "✓" : "✗"}`);
        if (artifacts["index.html"]) {
          console.log(`   index.html URL: ${artifacts["index.html"]}`);
        }
      } else {
        console.log(`   Artifact Assets: None`);
      }
      console.log("");
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
