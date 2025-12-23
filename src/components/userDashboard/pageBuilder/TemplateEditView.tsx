"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateCustomizer, DesignTokens } from "./TemplateCustomizer";
import { TemplateRenderer } from "./TemplateRenderer";
import { DynamicSectionRenderer, SectionData, SectionType } from "./DynamicSectionRenderer";
import { SaveIndicator } from "./SaveIndicator";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { useUpdateUserTemplate } from "@/hooks/useUserTemplate";
import { useDebounce } from "@/hooks/useDebounce";
import { UserTemplate } from "@/hooks/useUserTemplate";

interface TemplateEditViewProps {
  selectedTemplate: string;
  selectedTemplateSlug?: string; // Add optional slug prop
  supportedSections: string[];
  sectionData: SectionData;
  onSectionDataChange: (section: string, data: unknown) => void;
  designTokens?: DesignTokens;
  onDesignTokensChange: (tokens: DesignTokens) => void;
  memorialData?: {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    deathDate?: string;
    birthYear?: number;
    deathYear?: number;
    biography?: string;
    profilePhoto?: string;
  };
  onMemorialDataChange?: (data: Partial<TemplateEditViewProps["memorialData"]>) => void;
  userTemplateId?: string;
  onOpenMediaPicker?: () => void;
  userTemplate?: UserTemplate; // Use the hook's UserTemplate type
}

type PreviewMode = "desktop" | "tablet" | "mobile";

export const TemplateEditView: React.FC<TemplateEditViewProps> = ({
  selectedTemplate,
  selectedTemplateSlug,
  supportedSections,
  sectionData,
  onSectionDataChange,
  designTokens,
  onDesignTokensChange,
  memorialData,
  onMemorialDataChange,
  userTemplateId,
  onOpenMediaPicker,
  userTemplate,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  const updateTemplateMutation = useUpdateUserTemplate(userTemplateId || "");

  // Debounced save function
  const saveCallback = useCallback(
    async (data: { customization?: DesignTokens; sections?: SectionData }) => {
      if (!userTemplateId) return;

      setSaveStatus("saving");
      try {
        await updateTemplateMutation.mutateAsync({
          customization: data.customization as unknown as Record<string, unknown>,
          sections: data.sections as unknown as Record<string, unknown>,
        });
        setSaveStatus("saved");
        // Reset to idle after 2 seconds
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Failed to save:", error);
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    },
    [userTemplateId, updateTemplateMutation]
  );

  const debouncedSave = useDebounce(saveCallback, 500);

  // Handle design tokens change with auto-save
  const handleDesignTokensChange = useCallback(
    (tokens: DesignTokens) => {
      onDesignTokensChange(tokens);
      debouncedSave({ customization: tokens, sections: sectionData });
    },
    [onDesignTokensChange, debouncedSave, sectionData]
  );

  // Handle section data change with auto-save
  const handleSectionDataChange = useCallback(
    (section: string, data: unknown) => {
      onSectionDataChange(section, data);
      const updatedSectionData = { ...sectionData, [section]: data };
      debouncedSave({ customization: designTokens, sections: updatedSectionData });
    },
    [onSectionDataChange, debouncedSave, sectionData, designTokens]
  );

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isDark = theme === "dark";
  const textClass = isDark ? "text-white" : "text-gray-900";
  const bgClass = isDark ? "bg-black" : "bg-white";
  const borderClass = isDark ? "border-white/10" : "border-gray-200";

  // Default design tokens
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

  // Get preview container config based on mode
  const getPreviewConfig = () => {
    switch (previewMode) {
      case "mobile":
        return {
          containerClass: "mx-auto",
          width: 375,
          height: 600, // Fixed height for scrolling
          maxWidth: "375px",
        };
      case "tablet":
        return {
          containerClass: "mx-auto",
          width: 768,
          height: 600,
          maxWidth: "768px",
        };
      case "desktop":
      default:
        return {
          containerClass: "w-full",
          width: "100%",
          height: 600,
          maxWidth: "none",
        };
    }
  };

  const previewConfig = getPreviewConfig();

  // Mobile view with tabs
  if (isMobileView) {
    return (
      <div className="space-y-4">
        {/* Save Indicator */}
        <div className="flex justify-end">
          <SaveIndicator status={saveStatus} />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor">
              {t("dashboard.pageBuilder.editView.editor", {}, "Editor")}
            </TabsTrigger>
            <TabsTrigger value="preview">
              {t("dashboard.pageBuilder.editView.preview", {}, "Preview")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="mt-4">
            <div className={`border rounded-lg p-4 ${borderClass} ${bgClass}`}>
              <Accordion type="multiple" defaultValue={["design"]} className="w-full">
                {/* Design Tokens Editor */}
                <AccordionItem value="design">
                  <AccordionTrigger className="text-lg font-semibold">
                    {t("dashboard.pageBuilder.editView.designTokens", {}, "Design & Colors")}
                  </AccordionTrigger>
                  <AccordionContent>
                    <TemplateCustomizer
                      initialDesign={activeDesign}
                      onDesignChange={handleDesignTokensChange}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* Section Editors */}
                <AccordionItem value="sections">
                  <AccordionTrigger className="text-lg font-semibold">
                    {t("dashboard.pageBuilder.editView.sections", {}, "Content Sections")}
                  </AccordionTrigger>
                  <AccordionContent>
                    <DynamicSectionRenderer
                      supportedSections={supportedSections as SectionType[]}
                      sectionData={sectionData}
                      onSectionDataChange={handleSectionDataChange}
                      onOpenMediaPicker={onOpenMediaPicker}
                      memorialData={memorialData}
                      onMemorialDataChange={onMemorialDataChange}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            {/* Preview Mode Controls for Mobile */}
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm font-medium ${textClass}`}>
                {t("dashboard.pageBuilder.editView.previewMode", {}, "Preview Mode")}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewMode("desktop")}
                  className={`p-2 rounded-md transition-colors ${
                    previewMode === "desktop"
                      ? isDark
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-900"
                      : isDark
                        ? "bg-white/5 text-white/70 hover:bg-white/10"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  title={t("dashboard.pageBuilder.editView.desktop", {}, "Desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewMode("tablet")}
                  className={`p-2 rounded-md transition-colors ${
                    previewMode === "tablet"
                      ? isDark
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-900"
                      : isDark
                        ? "bg-white/5 text-white/70 hover:bg-white/10"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  title={t("dashboard.pageBuilder.editView.tablet", {}, "Tablet")}
                >
                  <Tablet className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={`p-2 rounded-md transition-colors ${
                    previewMode === "mobile"
                      ? isDark
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-900"
                      : isDark
                        ? "bg-white/5 text-white/70 hover:bg-white/10"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  title={t("dashboard.pageBuilder.editView.mobile", {}, "Mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className={`border rounded-lg overflow-hidden ${borderClass}`}>
              {/* Preview Header */}
              <div
                className={`px-4 py-2 border-b ${borderClass} ${bgClass} flex items-center justify-between`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-sm font-medium">
                    {previewMode.charAt(0).toUpperCase() + previewMode.slice(1)} Preview
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {previewMode === "desktop" ? "Full Width" : `${previewConfig.width}px`} × H/V
                  Scrollable
                </div>
              </div>

              {/* Scrollable Preview Container */}
              <div
                className="overflow-auto bg-gray-100 dark:bg-gray-900"
                style={{
                  height: `${previewConfig.height}px`,
                  maxWidth: previewConfig.maxWidth,
                  margin: previewMode !== "desktop" ? "0 auto" : "unset",
                  overflowX: "auto",
                  overflowY: "auto",
                }}
              >
                <div
                  className="template-preview"
                  style={{
                    backgroundColor: "white",
                    minWidth: previewMode === "desktop" ? "100%" : `${previewConfig.width}px`,
                    width: previewMode === "desktop" ? "100%" : "max-content",
                  }}
                >
                  <TemplateRenderer
                    templateId={selectedTemplateSlug || selectedTemplate}
                    designTokens={activeDesign}
                    sectionData={sectionData}
                    memorialData={memorialData}
                    supportedSections={supportedSections}
                    userTemplate={userTemplate}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Desktop split-screen view
  return (
    <div className="space-y-4">
      {/* Header with Save Indicator */}
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${textClass}`}>
          {t("dashboard.pageBuilder.editView.title", {}, "Edit Template")}
        </h2>
        <SaveIndicator status={saveStatus} />
      </div>

      {/* Split-screen layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Panel - Editors (40%) */}
        <div className="lg:col-span-2">
          <div className={`border rounded-lg p-4 ${borderClass} ${bgClass} sticky top-4`}>
            <Accordion type="multiple" defaultValue={["design", "sections"]} className="w-full">
              {/* Design Tokens Editor */}
              <AccordionItem value="design">
                <AccordionTrigger className="text-lg font-semibold">
                  {t("dashboard.pageBuilder.editView.designTokens", {}, "Design & Colors")}
                </AccordionTrigger>
                <AccordionContent>
                  <TemplateCustomizer
                    initialDesign={activeDesign}
                    onDesignChange={handleDesignTokensChange}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Section Editors */}
              <AccordionItem value="sections">
                <AccordionTrigger className="text-lg font-semibold">
                  {t("dashboard.pageBuilder.editView.sections", {}, "Content Sections")}
                </AccordionTrigger>
                <AccordionContent>
                  <DynamicSectionRenderer
                    supportedSections={supportedSections as SectionType[]}
                    sectionData={sectionData}
                    onSectionDataChange={handleSectionDataChange}
                    onOpenMediaPicker={onOpenMediaPicker}
                    memorialData={memorialData}
                    onMemorialDataChange={onMemorialDataChange}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Right Panel - Live Preview (60%) */}
        <div className="lg:col-span-3">
          <div className="space-y-4">
            {/* Preview Mode Controls */}
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${textClass}`}>
                {t("dashboard.pageBuilder.editView.previewMode", {}, "Preview Mode")}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewMode("desktop")}
                  className={`p-2 rounded-md transition-colors ${
                    previewMode === "desktop"
                      ? isDark
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-900"
                      : isDark
                        ? "bg-white/5 text-white/70 hover:bg-white/10"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  title={t("dashboard.pageBuilder.editView.desktop", {}, "Desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewMode("tablet")}
                  className={`p-2 rounded-md transition-colors ${
                    previewMode === "tablet"
                      ? isDark
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-900"
                      : isDark
                        ? "bg-white/5 text-white/70 hover:bg-white/10"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  title={t("dashboard.pageBuilder.editView.tablet", {}, "Tablet")}
                >
                  <Tablet className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={`p-2 rounded-md transition-colors ${
                    previewMode === "mobile"
                      ? isDark
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-900"
                      : isDark
                        ? "bg-white/5 text-white/70 hover:bg-white/10"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                  title={t("dashboard.pageBuilder.editView.mobile", {}, "Mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Preview Container */}
            <div className={`border rounded-lg overflow-hidden ${borderClass}`}>
              {/* Preview Header with Device Indicators */}
              <div
                className={`px-4 py-2 border-b ${borderClass} ${bgClass} flex items-center justify-between`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-sm font-medium">
                    {previewMode.charAt(0).toUpperCase() + previewMode.slice(1)} Preview
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {previewMode === "desktop" ? "Full Width" : `${previewConfig.width}px`} × H/V
                  Scrollable
                </div>
              </div>

              {/* Scrollable Preview Viewport */}
              <div
                className="overflow-auto bg-gray-100 dark:bg-gray-900"
                style={{
                  height: `${previewConfig.height}px`,
                  maxWidth: previewConfig.maxWidth,
                  margin: previewMode !== "desktop" ? "0 auto" : "unset",
                  overflowX: "auto",
                  overflowY: "auto",
                }}
              >
                <div
                  className="template-preview"
                  style={{
                    backgroundColor: "white",
                    minWidth: previewMode === "desktop" ? "100%" : `${previewConfig.width}px`,
                    width: previewMode === "desktop" ? "100%" : "max-content",
                  }}
                >
                  <TemplateRenderer
                    templateId={selectedTemplateSlug || selectedTemplate}
                    designTokens={activeDesign}
                    sectionData={sectionData}
                    memorialData={memorialData}
                    supportedSections={supportedSections}
                    userTemplate={userTemplate}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
