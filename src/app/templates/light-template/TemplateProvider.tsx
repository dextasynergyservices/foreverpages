"use client";

import React, { createContext, useContext, ReactNode } from "react";
import type { MemorialData, TemplateConfig } from "./config";
import { DesignTokens } from "@/components/userDashboard/pageBuilder/TemplateCustomizer";

interface TemplateContextValue {
  isPreview: boolean;
  memorialId?: string;
  memorial: MemorialData;
  config: TemplateConfig;
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
  children,
}: {
  isPreview: boolean;
  memorialId?: string;
  memorial: MemorialData;
  config: TemplateConfig;
  customization?: Partial<DesignTokens>;
  children: ReactNode;
}) {
  // Merge default config with user customization
  const defaultDesign = config.defaultDesign || {
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
      fontFamily: "Inter" as const,
      headingSize: "large" as const,
      bodySize: "medium" as const,
    },
    layout: {
      spacing: "comfortable" as const,
      borderRadius: "subtle" as const,
      containerWidth: "standard" as const,
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
    <TemplateContext.Provider value={{ isPreview, memorialId, memorial, config }}>
      <div
        className="template-root"
        style={
          {
            // Color CSS Variables
            "--primary-color": finalDesign.colors.primary,
            "--secondary-color": finalDesign.colors.secondary,
            "--accent-color": finalDesign.colors.accent,
            "--header-bg": finalDesign.colors.headerBg,
            "--header-text": finalDesign.colors.headerText,
            "--body-bg": finalDesign.colors.bodyBg,
            "--body-text": finalDesign.colors.bodyText,

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
