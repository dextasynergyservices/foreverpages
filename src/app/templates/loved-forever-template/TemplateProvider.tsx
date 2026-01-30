"use client";

import React, { createContext, useContext, ReactNode, useState } from "react";
import type { MemorialData, TemplateConfig, DesignTokens } from "./config";

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
  // Modal management
  isBlessingModalOpen: boolean;
  openBlessingModal: () => void;
  closeBlessingModal: () => void;
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
  onOpenBlessingModal,
  onCloseBlessingModal,
}: {
  isPreview: boolean;
  memorialId?: string;
  memorial: MemorialData;
  config: TemplateConfig;
  customization?: Partial<DesignTokens>;
  sectionsData?: Record<string, unknown>;
  children: ReactNode;
  onOpenBlessingModal?: () => void;
  onCloseBlessingModal?: () => void;
}) {
  // Modal state - use external handlers if provided, otherwise internal state
  const [internalBlessingModalOpen, setInternalBlessingModalOpen] = useState(false);
  const isBlessingModalOpen = internalBlessingModalOpen;
  const openBlessingModal = onOpenBlessingModal || (() => setInternalBlessingModalOpen(true));
  const closeBlessingModal = onCloseBlessingModal || (() => setInternalBlessingModalOpen(false));

  // Extract memorial owner information
  const memorialOwnerId = memorial.ownerId || "";
  const memorialOwnerName = memorial.name || "Memorial Owner";
  const memorialOwnerAccountDetails = memorial.ownerAccountDetails || [];

  // Merge default config with user customization
  const defaultDesign = config.defaultDesign || {
    colors: {
      primary: "#9F7AEA",
      secondary: "#4299E1",
      accent: "#F6E05E",
      headerBg: "#1A1A2E",
      headerText: "#ffffff",
      bodyBg: "#FAF5FF",
      bodyText: "#2D3748",
    },
    fonts: {
      fontFamily: "Nunito" as const,
      headingSize: "large" as const,
      bodySize: "medium" as const,
    },
    layout: {
      spacing: "comfortable" as const,
      borderRadius: "moderate" as const,
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
        isBlessingModalOpen,
        openBlessingModal,
        closeBlessingModal,
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

            // Additional CSS variables used by the template
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
