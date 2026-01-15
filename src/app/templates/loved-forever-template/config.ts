// Design token types (local definition for standalone template)
export interface DesignTokens {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    headerBg: string;
    headerText: string;
    bodyBg: string;
    bodyText: string;
  };
  fonts: {
    fontFamily: "Nunito" | "Lora" | "Open Sans" | "Playfair Display";
    headingSize: "small" | "medium" | "large";
    bodySize: "small" | "medium" | "large";
  };
  layout: {
    spacing: "compact" | "comfortable" | "spacious";
    borderRadius: "none" | "subtle" | "moderate" | "rounded";
    containerWidth: "narrow" | "standard" | "wide";
  };
}

export interface MemorialData {
  name: string;
  birthYear: string;
  deathYear: string;
  tagline: string;
  portraitUrl: string;
  videoUrl?: string;
  biography?: string;
  config?: TemplateConfig;
  ownerId?: string;
  ownerAccountDetails?: Array<{
    id: string;
    type: string;
    accountName: string;
    accountNumber: string;
    bankName?: string;
    routingNumber?: string;
    currency: string;
    isDefault?: boolean;
    description?: string;
  }>;
}

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
  name: "Loved Forever",
  slug: "loved-forever-template",
  version: "1.0.0",
  description:
    "A spiritual memorial template with nature-inspired design, elegant lavender gradients, and warm golden accents",

  sections: [
    { id: "hero", name: "Hero Section", component: "HeroSection", required: true },
    { id: "biography", name: "Life Story", component: "LifeSection", required: false },
    { id: "family", name: "Family Tree", component: "FamilyTree", required: false },
    { id: "gallery", name: "Photo Gallery", component: "PhotoGallery", required: false },
    { id: "tributes", name: "Tributes", component: "PrayerWall", required: false },
    { id: "donations", name: "Support", component: "SupportSection", required: false },
    {
      id: "condolences",
      name: "Condolence Book",
      component: "CondolencesSection",
      required: false,
    },
  ],

  // Default design tokens (overridden by user customization)
  defaultDesign: {
    colors: {
      primary: "#9F7AEA", // Lavender purple
      secondary: "#4299E1", // Soft blue
      accent: "#F6E05E", // Golden amber
      headerBg: "#1A1A2E", // Deep purple-black
      headerText: "#FFFFFF",
      bodyBg: "#FAF5FF", // Light lavender
      bodyText: "#2D3748",
    },
    fonts: {
      fontFamily: "Nunito",
      headingSize: "large" as const,
      bodySize: "medium" as const,
    },
    layout: {
      spacing: "comfortable" as const,
      borderRadius: "moderate" as const,
      containerWidth: "standard" as const,
    },
  },

  customization: {
    colors: {
      primary: {
        type: "color",
        default: "#9F7AEA",
        label: "Primary Color",
      },
      secondary: {
        type: "color",
        default: "#4299E1",
        label: "Secondary Color",
      },
      accent: {
        type: "color",
        default: "#F6E05E",
        label: "Accent Color",
      },
    },
    fonts: {
      heading: {
        type: "select",
        default: "Playfair Display",
        label: "Heading Font",
        options: ["Playfair Display", "Cinzel", "Cormorant Garamond"],
      },
      body: {
        type: "select",
        default: "Nunito",
        label: "Body Font",
        options: ["Nunito", "Lora", "Open Sans"],
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
    image: "/templates/loved-forever-template/preview.png",
    thumbnail: "/templates/loved-forever-template/thumbnail.png",
  },
};

export function getDefaultPreviewData(): MemorialData {
  return {
    name: "Robert Nyesom",
    birthYear: "1940",
    deathYear: "2025",
    tagline: "Those we love don't go away, they walk beside us every day",
    portraitUrl: "https://res.cloudinary.com/dxoorukfj/image/upload/v1764851048/image1_blm2dv.png",
    videoUrl: "https://res.cloudinary.com/dxoorukfj/video/upload/v1764851059/video1_yusbe0.mp4",
    biography: `Robert Nyesom was a beacon of light in this world, touching countless lives with his kindness, wisdom, and unwavering faith. Born in Nigeria, he grew up with a deep love for family and community.

Throughout his life, Robert dedicated himself to serving others. His legacy lives on through his children and grandchildren, and the countless lives he touched along the way.

Robert is survived by his beloved wife and three children, and will forever be remembered for his warmth, generosity, and the love he showed to everyone he met. Though he has moved on to be with the Lord, his spirit continues to guide and inspire us all.`,
  };
}
