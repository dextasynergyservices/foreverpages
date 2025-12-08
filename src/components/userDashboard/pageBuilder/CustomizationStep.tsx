"use client";

import React, { useState, useEffect } from "react";
import { TemplateCustomizer, DesignTokens } from "./TemplateCustomizer";
import { TemplateRenderer } from "./TemplateRenderer";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { useDesignTokens } from "@/hooks/useDesignTokens";
import { SectionData } from "./DynamicSectionRenderer";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

interface CustomizationStepProps {
  selectedTemplate: string;
  templateId?: string;
  onCustomizationChange: (design: DesignTokens) => void;
  initialDesign?: DesignTokens;
  memorialData?: {
    firstName?: string;
    lastName?: string;
    birthYear?: number;
    deathYear?: number;
    biography?: string;
  };
  sectionData?: SectionData;
  supportedSections?: string[];
}

export const CustomizationStep: React.FC<CustomizationStepProps> = ({
  onCustomizationChange,
  templateId,
  initialDesign,
  memorialData,
  sectionData = {},
  supportedSections = [],
}) => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const { saveDesignTokens, loadDesignTokens } = useDesignTokens(templateId || null);
  const [showPreview, setShowPreview] = useState(true); // Default to showing preview
  const [isSaving, setIsSaving] = useState(false);
  const [currentDesign, setCurrentDesign] = useState<DesignTokens | undefined>(initialDesign);

  // Load design tokens when component mounts and templateId is available
  useEffect(() => {
    if (templateId && !initialDesign) {
      loadDesignTokens()
        .then((tokens) => {
          if (tokens) {
            setCurrentDesign(tokens);
            onCustomizationChange(tokens);
          }
        })
        .catch((error) => {
          console.error("Error loading design tokens:", error);
        });
    } else if (initialDesign) {
      setCurrentDesign(initialDesign);
    }
  }, [templateId, initialDesign, loadDesignTokens, onCustomizationChange]);

  const handleDesignChange = async (design: DesignTokens) => {
    // Update local state for live preview
    setCurrentDesign(design);

    // Update the parent component
    onCustomizationChange(design);

    // Save to database if templateId is available
    if (templateId) {
      setIsSaving(true);
      const success = await saveDesignTokens(design);
      setIsSaving(false);

      if (success) {
        toast.success(t("dashboard.pageBuilder.customizer.saved", {}, "Design saved!"));
      } else {
        toast.error(
          t("dashboard.pageBuilder.customizer.saveFailed", {}, "Failed to save design tokens")
        );
      }
    }
  };

  const isDark = theme === "dark";
  const textClass = isDark ? "text-white" : "text-gray-900";

  // Default design tokens if none provided
  const defaultDesign: DesignTokens = {
    colors: {
      primary: "#1f2937",
      secondary: "#6366f1",
      accent: "#ec4899",
      headerBg: "#111827",
      headerText: "#ffffff",
      bodyBg: "#f9fafb",
      bodyText: "#1f2937",
    },
    fonts: { fontFamily: "Inter", headingSize: "large", bodySize: "medium" },
    layout: {
      spacing: "comfortable",
      borderRadius: "moderate",
      containerWidth: "standard",
    },
  };

  const activeDesign = currentDesign || initialDesign || defaultDesign;

  return (
    <div className="space-y-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className={`text-2xl font-bold mb-1 ${textClass}`}>
            {t("dashboard.pageBuilder.customizer.title", {}, "Customize Design")}
          </h2>
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            {t(
              "dashboard.pageBuilder.customizer.stepDescription",
              {},
              "Personalize colors, fonts, and layout. See changes in real-time."
            )}
          </p>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            showPreview
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : isDark
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-gray-100 text-gray-900 hover:bg-gray-200"
          }`}
        >
          {showPreview ? (
            <>
              <EyeOff className="w-4 h-4" />
              {t("dashboard.pageBuilder.customizer.hidePreview", {}, "Hide Preview")}
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              {t("dashboard.pageBuilder.customizer.showPreview", {}, "Show Preview")}
            </>
          )}
        </button>
      </div>

      {/* Split-screen layout */}
      <div className={`grid ${showPreview ? "lg:grid-cols-2" : "grid-cols-1"} gap-6`}>
        {/* Editor Panel */}
        <div className="space-y-4">
          <TemplateCustomizer
            initialDesign={activeDesign}
            onDesignChange={handleDesignChange}
            onPreviewToggle={() => {}}
            showPreviewButton={false}
          />

          {isSaving && (
            <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              {t("dashboard.pageBuilder.customizer.saving", {}, "Saving design...")}
            </div>
          )}
        </div>

        {/* Live Preview Panel */}
        {showPreview && (
          <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-8rem)] overflow-hidden">
            <div
              className={`border rounded-lg overflow-hidden ${
                isDark ? "border-white/10" : "border-gray-200"
              }`}
            >
              <div
                className={`px-4 py-2 border-b flex items-center justify-between ${
                  isDark
                    ? "bg-white/5 border-white/10 text-white/70"
                    : "bg-gray-50 border-gray-200 text-gray-600"
                }`}
              >
                <span className="text-sm font-medium">
                  {t("dashboard.pageBuilder.customizer.livePreview", {}, "Live Preview")}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                </div>
              </div>
              <div className="overflow-auto max-h-[calc(100vh-12rem)] bg-gray-100 dark:bg-gray-900">
                <div
                  className="scale-75 origin-top-left"
                  style={{ width: "133.33%", height: "133.33%" }}
                >
                  <TemplateRenderer
                    designTokens={activeDesign}
                    sectionData={sectionData}
                    memorialData={memorialData}
                    supportedSections={supportedSections}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
