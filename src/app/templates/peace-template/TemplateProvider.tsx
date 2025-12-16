"use client";

import React, { ReactNode, useEffect } from "react";
import { DesignTokens } from "./types";
import { defaultDesign } from "./config";

interface TemplateProviderProps {
  children: ReactNode;
  customization?: DesignTokens | Record<string, unknown> | null;
}

export const TemplateProvider: React.FC<TemplateProviderProps> = ({ children, customization }) => {
  useEffect(() => {
    // Merge default design with user customization
    const design = {
      ...defaultDesign,
      ...(customization as DesignTokens),
    };

    // Apply CSS custom properties
    const root = document.documentElement;

    // Colors
    if (design.colors) {
      root.style.setProperty("--template-primary", design.colors.primary);
      root.style.setProperty("--template-secondary", design.colors.secondary);
      root.style.setProperty("--template-accent", design.colors.accent);
      root.style.setProperty("--template-background", design.colors.background);
      root.style.setProperty("--template-text", design.colors.text);
      root.style.setProperty("--template-muted", design.colors.muted);
    }

    // Fonts
    if (design.fonts) {
      root.style.setProperty("--template-font-heading", design.fonts.heading);
      root.style.setProperty("--template-font-body", design.fonts.body);
      root.style.setProperty("--template-font-accent", design.fonts.accent || design.fonts.heading);
    }

    // Layout
    if (design.layout) {
      root.style.setProperty("--template-max-width", design.layout.maxWidth);
      root.style.setProperty("--template-hero-height", design.layout.heroHeight);
      root.style.setProperty("--template-section-spacing", design.layout.sectionSpacing);
    }
  }, [customization]);

  return <>{children}</>;
};
