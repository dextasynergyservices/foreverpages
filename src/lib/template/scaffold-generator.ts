/**
 * Template Scaffold Generator
 * Auto-generates all necessary files for a new Next.js template upload
 */

import {
  TemplateScaffoldConfig,
  GeneratedFile,
  TemplateScaffoldResult,
  TemplateSection,
  DesignTokens,
  DEFAULT_DESIGN_TOKENS,
} from "./types";

// Re-export types for external use
export type {
  GeneratedFile,
  TemplateScaffoldConfig,
  TemplateScaffoldResult,
  TemplateSection,
  DesignTokens,
};
export { DEFAULT_DESIGN_TOKENS };

/**
 * Main entry point: generate all scaffold files for a template
 */
export function generateTemplateScaffold(config: TemplateScaffoldConfig): TemplateScaffoldResult {
  const files: GeneratedFile[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // Template structure files (in src/app/templates/{slug}/)
    files.push({
      path: `src/app/templates/${config.slug}/TemplateProvider.tsx`,
      content: generateTemplateProvider(config),
      description: "Template context provider with design tokens",
    });

    files.push({
      path: `src/app/templates/${config.slug}/config.ts`,
      content: generateConfigFile(config),
      description: "Template configuration and types",
    });

    files.push({
      path: `src/app/templates/${config.slug}/types.ts`,
      content: generateTypesFile(config),
      description: "TypeScript type definitions",
    });

    files.push({
      path: `src/app/templates/${config.slug}/styles.css`,
      content: generateStylesFile(config),
      description: "Template-specific CSS styles",
    });

    files.push({
      path: `src/app/templates/${config.slug}/styles.css.d.ts`,
      content: generateStylesDeclaration(config),
      description: "CSS module type declarations",
    });

    files.push({
      path: `src/app/templates/${config.slug}/manifest.json`,
      content: generateManifest(config),
      description: "Template manifest file",
    });

    files.push({
      path: `src/app/templates/${config.slug}/page.tsx`,
      content: generatePageComponent(config),
      description: "Next.js page component",
    });

    files.push({
      path: `src/app/templates/${config.slug}/layout.tsx`,
      content: generateLayoutComponent(config),
      description: "Next.js layout component",
    });

    // 🔥 CRITICAL: Memorial system integration bridge
    files.push({
      path: `src/components/templates/components/${config.slug}/MemorialTemplate.tsx`,
      content: generateMemorialTemplate(config),
      description: "Bridge component connecting template to memorial system",
    });

    // 🔥 NEW: Auto-generate SupportModal
    files.push({
      path: `src/app/templates/${config.slug}/components/SupportModal.tsx`,
      content: generateSupportModal(config),
      description: "Support/donation modal component",
    });

    // Generate placeholder components for each section
    for (const section of config.sections) {
      if (!section.component) continue;

      files.push({
        path: `src/app/templates/${config.slug}/components/${section.component}.tsx`,
        content: generatePlaceholderComponent(config, section),
        description: `${section.name} section component`,
      });
    }

    return {
      success: true,
      files,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    return {
      success: false,
      files,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

/**
 * Generate TemplateProvider.tsx - Context provider with design tokens
 */
export function generateTemplateProvider(config: TemplateScaffoldConfig): string {
  const tokens = config.designTokens || DEFAULT_DESIGN_TOKENS;

  return `"use client";

import React, { createContext, useContext, ReactNode } from "react";
import type { MemorialData, TemplateConfig } from "./config";
import { DesignTokens } from "@/components/userDashboard/pageBuilder/TemplateCustomizer";

interface TemplateContextValue {
  isPreview: boolean;
  memorialId?: string;
  memorial: MemorialData;
  config: TemplateConfig;
  sectionsData?: Record<string, unknown>;
  memorialOwnerId?: string;
  memorialOwnerName?: string;
  memorialOwnerAccountDetails?: Array<{
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

const TemplateContext = createContext<TemplateContextValue | null>(null);

export function useTemplate() {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error("useTemplate must be used within TemplateProvider");
  }
  return context;
}

export function TemplateProvider({
  isPreview,
  memorialId,
  memorial,
  config,
  customization,
  sectionsData,
  children,
}: {
  isPreview: boolean;
  memorialId?: string;
  memorial: MemorialData;
  config: TemplateConfig;
  customization?: Partial<DesignTokens>;
  sectionsData?: Record<string, unknown>;
  children: ReactNode;
}) {
  // Extract memorial owner information
  const memorialOwnerId = memorial.ownerId || "";
  const memorialOwnerName = memorial.name || "Memorial Owner";
  const memorialOwnerAccountDetails = memorial.ownerAccountDetails || [];

  // Merge default config with user customization
  const defaultDesign = config.defaultDesign || {
    colors: {
      primary: "${tokens.colors.primary}",
      secondary: "${tokens.colors.secondary}",
      accent: "${tokens.colors.accent}",
      headerBg: "${tokens.colors.headerBg}",
      headerText: "${tokens.colors.headerText}",
      bodyBg: "${tokens.colors.bodyBg}",
      bodyText: "${tokens.colors.bodyText}",
    },
    fonts: {
      fontFamily: "${tokens.fonts.fontFamily}" as const,
      headingSize: "${tokens.fonts.headingSize}" as const,
      bodySize: "${tokens.fonts.bodySize}" as const,
    },
    layout: {
      spacing: "${tokens.layout.spacing}" as const,
      borderRadius: "${tokens.layout.borderRadius}" as const,
      containerWidth: "${tokens.layout.containerWidth}" as const,
    },
  };

  const finalDesign: DesignTokens = {
    colors: {
      ...defaultDesign.colors,
      ...(customization?.colors || {}),
    },
    fonts: {
      ...defaultDesign.fonts,
      ...(customization?.fonts || {}),
    },
    layout: {
      ...defaultDesign.layout,
      ...(customization?.layout || {}),
    },
  };

  return (
    <TemplateContext.Provider
      value={{
        isPreview,
        memorialId,
        memorial,
        config,
        sectionsData,
        memorialOwnerId,
        memorialOwnerName,
        memorialOwnerAccountDetails,
      }}
    >
      <div
        className="template-root"
        style={
          {
            // Color CSS Variables
            "--primary": finalDesign.colors.primary,
            "--secondary": finalDesign.colors.secondary,
            "--accent": finalDesign.colors.accent,
            "--header-bg": finalDesign.colors.headerBg,
            "--header-text": finalDesign.colors.headerText,
            "--body-bg": finalDesign.colors.bodyBg,
            "--body-text": finalDesign.colors.bodyText,

            // Additional CSS variables
            "--background": finalDesign.colors.bodyBg,
            "--foreground": finalDesign.colors.bodyText,
            "--border": finalDesign.colors.secondary + "40",
            "--gold-glow": finalDesign.colors.accent,

            // Font CSS Variables
            "--font-family": finalDesign.fonts.fontFamily,
            "--heading-size":
              finalDesign.fonts.headingSize === "small"
                ? "1.5rem"
                : finalDesign.fonts.headingSize === "medium"
                  ? "2rem"
                  : "2.5rem",
            "--body-size":
              finalDesign.fonts.bodySize === "small"
                ? "0.875rem"
                : finalDesign.fonts.bodySize === "medium"
                  ? "1rem"
                  : "1.125rem",

            // Layout CSS Variables
            "--section-spacing": finalDesign.layout.spacing,
            "--border-radius": finalDesign.layout.borderRadius,
            "--content-width":
              finalDesign.layout.containerWidth === "narrow"
                ? "800px"
                : finalDesign.layout.containerWidth === "standard"
                  ? "1000px"
                  : "1200px",
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </TemplateContext.Provider>
  );
}
`;
}

/**
 * Generate config.ts - Template configuration file
 */
export function generateConfigFile(config: TemplateScaffoldConfig): string {
  const tokens = config.designTokens || DEFAULT_DESIGN_TOKENS;
  const sectionsJson = JSON.stringify(
    config.sections.map((s) => ({
      id: s.id,
      name: s.name,
      component: s.component,
      required: s.required,
    })),
    null,
    4
  ).replace(/"/g, '"');

  return `import { DesignTokens } from "@/components/userDashboard/pageBuilder/TemplateCustomizer";

export interface MemorialData {
  name: string;
  birthYear: string;
  deathYear: string;
  tagline: string;
  portraitUrl: string;
  videoUrl?: string;
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
      spacing: { type: "select"; default: string; label: string; options: string[] };
    };
  };

  preview: {
    image: string;
    thumbnail: string;
  };
}

export const templateConfig: TemplateConfig = {
  name: "${config.name}",
  slug: "${config.slug}",
  version: "${config.version}",
  description: "${config.description}",

  sections: ${sectionsJson},

  defaultDesign: {
    colors: {
      primary: "${tokens.colors.primary}",
      secondary: "${tokens.colors.secondary}",
      accent: "${tokens.colors.accent}",
      headerBg: "${tokens.colors.headerBg}",
      headerText: "${tokens.colors.headerText}",
      bodyBg: "${tokens.colors.bodyBg}",
      bodyText: "${tokens.colors.bodyText}",
    },
    fonts: {
      fontFamily: "${tokens.fonts.fontFamily}",
      headingSize: "${tokens.fonts.headingSize}" as const,
      bodySize: "${tokens.fonts.bodySize}" as const,
    },
    layout: {
      spacing: "${tokens.layout.spacing}" as const,
      borderRadius: "${tokens.layout.borderRadius}" as const,
      containerWidth: "${tokens.layout.containerWidth}" as const,
    },
  },

  customization: {
    colors: {
      primary: {
        type: "color",
        default: "${tokens.colors.primary}",
        label: "Primary Color",
      },
      secondary: {
        type: "color",
        default: "${tokens.colors.secondary}",
        label: "Secondary Color",
      },
      accent: {
        type: "color",
        default: "${tokens.colors.accent}",
        label: "Accent Color",
      },
    },
    fonts: {
      heading: {
        type: "select",
        default: "${tokens.fonts.fontFamily}",
        label: "Heading Font",
        options: ["Inter", "Playfair Display", "Cinzel", "Cormorant Garamond"],
      },
      body: {
        type: "select",
        default: "${tokens.fonts.fontFamily}",
        label: "Body Font",
        options: ["Inter", "Lora", "Cardo", "Crimson Text"],
      },
    },
    layout: {
      spacing: {
        type: "select",
        default: "${tokens.layout.spacing}",
        label: "Spacing",
        options: ["compact", "comfortable", "spacious"],
      },
    },
  },

  preview: {
    image: "/templates/${config.slug}/preview.png",
    thumbnail: "/templates/${config.slug}/thumbnail.png",
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
    config: templateConfig,
  };
}
`;
}

/**
 * Generate types.ts - Template-specific types
 */
export function generateTypesFile(config: TemplateScaffoldConfig): string {
  return `/**
 * ${config.name} - Type Definitions
 * Auto-generated types for the ${config.slug} template
 */

export interface SectionProps {
  className?: string;
  isPreview?: boolean;
}

export interface MemorialInfo {
  name: string;
  birthYear: string;
  deathYear: string;
  tagline: string;
  portraitUrl: string;
  videoUrl?: string;
}

export interface SupportRecord {
  id: string;
  amount: number;
  currency: string;
  donorName?: string;
  donorEmail?: string;
  message?: string;
  createdAt: Date;
}

export interface AccountDetail {
  id: string;
  type: "BANK" | "MOBILE_MONEY" | "PAYPAL" | "STRIPE";
  accountName: string;
  accountNumber: string;
  bankName?: string;
  routingNumber?: string;
  currency: string;
  isDefault?: boolean;
  description?: string;
}
`;
}

/**
 * Generate styles.css - Template-specific styles
 */
export function generateStylesFile(config: TemplateScaffoldConfig): string {
  const tokens = config.designTokens || DEFAULT_DESIGN_TOKENS;

  return `/**
 * ${config.name} - Styles
 * Auto-generated CSS for the ${config.slug} template
 */

/* Template Root Styles */
.template-root {
  min-height: 100vh;
  background-color: var(--body-bg, ${tokens.colors.bodyBg});
  color: var(--body-text, ${tokens.colors.bodyText});
  font-family: var(--font-family, ${tokens.fonts.fontFamily}), system-ui, sans-serif;
}

/* Section Styles */
.template-section {
  padding: var(--section-spacing, 4rem) 0;
}

.template-section-header {
  text-align: center;
  margin-bottom: 2rem;
}

.template-section-title {
  font-size: var(--heading-size, 2rem);
  font-weight: 700;
  color: var(--primary, ${tokens.colors.primary});
  margin-bottom: 0.5rem;
}

.template-section-subtitle {
  font-size: var(--body-size, 1rem);
  color: var(--secondary, ${tokens.colors.secondary});
}

/* Container */
.template-container {
  max-width: var(--content-width, 1000px);
  margin: 0 auto;
  padding: 0 1rem;
}

/* Button Styles */
.template-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  font-size: var(--body-size, 1rem);
  font-weight: 500;
  border-radius: var(--border-radius, 0.375rem);
  background-color: var(--accent, ${tokens.colors.accent});
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.template-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.template-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Card Styles */
.template-card {
  background: white;
  border-radius: var(--border-radius, 0.375rem);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

/* Responsive */
@media (max-width: 768px) {
  .template-section {
    padding: 2rem 0;
  }

  .template-section-title {
    font-size: 1.5rem;
  }
}
`;
}

/**
 * Generate styles.css.d.ts - CSS module declarations
 */
export function generateStylesDeclaration(config: TemplateScaffoldConfig): string {
  return `declare module "./${config.slug}-styles.css" {
  const styles: Record<string, string>;
  export default styles;
}
`;
}

/**
 * Generate manifest.json - Template metadata
 */
export function generateManifest(config: TemplateScaffoldConfig): string {
  const manifest = {
    name: config.name,
    slug: config.slug,
    version: config.version,
    description: config.description,
    author: config.author,
    sections: config.sections.map((s) => ({
      id: s.id,
      name: s.name,
      component: s.component,
      required: s.required,
    })),
    features: config.features || [],
    customization: {
      colors: {
        primary: config.designTokens?.colors.primary || DEFAULT_DESIGN_TOKENS.colors.primary,
        secondary: config.designTokens?.colors.secondary || DEFAULT_DESIGN_TOKENS.colors.secondary,
        accent: config.designTokens?.colors.accent || DEFAULT_DESIGN_TOKENS.colors.accent,
      },
      fonts: {
        heading: config.designTokens?.fonts.fontFamily || DEFAULT_DESIGN_TOKENS.fonts.fontFamily,
        body: config.designTokens?.fonts.fontFamily || DEFAULT_DESIGN_TOKENS.fonts.fontFamily,
      },
    },
    preview: config.preview || {
      image: `/templates/${config.slug}/preview.png`,
      thumbnail: `/templates/${config.slug}/thumbnail.png`,
    },
  };

  return JSON.stringify(manifest, null, 2);
}

/**
 * Generate page.tsx - Next.js page component
 */
export function generatePageComponent(config: TemplateScaffoldConfig): string {
  const componentImports = config.sections
    .filter((s) => s.component)
    .map((s) => `import ${s.component} from "./components/${s.component}";`)
    .join("\n");

  const componentJsx = config.sections
    .filter((s) => s.component)
    .map((s) => `        <${s.component} />`)
    .join("\n");

  return `import { TemplateProvider } from "./TemplateProvider";
import { templateConfig, getDefaultPreviewData } from "./config";
import "./styles.css";
${componentImports}

export default function ${toPascalCase(config.slug)}Page() {
  const memorial = getDefaultPreviewData();

  return (
    <TemplateProvider
      isPreview={true}
      memorial={memorial}
      config={templateConfig}
    >
      <main className="template-root min-h-screen">
${componentJsx}
      </main>
    </TemplateProvider>
  );
}
`;
}

/**
 * Generate layout.tsx - Next.js layout
 */
export function generateLayoutComponent(config: TemplateScaffoldConfig): string {
  return `import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "${config.name}",
  description: "${config.description}",
};

export default function ${toPascalCase(config.slug)}Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
`;
}

/**
 * 🔥 CRITICAL: Generate MemorialTemplate.tsx - Bridge component
 */
export function generateMemorialTemplate(config: TemplateScaffoldConfig): string {
  const componentImports = config.sections
    .filter((s) => s.component)
    .map(
      (s) =>
        `import ${s.component} from "@/app/templates/${config.slug}/components/${s.component}";`
    )
    .join("\n");

  const componentJsx = config.sections
    .filter((s) => s.component)
    .map((s) => `            <${s.component} />`)
    .join("\n");

  const pascalName = toPascalCase(config.slug);

  return `"use client";

import React, { useState } from "react";
import type { Template, UserTemplate, Memorial } from "@/generated/prisma";
import { TemplateProvider } from "@/app/templates/${config.slug}/TemplateProvider";
import { templateConfig } from "@/app/templates/${config.slug}/config";
import { DesignTokens } from "@/components/userDashboard/pageBuilder/TemplateCustomizer";
import SupportModal from "@/app/templates/${config.slug}/components/SupportModal";
${componentImports}

interface MemorialTemplateProps {
  memorial: Memorial;
  userTemplate: UserTemplate & {
    baseTemplate: Template;
  };
  config?: Record<string, unknown>;
}

// Convert Prisma Memorial to template's expected MemorialData format
function convertMemorialData(memorial: Memorial, userTemplate: UserTemplate) {
  // Safely convert customization to DesignTokens
  let customDesignTokens: DesignTokens | undefined;
  try {
    if (userTemplate.customization && typeof userTemplate.customization === "object") {
      customDesignTokens = userTemplate.customization as unknown as DesignTokens;
    }
  } catch (error) {
    console.warn("Failed to parse user customization:", error);
  }

  // Safely convert sections to sections data
  let sectionsData = {};
  try {
    if (userTemplate.sections && typeof userTemplate.sections === "object") {
      sectionsData = userTemplate.sections as Record<string, unknown>;
    }
  } catch (error) {
    console.warn("Failed to parse user sections:", error);
  }

  return {
    name: \`\${memorial.firstName} \${memorial.lastName}\`,
    birthYear: memorial.birthDate
      ? new Date(memorial.birthDate).getFullYear().toString()
      : "Unknown",
    deathYear: memorial.deathDate
      ? new Date(memorial.deathDate).getFullYear().toString()
      : "Unknown",
    tagline: "Forever in our hearts",
    portraitUrl: memorial.profilePhoto || "",
    videoUrl: undefined,
    ownerId: memorial.ownerId,
    sectionsData,
    config: {
      ...templateConfig,
      defaultDesign: customDesignTokens || templateConfig.defaultDesign,
    },
  };
}

export const ${pascalName}MemorialTemplate: React.FC<MemorialTemplateProps> = ({
  memorial,
  userTemplate,
}) => {
  const memorialData = convertMemorialData(memorial, userTemplate);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  // Safely convert customization to DesignTokens
  let customization: DesignTokens;
  const defaultTokens: DesignTokens = {
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
      borderRadius: "moderate",
      containerWidth: "standard",
    },
  };

  try {
    if (userTemplate.customization && typeof userTemplate.customization === "object") {
      customization = userTemplate.customization as unknown as DesignTokens;
    } else {
      customization = templateConfig.defaultDesign || defaultTokens;
    }
  } catch (error) {
    console.warn("Failed to parse user customization:", error);
    customization = templateConfig.defaultDesign || defaultTokens;
  }

  return (
    <TemplateProvider
      isPreview={true}
      memorialId={memorial.id}
      memorial={memorialData}
      config={templateConfig}
      customization={customization}
      sectionsData={memorialData.sectionsData}
    >
      <div className="relative min-h-screen overflow-x-hidden">
        <style jsx global>{\`
          .template-preview {
            scroll-behavior: smooth;
            contain: layout style;
          }
        \`}</style>
        <main className="relative z-10">
${componentJsx}
        </main>

        {/* Support Modal Integration */}
        <SupportModal
          isOpen={supportModalOpen}
          onClose={() => setSupportModalOpen(false)}
          memorialOwner={{
            id: memorial.ownerId,
            email: "",
          }}
          memorialId={memorial.id}
          onSuccess={() => {
            // Optionally refresh support data
            console.log("Support submitted successfully");
          }}
        />
      </div>
    </TemplateProvider>
  );
};

// Export function to open support modal (can be called from template components)
export const useSupportModal = () => {
  // This hook can be used by template components to trigger the support modal
  // Implementation depends on how the template wants to expose this functionality
};

export default ${pascalName}MemorialTemplate;
`;
}

/**
 * 🔥 NEW: Generate SupportModal.tsx - Support/Donation modal
 */
export function generateSupportModal(config: TemplateScaffoldConfig): string {
  const templateName = config.name;
  const templateSlug = config.slug;

  return `"use client";

/**
 * SupportModal for ${templateName}
 * Auto-generated support/donation modal for the ${templateSlug} template
 */

import React, { useState, useEffect, useCallback } from "react";
import { X, Copy, Check, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import { Button } from "@/components/ui/button";
import { CountryCodeSelect } from "@/components/ui/country-code-select";

interface AccountDetail {
  id: string;
  type: "BANK" | "MOBILE_MONEY" | "PAYPAL" | "STRIPE" | "bank" | "mobile_money" | "paypal" | "stripe";
  accountName: string;
  accountNumber: string;
  bankName?: string;
  routingNumber?: string;
  provider?: string;
  currency: string;
  instructions?: string;
  isDefault?: boolean;
  description?: string;
}

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  memorialOwner?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    accountDetails?: AccountDetail[];
  } | null;
  memorialId?: string;
  onSuccess?: () => void;
  presetAmounts?: number[];
}

const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  memorialOwner,
  memorialId,
  onSuccess,
  presetAmounts,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<AccountDetail | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [accountDetails, setAccountDetails] = useState<AccountDetail[]>([]);
  const [donationMessage, setDonationMessage] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorCountryCode, setDonorCountryCode] = useState("+234");
  const [donorPhoneValid, setDonorPhoneValid] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  // Currency-specific amounts
  const getCurrencyAmounts = (currency: string) => {
    if (presetAmounts && presetAmounts.length > 0) {
      return presetAmounts;
    }
    switch (currency) {
      case "NGN":
        return [5000, 20000, 25000, 50000, 100000, 250000];
      case "USD":
      case "EUR":
      case "GBP":
      default:
        return [10, 25, 50, 100, 250, 500];
    }
  };

  const predefinedAmounts = getCurrencyAmounts(selectedCurrency);
  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  ];

  const loadAccountDetails = useCallback(async () => {
    const effectiveOwnerId = memorialOwner?.id;
    if (!effectiveOwnerId) return;

    setIsLoading(true);
    try {
      const response = await fetch(\`/api/public/owner/\${effectiveOwnerId}/account-details\`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.accountDetails) {
          setAccountDetails(data.accountDetails);
          const defaultAccount = data.accountDetails.find((acc: AccountDetail) => acc.isDefault);
          setSelectedAccount(defaultAccount || data.accountDetails[0] || null);
        }
      }
    } catch (error) {
      console.error("Failed to load account details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [memorialOwner?.id]);

  useEffect(() => {
    if (isOpen) {
      loadAccountDetails();
    }
  }, [isOpen, loadAccountDetails]);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleSubmitSupport = async () => {
    if (!selectedAccount || (!selectedAmount && !customAmount)) return;

    if (!donorName.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!donorEmail.trim()) {
      alert("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(donorEmail.trim())) {
      alert("Please enter a valid email address.");
      return;
    }

    if (donorPhone.trim() && !donorPhoneValid) {
      alert("Please enter a valid phone number.");
      return;
    }

    setIsLoading(true);
    try {
      const amount = selectedAmount || parseFloat(customAmount);

      const response = await fetch("/api/memorial/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memorialOwnerId: memorialOwner?.id,
          memorialId,
          amount,
          currency: selectedCurrency,
          accountType: selectedAccount.type,
          donorName: donorName.trim(),
          donorEmail: donorEmail.trim(),
          donorPhone: donorPhone.trim() ? \`\${donorCountryCode}\${donorPhone.trim()}\` : undefined,
          message: donationMessage,
        }),
      });

      const responseData = await response.json();
      if (responseData.success) {
        // Reset form
        setSelectedAmount(null);
        setCustomAmount("");
        setDonationMessage("");
        setDonorName("");
        setDonorEmail("");
        setDonorPhone("");
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error("Support submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAccountTypeDisplay = (type: string) => {
    const upperType = type.toUpperCase();
    switch (upperType) {
      case "BANK":
        return "Bank Account";
      case "MOBILE_MONEY":
        return "Mobile Money";
      case "PAYPAL":
        return "PayPal";
      case "STRIPE":
        return "Credit Card";
      default:
        return type;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-2">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Support Memorial</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Honor their memory with a donation</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full p-1">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Donor Name */}
          <div className="space-y-3">
            <Label>Your Name <span className="text-red-500">*</span></Label>
            <Input
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* Donor Email */}
          <div className="space-y-3">
            <Label>Email Address <span className="text-red-500">*</span></Label>
            <Input
              type="email"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              placeholder="Enter your email address"
              required
            />
          </div>

          {/* Donor Phone */}
          <div className="space-y-3">
            <Label>Phone Number (Optional)</Label>
            <div className="flex gap-2">
              <CountryCodeSelect
                value={donorCountryCode}
                onValueChange={setDonorCountryCode}
              />
              <Input
                type="tel"
                value={donorPhone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\\d]/g, "");
                  setDonorPhone(value);
                  setDonorPhoneValid(value.length === 0 || value.length >= 7);
                }}
                placeholder="Enter phone number"
                className="flex-1"
              />
            </div>
          </div>

          {/* Currency Selection */}
          <div className="space-y-3">
            <Label>Currency</Label>
            <div className="grid grid-cols-2 gap-2">
              {currencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => {
                    setSelectedCurrency(currency.code);
                    setSelectedAmount(null);
                    setCustomAmount("");
                  }}
                  className={\`rounded-lg border p-3 text-left transition-all \${
                    selectedCurrency === currency.code
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                  }\`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{currency.symbol}</span>
                    <div>
                      <div className="text-sm font-medium">{currency.code}</div>
                      <div className="text-xs opacity-80">{currency.name}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Selection */}
          <div className="space-y-3">
            <Label>Amount</Label>
            <div className="grid grid-cols-3 gap-2">
              {predefinedAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount("");
                  }}
                  className={\`rounded-lg border py-2 text-sm font-medium transition-all \${
                    selectedAmount === amount
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                  }\`}
                >
                  {currencies.find((c) => c.code === selectedCurrency)?.symbol}
                  {amount.toLocaleString()}
                </button>
              ))}
            </div>
            <Input
              type="number"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              placeholder="Custom amount"
              min="1"
            />
          </div>

          {/* Memorial Message */}
          <div className="space-y-3">
            <Label>Memorial Message (Optional)</Label>
            <Textarea
              value={donationMessage}
              onChange={(e) => setDonationMessage(e.target.value)}
              placeholder="Share a memory or message of support..."
              rows={3}
            />
          </div>

          {/* Payment Method Selection */}
          {accountDetails.length > 0 && (
            <div className="space-y-3">
              <Label>Payment Method</Label>
              <div className="space-y-2">
                {accountDetails.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccount(account)}
                    className={\`w-full rounded-lg border p-3 text-left transition-all \${
                      selectedAccount?.id === account.id
                        ? "border-primary bg-primary/10"
                        : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                    }\`}
                  >
                    <div className="font-medium">{getAccountTypeDisplay(account.type)}</div>
                    <div className="text-sm opacity-80">
                      {account.accountName} • {account.currency}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payment Details */}
          {selectedAccount && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h3 className="mb-3 font-semibold">Payment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="opacity-80">Account Name:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{selectedAccount.accountName}</span>
                    <button onClick={() => copyToClipboard(selectedAccount.accountName, "name")}>
                      {copiedField === "name" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 opacity-60" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-80">Account Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{selectedAccount.accountNumber}</span>
                    <button onClick={() => copyToClipboard(selectedAccount.accountNumber, "number")}>
                      {copiedField === "number" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 opacity-60" />}
                    </button>
                  </div>
                </div>
                {selectedAccount.bankName && (
                  <div className="flex items-center justify-between">
                    <span className="opacity-80">Bank Name:</span>
                    <span className="font-mono">{selectedAccount.bankName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmitSupport}
            disabled={isLoading || !selectedAccount || (!selectedAmount && !customAmount)}
            className="w-full"
          >
            {isLoading ? "Processing..." : "Complete Donation"}
          </Button>

          <p className="text-xs text-center opacity-60">
            Your donation will be sent directly to the memorial owner's account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupportModal;
`;
}

/**
 * Generate placeholder component for sections
 */
export function generatePlaceholderComponent(
  config: TemplateScaffoldConfig,
  section: TemplateSection
): string {
  return `"use client";

import React from "react";
import { useTemplate } from "../TemplateProvider";

interface ${section.component}Props {
  className?: string;
}

const ${section.component}: React.FC<${section.component}Props> = ({ className = "" }) => {
  const { memorial, isPreview } = useTemplate();

  return (
    <section id="${section.id}" className={\`template-section \${className}\`}>
      <div className="template-container">
        <div className="template-section-header">
          <h2 className="template-section-title">${section.name}</h2>
          <p className="template-section-subtitle">
            {isPreview ? "Preview Mode" : "Live Mode"}
          </p>
        </div>
        <div className="template-card">
          <p>
            This is the ${section.name} section for {memorial.name}.
            ${section.description || "Add your content here."}
          </p>
        </div>
      </div>
    </section>
  );
};

export default ${section.component};
`;
}

// Helper function to convert slug to PascalCase
function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}
