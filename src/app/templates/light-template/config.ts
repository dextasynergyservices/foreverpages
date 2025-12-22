export interface MemorialData {
  name: string;
  birthYear: string;
  deathYear: string;
  tagline: string;
  portraitUrl: string;
  videoUrl?: string;
  config?: TemplateConfig;
  ownerId?: string;
}

import { DesignTokens } from "@/components/userDashboard/pageBuilder/TemplateCustomizer";

export interface TemplateConfig {
  name: string;
  slug: string;
  version: string;
  description: string;

  sections: Array<{
    id: string;
    name: string;
    component: string;
    required: boolean;
  }>;

  // Default design tokens (can be overridden by user customization)
  defaultDesign?: DesignTokens;

  customization: {
    colors: {
      primary: { type: "color"; default: string; label: string };
      secondary: { type: "color"; default: string; label: string };
      accent: { type: "color"; default: string; label: string };
    };
    fonts: {
      heading: { type: "select"; default: string; label: string; options: string[] };
      body: { type: "select"; default: string; label: string; options: string[] };
      script: { type: "select"; default: string; label: string; options: string[] };
    };
    layout: {
      headerStyle: { type: "select"; default: string; label: string; options: string[] };
      spacing: { type: "select"; default: string; label: string; options: string[] };
    };
  };

  preview: {
    image: string;
    thumbnail: string;
  };
}

export const templateConfig: TemplateConfig = {
  name: "Light Template",
  slug: "light-template",
  version: "1.0.0",
  description: "A spiritual memorial template with elegant animations and serene design",

  sections: [
    { id: "hero", name: "Hero Section", component: "HeroSection", required: true },
    { id: "candles", name: "Candle Sanctuary", component: "CandleSanctuary", required: false },
    { id: "journey", name: "Life Journey", component: "LifeJourney", required: false },
    { id: "gallery", name: "Photo Gallery", component: "PhotoGallery", required: false },
    { id: "tributes", name: "Tributes", component: "TributeSection", required: false },
    { id: "condolence", name: "Condolence Book", component: "Condolence", required: false },
  ],

  // Default design tokens (overridden by user customization)
  defaultDesign: {
    colors: {
      primary: "#D4AF37",
      secondary: "#64748b",
      accent: "#f59e0b",
      headerBg: "#1f2937",
      headerText: "#ffffff",
      bodyBg: "#fafafa",
      bodyText: "#1f2937",
    },
    fonts: {
      fontFamily: "Inter",
      headingSize: "large" as const,
      bodySize: "medium" as const,
    },
    layout: {
      spacing: "comfortable" as const,
      borderRadius: "subtle" as const,
      containerWidth: "standard" as const,
    },
  },

  customization: {
    colors: {
      primary: {
        type: "color",
        default: "#D4AF37",
        label: "Primary Color",
      },
      secondary: {
        type: "color",
        default: "#64748b",
        label: "Secondary Color",
      },
      accent: {
        type: "color",
        default: "#f59e0b",
        label: "Accent Color",
      },
    },
    fonts: {
      heading: {
        type: "select",
        default: "Cinzel",
        label: "Heading Font",
        options: ["Cinzel", "Playfair Display", "Cormorant Garamond"],
      },
      body: {
        type: "select",
        default: "Lora",
        label: "Body Font",
        options: ["Lora", "Cardo", "Crimson Text"],
      },
      script: {
        type: "select",
        default: "Great Vibes",
        label: "Script Font",
        options: ["Great Vibes", "Dancing Script", "Parisienne"],
      },
    },
    layout: {
      headerStyle: {
        type: "select",
        default: "classic",
        label: "Header Style",
        options: ["classic", "modern", "minimal"],
      },
      spacing: {
        type: "select",
        default: "comfortable",
        label: "Spacing",
        options: ["compact", "comfortable", "spacious"],
      },
    },
  },

  preview: {
    image: "/templates/light-template/preview.png",
    thumbnail: "/templates/light-template/thumbnail.png",
  },
};

// Helper function to get default preview data
export function getDefaultPreviewData(): MemorialData {
  return {
    name: "John Michael Anderson",
    birthYear: "1952",
    deathYear: "2024",
    tagline: "A life of faith, love, and service to others",
    portraitUrl: "https://res.cloudinary.com/dt7ozsctz/image/upload/v1764166230/thomas1_yuknpv.png",
    videoUrl: "https://res.cloudinary.com/dt7ozsctz/video/upload/v1764165650/bgVideo_kxr78w.mp4",
    config: templateConfig,
  };
}

// Helper function to fetch memorial data from database
export async function fetchMemorialData(memorialId: string): Promise<MemorialData> {
  try {
    // Import prisma client
    const { prisma } = await import("@/lib/prisma");

    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      include: {
        userTemplate: {
          include: {
            baseTemplate: true,
          },
        },
      },
    });

    if (!memorial) {
      console.log("Memorial not found, returning default data");
      return getDefaultPreviewData();
    }

    // Transform database data to template format
    const memorialData: MemorialData = {
      name: `${memorial.firstName} ${memorial.lastName}`.trim(),
      birthYear: memorial.birthDate
        ? new Date(memorial.birthDate).getFullYear().toString()
        : "1950",
      deathYear: memorial.deathDate
        ? new Date(memorial.deathDate).getFullYear().toString()
        : "2023",
      tagline: memorial.biography?.substring(0, 100) || "A life well lived",
      portraitUrl: memorial.profileImageUrl || "/placeholder-portrait.jpg",
      videoUrl: memorial.videoUrl || undefined,
      ownerId: memorial.ownerId,
      config: memorial.userTemplate?.customization
        ? {
            ...templateConfig,
            defaultDesign: memorial.userTemplate.customization as any,
          }
        : templateConfig,
    };

    return memorialData;
  } catch (error) {
    console.error("Error fetching memorial data:", error);
    return getDefaultPreviewData();
  }
}
