// Phase 2: Seed script for light-template
// Run: tsx scripts/seed-light-template.ts

import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

async function seedLightTemplate() {
  console.log("🎨 Seeding light-template...\n");

  const template = await prisma.template.upsert({
    where: { slug: "light-template" },
    update: {
      name: "Light Template",
      description: "A spiritual memorial template with elegant animations and serene design",
      version: "1.0.0",
      previewImage: "/templates/light-template/preview.png",
      thumbnailImage: "/templates/light-template/thumbnail.png",
      componentPath: "templates/light-template",
      configPath: "templates/light-template/config",
      isNextJsTemplate: true,
      previewMode: "NATIVE",
      processingStatus: "PUBLISHED",
      layoutType: "FLEXIBLE",
      isActive: true,
      isFeatured: true,
      displayOrder: 1,
      categoryId: "cmi7almfc000218uk1exap59n",
      supportedSections: [
        "HERO",
        "VIRTUAL_CANDLES",
        "TIMELINE",
        "GALLERY",
        "TRIBUTES",
        "CONDOLENCES",
      ],
      defaultConfig: {
        colors: {
          primary: "#D4AF37",
          background: "#0A0A0A",
        },
        fonts: {
          heading: "Cinzel",
          body: "Lora",
          script: "Great Vibes",
        },
      },
      manifest: {
        name: "Light Template",
        slug: "light-template",
        version: "1.0.0",
        description: "A spiritual memorial template with elegant animations and serene design",
        author: "ForeverPages",
        sections: [
          { id: "hero", name: "Hero Section", component: "HeroSection", required: true },
          {
            id: "candles",
            name: "Candle Sanctuary",
            component: "CandleSanctuary",
            required: false,
          },
          { id: "journey", name: "Life Journey", component: "LifeJourney", required: false },
          { id: "gallery", name: "Photo Gallery", component: "PhotoGallery", required: false },
          { id: "tributes", name: "Tributes", component: "TributeSection", required: false },
          { id: "condolence", name: "Condolence Book", component: "Condolence", required: false },
        ],
        features: [
          "Animated starfield background",
          "Video hero section",
          "Interactive candle lighting",
          "Photo gallery with lightbox",
          "Timeline of life events",
          "Tribute messages",
          "Condolence book",
        ],
        customization: {
          colors: { primary: "#D4AF37", background: "#0A0A0A" },
          fonts: { heading: "Cinzel", body: "Lora", script: "Great Vibes" },
        },
        preview: {
          image: "/templates/light-template/preview.png",
          thumbnail: "/templates/light-template/thumbnail.png",
        },
      },
      plans: {
        set: [
          { id: "cmhoundli00001800wdj57x7f" },
          { id: "cmhoundxg00011800vu0x9gfd" },
          { id: "cmhoune7t00021800shvt074m" },
        ],
      },
      sections: {
        deleteMany: {},
        create: [
          {
            type: "HERO",
            name: "Hero Section",
            description: "Main hero section with video background and memorial details",
            componentPath: "components/HeroSection",
            layout: "DEFAULT",
            isCollapsible: false,
            isHideable: false,
            defaultVisible: true,
            order: 1,
          },
          {
            type: "VIRTUAL_CANDLES",
            name: "Candle Sanctuary",
            description: "Interactive candle lighting memorial",
            componentPath: "components/CandleSanctuary",
            layout: "DEFAULT",
            isCollapsible: false,
            isHideable: true,
            defaultVisible: true,
            order: 2,
          },
          {
            type: "TIMELINE",
            name: "Life Journey",
            description: "Timeline of life events and milestones",
            componentPath: "components/LifeJourney",
            layout: "DEFAULT",
            isCollapsible: false,
            isHideable: true,
            defaultVisible: true,
            order: 3,
          },
          {
            type: "GALLERY",
            name: "Photo Gallery",
            description: "Photo gallery with lightbox view",
            componentPath: "components/PhotoGallery",
            layout: "DEFAULT",
            isCollapsible: false,
            isHideable: true,
            defaultVisible: true,
            order: 4,
          },
          {
            type: "TRIBUTES",
            name: "Tributes",
            description: "Tribute messages from loved ones",
            componentPath: "components/Tribute",
            layout: "DEFAULT",
            isCollapsible: false,
            isHideable: true,
            defaultVisible: true,
            order: 5,
          },
          {
            type: "CONDOLENCES",
            name: "Condolence Book",
            description: "Digital condolence book for messages",
            componentPath: "components/Condolence",
            layout: "DEFAULT",
            isCollapsible: false,
            isHideable: true,
            defaultVisible: true,
            order: 6,
          },
        ],
      },
    },
    create: {
      name: "Light Template",
      slug: "light-template",
      description: "A spiritual memorial template with elegant animations and serene design",
      version: "1.0.0",
      previewImage: "/templates/light-template/preview.png",
      thumbnailImage: "/templates/light-template/thumbnail.png",
      componentPath: "templates/light-template",
      configPath: "templates/light-template/config",
      isNextJsTemplate: true,
      previewMode: "NATIVE",
      processingStatus: "PUBLISHED",
      layoutType: "FLEXIBLE",
      isActive: true,
      isFeatured: true,
      displayOrder: 1,
      categoryId: "cmi7almfc000218uk1exap59n",
      supportedSections: [
        "HERO",
        "VIRTUAL_CANDLES",
        "TIMELINE",
        "GALLERY",
        "TRIBUTES",
        "CONDOLENCES",
      ],
      defaultConfig: {
        colors: {
          primary: "#D4AF37",
          background: "#0A0A0A",
        },
        fonts: {
          heading: "Cinzel",
          body: "Lora",
          script: "Great Vibes",
        },
      },
      manifest: {
        name: "Light Template",
        slug: "light-template",
        version: "1.0.0",
        description: "A spiritual memorial template with elegant animations and serene design",
        author: "ForeverPages",
        sections: [
          { id: "hero", name: "Hero Section", component: "HeroSection", required: true },
          {
            id: "candles",
            name: "Candle Sanctuary",
            component: "CandleSanctuary",
            required: false,
          },
          { id: "journey", name: "Life Journey", component: "LifeJourney", required: false },
          { id: "gallery", name: "Photo Gallery", component: "PhotoGallery", required: false },
          { id: "tributes", name: "Tributes", component: "TributeSection", required: false },
          { id: "condolence", name: "Condolence Book", component: "Condolence", required: false },
        ],
        features: [
          "Animated starfield background",
          "Video hero section",
          "Interactive candle lighting",
          "Photo gallery with lightbox",
          "Timeline of life events",
          "Tribute messages",
          "Condolence book",
        ],
        customization: {
          colors: { primary: "#D4AF37", background: "#0A0A0A" },
          fonts: { heading: "Cinzel", body: "Lora", script: "Great Vibes" },
        },
        preview: {
          image: "/templates/light-template/preview.png",
          thumbnail: "/templates/light-template/thumbnail.png",
        },
      },
      plans: {
        connect: [
          { id: "cmhoundli00001800wdj57x7f" },
          { id: "cmhoundxg00011800vu0x9gfd" },
          { id: "cmhoune7t00021800shvt074m" },
        ],
      },
      sections: {
        create: [
          {
            type: "HERO",
            name: "Hero Section",
            description: "Main hero section with video background and memorial details",
            componentPath: "components/HeroSection",
            layout: "DEFAULT",
            isCollapsible: false,
            isHideable: false,
            defaultVisible: true,
            order: 1,
          },
          {
            type: "VIRTUAL_CANDLES",
            name: "Candle Sanctuary",
            description: "Interactive candle lighting memorial",
            componentPath: "components/CandleSanctuary",
            layout: "DEFAULT",
            isCollapsible: false,
            isHideable: true,
            defaultVisible: true,
            order: 2,
          },
          {
            type: "TIMELINE",
            name: "Life Journey",
            description: "Timeline of life events and milestones",
            componentPath: "components/LifeJourney",
            layout: "DEFAULT",
            isCollapsible: false,
            isHideable: true,
            defaultVisible: true,
            order: 3,
          },
          {
            type: "GALLERY",
            name: "Photo Gallery",
            description: "Photo gallery with lightbox view",
            componentPath: "components/PhotoGallery",
            layout: "DEFAULT",
            isCollapsible: false,
            isHideable: true,
            defaultVisible: true,
            order: 4,
          },
          {
            type: "TRIBUTES",
            name: "Tributes",
            description: "Tribute messages from loved ones",
            componentPath: "components/Tribute",
            layout: "DEFAULT",
            isCollapsible: false,
            isHideable: true,
            defaultVisible: true,
            order: 5,
          },
          {
            type: "CONDOLENCES",
            name: "Condolence Book",
            description: "Digital condolence book for messages",
            componentPath: "components/Condolence",
            layout: "DEFAULT",
            isCollapsible: false,
            isHideable: true,
            defaultVisible: true,
            order: 6,
          },
        ],
      },
    },
  });

  console.log("✅ Template seeded:", template.name);
  console.log("   Preview URL: /templates/light-template?preview=true\n");
}

seedLightTemplate()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
