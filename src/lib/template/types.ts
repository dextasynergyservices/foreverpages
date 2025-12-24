/**
 * Template Scaffold Generation Types
 * Core type definitions for the auto-generation system
 */

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
    fontFamily: string;
    headingSize: "small" | "medium" | "large";
    bodySize: "small" | "medium" | "large";
  };
  layout: {
    spacing: "compact" | "comfortable" | "spacious";
    borderRadius: "none" | "subtle" | "moderate" | "rounded";
    containerWidth: "narrow" | "standard" | "wide";
  };
}

export interface TemplateSection {
  id: string;
  name: string;
  component: string;
  required: boolean;
  description?: string;
  order?: number;
}

export interface TemplateScaffoldConfig {
  name: string;
  slug: string;
  description: string;
  author: string;
  version: string;
  designTokens: DesignTokens;
  sections: TemplateSection[];
  features?: string[];
  customization?: {
    colors?: Record<string, { type: string; default: string; label: string }>;
    fonts?: Record<string, { type: string; default: string; label: string; options?: string[] }>;
    layout?: Record<string, { type: string; default: string; label: string; options?: string[] }>;
  };
  preview?: {
    image: string;
    thumbnail: string;
  };
}

export interface GeneratedFile {
  path: string;
  content: string;
  description: string;
}

export interface TemplateScaffoldResult {
  success: boolean;
  files: GeneratedFile[];
  errors?: string[];
  warnings?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  detectedSections: TemplateSection[];
  suggestedConfig?: Partial<TemplateScaffoldConfig>;
}

// Template manifest structure from manifest.json
export interface TemplateManifestJson {
  name: string;
  slug: string;
  version: string;
  description?: string;
  author?: string;
  sections?: TemplateSection[];
  supportedSections?: string[];
  features?: string[];
  customization?: Record<string, unknown>;
  preview?: {
    image: string;
    thumbnail: string;
  };
}

// Section type mapping for database enum values
export const SECTION_TYPE_MAP: Record<string, string> = {
  hero: "HERO",
  candles: "VIRTUAL_CANDLES",
  journey: "TIMELINE",
  timeline: "TIMELINE",
  gallery: "GALLERY",
  tributes: "TRIBUTES",
  condolence: "CONDOLENCES",
  condolences: "CONDOLENCES",
  biography: "BIOGRAPHY",
  family: "FAMILY_TREE",
  video: "VIDEO_GALLERY",
  donations: "DONATIONS",
};

// Default design tokens for new templates
export const DEFAULT_DESIGN_TOKENS: DesignTokens = {
  colors: {
    primary: "#1f2937",
    secondary: "#6366f1",
    accent: "#ec4899",
    headerBg: "#111827",
    headerText: "#ffffff",
    bodyBg: "#f9fafb",
    bodyText: "#1f2937",
  },
  fonts: {
    fontFamily: "Inter",
    headingSize: "large",
    bodySize: "medium",
  },
  layout: {
    spacing: "comfortable",
    borderRadius: "subtle",
    containerWidth: "standard",
  },
};
