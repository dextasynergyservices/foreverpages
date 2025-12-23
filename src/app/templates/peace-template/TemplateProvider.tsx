"use client";

import React, { ReactNode, useEffect, createContext, useContext } from "react";
import { DesignTokens } from "./types";
import { defaultDesign } from "./config";

interface Memorial {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  deathDate: Date | null;
  biography?: string | null;
  profileImage?: string | null;
  [key: string]: any; // Allow other Memorial model fields
}

interface TemplateContextValue {
  sectionsData?: Record<string, unknown>;
  memorial?: Memorial | null;
  memorialOwner?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    accountDetails?: any;
  } | null;
}

const TemplateContext = createContext<TemplateContextValue | null>(null);

export function useTemplate() {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error("useTemplate must be used within TemplateProvider");
  }
  return context;
}

interface TemplateProviderProps {
  children: ReactNode;
  customization?: DesignTokens | Record<string, unknown> | null;
  sectionsData?: Record<string, unknown>;
  memorial?: Memorial | null;
  memorialOwner?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    accountDetails?: any;
  } | null;
}

export const TemplateProvider: React.FC<TemplateProviderProps> = ({
  children,
  customization,
  sectionsData,
  memorial,
  memorialOwner,
}) => {
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
      // Set CSS variables that match the template expectations
      root.style.setProperty("--celebration-terracotta", design.colors.primary);
      root.style.setProperty("--celebration-peach", design.colors.secondary);
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

  return (
    <TemplateContext.Provider
      value={{
        sectionsData,
        memorial,
        memorialOwner,
      }}
    >
      {children}
    </TemplateContext.Provider>
  );
};
