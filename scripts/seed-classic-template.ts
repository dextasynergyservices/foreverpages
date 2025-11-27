import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedClassicTemplate() {
  try {
    // Check if classic template already exists
    const existingTemplate = await prisma.template.findUnique({
      where: { slug: "classic" },
    });

    if (existingTemplate) {
      console.log("Classic template already exists");
      return;
    }

    // Create classic template
    const template = await prisma.template.create({
      data: {
        name: "Classic Memorial",
        slug: "classic",
        description:
          "A timeless and elegant memorial template with biography, gallery, and tribute sections.",
        componentPath: "classic/MemorialTemplate",
        previewImage: "/templates/classic/preview.jpg",
        thumbnailImage: "/templates/classic/thumbnail.jpg",
        layoutType: "FLEXIBLE",
        supportedSections: [
          "HERO",
          "BIOGRAPHY",
          "GALLERY",
          "TIMELINE",
          "FAMILY_TREE",
          "TRIBUTES",
          "CONDOLENCES",
          "GUESTBOOK",
        ],
        designTokens: {
          colors: {
            primary: "#1f2937",
            secondary: "#6b7280",
            accent: "#3b82f6",
          },
          fonts: {
            heading: "serif",
            body: "sans-serif",
          },
        },
        defaultConfig: {
          showNavigation: true,
          showHeader: true,
          sections: {
            hero: { visible: true },
            biography: { visible: true },
            gallery: { visible: true },
            timeline: { visible: true },
            familyTree: { visible: false },
            tributes: { visible: true },
          },
        },
        isActive: true,
        isFeatured: true,
        displayOrder: 1,
      },
    });

    console.log("Classic template created:", template.id);
  } catch (error) {
    console.error("Error seeding classic template:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedClassicTemplate();
