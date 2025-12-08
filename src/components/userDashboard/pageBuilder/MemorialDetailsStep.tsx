"use client";

import React, { useState } from "react";
import { DynamicSectionRenderer, SectionData } from "./DynamicSectionRenderer";
import { TemplateRenderer } from "./TemplateRenderer";
import { DesignTokens } from "./TemplateCustomizer";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { Eye, EyeOff } from "lucide-react";

interface MemorialDetailsStepProps {
  supportedSections: string[];
  sectionData: SectionData;
  onSectionDataChange: (section: string, data: unknown) => void;
  onOpenMediaPicker?: () => void;
  designTokens?: DesignTokens;
  memorialData?: {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    deathDate?: string;
    birthYear?: number;
    deathYear?: number;
    biography?: string;
  };
}

export const MemorialDetailsStep: React.FC<MemorialDetailsStepProps> = ({
  supportedSections,
  sectionData,
  onSectionDataChange,
  onOpenMediaPicker,
  designTokens,
  memorialData,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [showPreview, setShowPreview] = useState(true);

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

  const activeDesign = designTokens || defaultDesign;

  return (
    <div className="space-y-4">
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className={`text-2xl font-bold mb-1 ${textClass}`}>
            {t("dashboard.pageBuilder.details.title", {}, "Memorial Details")}
          </h2>
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            {t(
              "dashboard.pageBuilder.details.description",
              {},
              "Add content to each section. Your changes appear instantly in the preview."
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
              {t("dashboard.pageBuilder.hidePreview", {}, "Hide Preview")}
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              {t("dashboard.pageBuilder.showPreview", {}, "Show Preview")}
            </>
          )}
        </button>
      </div>

      {/* Split-screen layout */}
      <div className={`grid ${showPreview ? "lg:grid-cols-2" : "grid-cols-1"} gap-6`}>
        {/* Editor Panel */}
        <div className="space-y-4">
          <DynamicSectionRenderer
            supportedSections={supportedSections as never[]}
            sectionData={sectionData}
            onSectionDataChange={onSectionDataChange}
            onOpenMediaPicker={onOpenMediaPicker}
          />
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
                  {t("dashboard.pageBuilder.livePreview", {}, "Live Preview")}
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
