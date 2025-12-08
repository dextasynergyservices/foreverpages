"use client";

import React, { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Palette, Type, Layout, Eye, RotateCcw } from "lucide-react";

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
    fontFamily: "Inter" | "Serif" | "Poppins" | "Open Sans";
    headingSize: "small" | "medium" | "large";
    bodySize: "small" | "medium" | "large";
  };
  layout: {
    spacing: "compact" | "comfortable" | "spacious";
    borderRadius: "none" | "subtle" | "moderate" | "rounded";
    containerWidth: "narrow" | "standard" | "wide";
  };
}

interface TemplateCustomizerProps {
  initialDesign?: DesignTokens;
  onDesignChange: (design: DesignTokens) => void;
  onPreviewToggle?: (showPreview: boolean) => void;
  showPreviewButton?: boolean;
}

const defaultDesignTokens: DesignTokens = {
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

export const TemplateCustomizer: React.FC<TemplateCustomizerProps> = ({
  initialDesign = defaultDesignTokens,
  onDesignChange,
  onPreviewToggle,
  showPreviewButton = true,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [design, setDesign] = useState<DesignTokens>(initialDesign);
  const [showPreview, setShowPreview] = useState(false);

  const isDark = theme === "dark";
  const bgClass = isDark ? "bg-gray-900" : "bg-white";
  const textClass = isDark ? "text-white" : "text-gray-900";
  const borderClass = isDark ? "border-gray-700" : "border-gray-200";
  const mutedBgClass = isDark ? "bg-gray-800" : "bg-gray-50";

  const handleDesignChange = (updates: Partial<DesignTokens>) => {
    const newDesign = {
      ...design,
      ...updates,
      colors: { ...design.colors, ...(updates.colors || {}) },
      fonts: { ...design.fonts, ...(updates.fonts || {}) },
      layout: { ...design.layout, ...(updates.layout || {}) },
    };
    setDesign(newDesign);
    onDesignChange(newDesign);
  };

  const resetDesign = () => {
    setDesign(defaultDesignTokens);
    onDesignChange(defaultDesignTokens);
  };

  const fontFamilyMap = {
    Inter: "font-sans",
    Serif: "font-serif",
    Poppins: "font-poppins",
    "Open Sans": "font-open-sans",
  };

  const spacingMap = {
    compact: "4",
    comfortable: "6",
    spacious: "8",
  };

  const borderRadiusMap = {
    none: "0",
    subtle: "4",
    moderate: "8",
    rounded: "16",
  };

  const containerWidthMap = {
    narrow: "max-w-2xl",
    standard: "max-w-4xl",
    wide: "max-w-6xl",
  };

  return (
    <div className="space-y-6">
      <Card className={bgClass}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {t("dashboard.pageBuilder.customizer.title", {}, "Customize Design")}
              </CardTitle>
              <CardDescription>
                {t(
                  "dashboard.pageBuilder.customizer.description",
                  {},
                  "Personalize colors, fonts, and layout for your memorial"
                )}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={resetDesign} className={`${borderClass}`}>
              <RotateCcw className="w-4 h-4 mr-2" />
              {t("dashboard.pageBuilder.customizer.reset", {}, "Reset")}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="colors" className="w-full">
            <TabsList className={`grid w-full grid-cols-3 ${mutedBgClass}`}>
              <TabsTrigger value="colors" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {t("dashboard.pageBuilder.customizer.colors", {}, "Colors")}
                </span>
              </TabsTrigger>
              <TabsTrigger value="fonts" className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {t("dashboard.pageBuilder.customizer.fonts", {}, "Fonts")}
                </span>
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {t("dashboard.pageBuilder.customizer.layout", {}, "Layout")}
                </span>
              </TabsTrigger>
            </TabsList>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Primary Color */}
                <div className="space-y-2">
                  <Label>
                    {t("dashboard.pageBuilder.customizer.primaryColor", {}, "Primary Color")}
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={design.colors.primary}
                      onChange={(e) =>
                        handleDesignChange({
                          colors: { ...design.colors, primary: e.target.value },
                        })
                      }
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <span className={`text-sm font-mono ${textClass}`}>
                      {design.colors.primary}
                    </span>
                  </div>
                </div>

                {/* Secondary Color */}
                <div className="space-y-2">
                  <Label>
                    {t("dashboard.pageBuilder.customizer.secondaryColor", {}, "Secondary Color")}
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={design.colors.secondary}
                      onChange={(e) =>
                        handleDesignChange({
                          colors: { ...design.colors, secondary: e.target.value },
                        })
                      }
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <span className={`text-sm font-mono ${textClass}`}>
                      {design.colors.secondary}
                    </span>
                  </div>
                </div>

                {/* Accent Color */}
                <div className="space-y-2">
                  <Label>
                    {t("dashboard.pageBuilder.customizer.accentColor", {}, "Accent Color")}
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={design.colors.accent}
                      onChange={(e) =>
                        handleDesignChange({
                          colors: { ...design.colors, accent: e.target.value },
                        })
                      }
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <span className={`text-sm font-mono ${textClass}`}>{design.colors.accent}</span>
                  </div>
                </div>

                {/* Header Background */}
                <div className="space-y-2">
                  <Label>
                    {t("dashboard.pageBuilder.customizer.headerBg", {}, "Header Background")}
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={design.colors.headerBg}
                      onChange={(e) =>
                        handleDesignChange({
                          colors: { ...design.colors, headerBg: e.target.value },
                        })
                      }
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <span className={`text-sm font-mono ${textClass}`}>
                      {design.colors.headerBg}
                    </span>
                  </div>
                </div>

                {/* Header Text */}
                <div className="space-y-2">
                  <Label>
                    {t("dashboard.pageBuilder.customizer.headerText", {}, "Header Text")}
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={design.colors.headerText}
                      onChange={(e) =>
                        handleDesignChange({
                          colors: { ...design.colors, headerText: e.target.value },
                        })
                      }
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <span className={`text-sm font-mono ${textClass}`}>
                      {design.colors.headerText}
                    </span>
                  </div>
                </div>

                {/* Body Background */}
                <div className="space-y-2">
                  <Label>
                    {t("dashboard.pageBuilder.customizer.bodyBg", {}, "Body Background")}
                  </Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={design.colors.bodyBg}
                      onChange={(e) =>
                        handleDesignChange({
                          colors: { ...design.colors, bodyBg: e.target.value },
                        })
                      }
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <span className={`text-sm font-mono ${textClass}`}>{design.colors.bodyBg}</span>
                  </div>
                </div>

                {/* Body Text */}
                <div className="space-y-2">
                  <Label>{t("dashboard.pageBuilder.customizer.bodyText", {}, "Body Text")}</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={design.colors.bodyText}
                      onChange={(e) =>
                        handleDesignChange({
                          colors: { ...design.colors, bodyText: e.target.value },
                        })
                      }
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <span className={`text-sm font-mono ${textClass}`}>
                      {design.colors.bodyText}
                    </span>
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div className={`p-4 rounded-lg border ${borderClass} ${mutedBgClass}`}>
                <p className={`text-sm font-semibold mb-3 ${textClass}`}>
                  {t("dashboard.pageBuilder.customizer.colorPreview", {}, "Preview")}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(design.colors).map(([name, color]) => (
                    <div key={name} className="flex flex-col items-center">
                      <div
                        className="w-12 h-12 rounded border-2 border-gray-300"
                        style={{ backgroundColor: color }}
                      />
                      <span className={`text-xs mt-1 ${textClass}`}>{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Fonts Tab */}
            <TabsContent value="fonts" className="space-y-4 mt-4">
              {/* Font Family */}
              <div className="space-y-2">
                <Label>{t("dashboard.pageBuilder.customizer.fontFamily", {}, "Font Family")}</Label>
                <Select
                  value={design.fonts.fontFamily}
                  onValueChange={(value) =>
                    handleDesignChange({
                      fonts: {
                        ...design.fonts,
                        fontFamily: value as "Inter" | "Serif" | "Poppins" | "Open Sans",
                      },
                    })
                  }
                >
                  <SelectTrigger className={bgClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter (Sans Serif)</SelectItem>
                    <SelectItem value="Serif">Serif (Traditional)</SelectItem>
                    <SelectItem value="Poppins">Poppins (Modern)</SelectItem>
                    <SelectItem value="Open Sans">Open Sans (Clean)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Heading Size */}
              <div className="space-y-2">
                <Label>
                  {t("dashboard.pageBuilder.customizer.headingSize", {}, "Heading Size")}
                </Label>
                <Select
                  value={design.fonts.headingSize}
                  onValueChange={(value) =>
                    handleDesignChange({
                      fonts: {
                        ...design.fonts,
                        headingSize: value as "small" | "medium" | "large",
                      },
                    })
                  }
                >
                  <SelectTrigger className={bgClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (32px)</SelectItem>
                    <SelectItem value="medium">Medium (40px)</SelectItem>
                    <SelectItem value="large">Large (48px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Body Font Size */}
              <div className="space-y-2">
                <Label>
                  {t("dashboard.pageBuilder.customizer.bodyFontSize", {}, "Body Font Size")}
                </Label>
                <Select
                  value={design.fonts.bodySize}
                  onValueChange={(value) =>
                    handleDesignChange({
                      fonts: {
                        ...design.fonts,
                        bodySize: value as "small" | "medium" | "large",
                      },
                    })
                  }
                >
                  <SelectTrigger className={bgClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (14px)</SelectItem>
                    <SelectItem value="medium">Medium (16px)</SelectItem>
                    <SelectItem value="large">Large (18px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Font Preview */}
              <div className={`p-4 rounded-lg border ${borderClass} ${mutedBgClass}`}>
                <p className={`text-sm font-semibold mb-3 ${textClass}`}>
                  {t("dashboard.pageBuilder.customizer.fontPreview", {}, "Preview")}
                </p>
                <div
                  className={`space-y-2 ${fontFamilyMap[design.fonts.fontFamily]}`}
                  style={{
                    fontFamily:
                      design.fonts.fontFamily === "Serif"
                        ? "Georgia, serif"
                        : design.fonts.fontFamily === "Poppins"
                          ? "Poppins, sans-serif"
                          : design.fonts.fontFamily === "Open Sans"
                            ? "'Open Sans', sans-serif"
                            : "Inter, sans-serif",
                  }}
                >
                  <p
                    style={{
                      fontSize:
                        design.fonts.headingSize === "small"
                          ? "32px"
                          : design.fonts.headingSize === "medium"
                            ? "40px"
                            : "48px",
                    }}
                    className={`font-bold ${textClass}`}
                  >
                    {t("dashboard.pageBuilder.customizer.headingExample", {}, "Heading Example")}
                  </p>
                  <p
                    style={{
                      fontSize:
                        design.fonts.bodySize === "small"
                          ? "14px"
                          : design.fonts.bodySize === "medium"
                            ? "16px"
                            : "18px",
                    }}
                    className={textClass}
                  >
                    {t(
                      "dashboard.pageBuilder.customizer.bodyExample",
                      {},
                      "This is body text that shows how your memorial page will look with the selected font settings."
                    )}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-4 mt-4">
              {/* Spacing */}
              <div className="space-y-2">
                <Label>{t("dashboard.pageBuilder.customizer.spacing", {}, "Spacing")}</Label>
                <Select
                  value={design.layout.spacing}
                  onValueChange={(value) =>
                    handleDesignChange({
                      layout: {
                        ...design.layout,
                        spacing: value as "compact" | "comfortable" | "spacious",
                      },
                    })
                  }
                >
                  <SelectTrigger className={bgClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact (More dense)</SelectItem>
                    <SelectItem value="comfortable">Comfortable (Balanced)</SelectItem>
                    <SelectItem value="spacious">Spacious (Airy)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Border Radius */}
              <div className="space-y-2">
                <Label>
                  {t("dashboard.pageBuilder.customizer.borderRadius", {}, "Border Radius")}
                </Label>
                <Select
                  value={design.layout.borderRadius}
                  onValueChange={(value) =>
                    handleDesignChange({
                      layout: {
                        ...design.layout,
                        borderRadius: value as "none" | "subtle" | "moderate" | "rounded",
                      },
                    })
                  }
                >
                  <SelectTrigger className={bgClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Sharp edges)</SelectItem>
                    <SelectItem value="subtle">Subtle (4px)</SelectItem>
                    <SelectItem value="moderate">Moderate (8px)</SelectItem>
                    <SelectItem value="rounded">Rounded (16px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Container Width */}
              <div className="space-y-2">
                <Label>
                  {t("dashboard.pageBuilder.customizer.containerWidth", {}, "Content Width")}
                </Label>
                <Select
                  value={design.layout.containerWidth}
                  onValueChange={(value) =>
                    handleDesignChange({
                      layout: {
                        ...design.layout,
                        containerWidth: value as "narrow" | "standard" | "wide",
                      },
                    })
                  }
                >
                  <SelectTrigger className={bgClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="narrow">Narrow (672px max)</SelectItem>
                    <SelectItem value="standard">Standard (896px max)</SelectItem>
                    <SelectItem value="wide">Wide (1152px max)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Layout Preview */}
              <div className={`p-4 rounded-lg border ${borderClass} ${mutedBgClass}`}>
                <p className={`text-sm font-semibold mb-3 ${textClass}`}>
                  {t("dashboard.pageBuilder.customizer.layoutPreview", {}, "Layout Preview")}
                </p>
                <div className={`${containerWidthMap[design.layout.containerWidth]} mx-auto`}>
                  <div
                    className={`space-y-${spacingMap[design.layout.spacing]} p-4 rounded-${borderRadiusMap[design.layout.borderRadius]} border-2 ${borderClass}`}
                    style={{ borderRadius: `${borderRadiusMap[design.layout.borderRadius]}px` }}
                  >
                    <div
                      className={`h-8 rounded-${borderRadiusMap[design.layout.borderRadius]} bg-gray-300`}
                      style={{ borderRadius: `${borderRadiusMap[design.layout.borderRadius]}px` }}
                    />
                    <div
                      className={`h-20 rounded-${borderRadiusMap[design.layout.borderRadius]} bg-gray-200`}
                      style={{ borderRadius: `${borderRadiusMap[design.layout.borderRadius]}px` }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        className={`h-16 rounded-${borderRadiusMap[design.layout.borderRadius]} bg-gray-200`}
                        style={{ borderRadius: `${borderRadiusMap[design.layout.borderRadius]}px` }}
                      />
                      <div
                        className={`h-16 rounded-${borderRadiusMap[design.layout.borderRadius]} bg-gray-200`}
                        style={{ borderRadius: `${borderRadiusMap[design.layout.borderRadius]}px` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {showPreviewButton && (
        <div className="flex justify-center">
          <Button
            onClick={() => {
              setShowPreview(!showPreview);
              onPreviewToggle?.(!showPreview);
            }}
            className="gap-2"
            size="lg"
          >
            <Eye className="w-5 h-5" />
            {showPreview
              ? t("dashboard.pageBuilder.customizer.hidePreview", {}, "Hide Preview")
              : t("dashboard.pageBuilder.customizer.showPreview", {}, "Show Live Preview")}
          </Button>
        </div>
      )}
    </div>
  );
};
