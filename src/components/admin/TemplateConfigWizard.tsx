"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslations } from "@/hooks/useTranslations";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Palette,
  Layout,
  Eye,
  Settings,
  FileCode,
  Sparkles,
  FolderTree,
  FileCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// Types
interface TemplateSection {
  id: string;
  name: string;
  component: string;
  required: boolean;
  description?: string;
  defaultEnabled?: boolean;
}

interface DesignTokens {
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
    headingSize: string;
    bodySize: string;
  };
  layout: {
    spacing: string;
    borderRadius: string;
    containerWidth: string;
  };
}

interface ScaffoldConfig {
  name: string;
  slug: string;
  description: string;
  author: string;
  version: string;
  designTokens: DesignTokens;
  sections: TemplateSection[];
  features?: {
    candles?: boolean;
    tributes?: boolean;
    gallery?: boolean;
    timeline?: boolean;
    donations?: boolean;
  };
}

interface DetectedComponent {
  name: string;
  filePath: string;
  type: string;
  sectionType: string | null;
  hasDefaultExport: boolean;
  props: { name: string; type: string; required: boolean }[];
}

interface ScaffoldPreviewResponse {
  success: boolean;
  config: ScaffoldConfig;
  detectedComponents: DetectedComponent[];
  generatedFiles: { path: string; description: string }[];
  warnings: string[];
  errors: string[];
}

interface WizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId?: string;
  extractedPath?: string;
  onComplete?: (config: ScaffoldConfig) => void;
}

const WIZARD_STEPS = [
  { id: "info", title: "Basic Info", icon: FileCode },
  { id: "sections", title: "Sections", icon: Layout },
  { id: "design", title: "Design Tokens", icon: Palette },
  { id: "preview", title: "Preview", icon: Eye },
  { id: "generate", title: "Generate", icon: Sparkles },
] as const;

type StepId = (typeof WIZARD_STEPS)[number]["id"];

const DEFAULT_DESIGN_TOKENS: DesignTokens = {
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

const SECTION_TYPES = [
  { id: "hero", name: "Hero Section", required: true },
  { id: "gallery", name: "Photo Gallery", required: false },
  { id: "timeline", name: "Life Journey", required: false },
  { id: "tributes", name: "Tributes", required: false },
  { id: "candles", name: "Candle Sanctuary", required: false },
  { id: "condolence", name: "Condolences", required: false },
  { id: "biography", name: "Biography", required: false },
  { id: "family", name: "Family Tree", required: false },
  { id: "video", name: "Video Gallery", required: false },
  { id: "donations", name: "Donations", required: false },
  { id: "footer", name: "Footer", required: false },
  { id: "navigation", name: "Navigation", required: false },
];

export default function TemplateConfigWizard({
  open,
  onOpenChange,
  templateId,
  extractedPath,
  onComplete,
}: WizardProps) {
  const { t } = useTranslations();
  const queryClient = useQueryClient();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<StepId>("info");

  // Form state
  const [config, setConfig] = useState<ScaffoldConfig>({
    name: "",
    slug: "",
    description: "",
    author: "ForeverPages",
    version: "1.0.0",
    designTokens: DEFAULT_DESIGN_TOKENS,
    sections: [],
    features: {
      candles: true,
      tributes: true,
      gallery: true,
      timeline: true,
      donations: true,
    },
  });

  // Detected components state
  const [detectedComponents, setDetectedComponents] = useState<DetectedComponent[]>([]);
  const [sectionMappings, setSectionMappings] = useState<Record<string, string>>({});

  // Preview state
  const [previewFiles, setPreviewFiles] = useState<{ path: string; description: string }[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Fetch scaffold preview data when dialog opens
  const { data: previewData, isLoading: isPreviewLoading } = useQuery<ScaffoldPreviewResponse>({
    queryKey: ["scaffold-preview", templateId, extractedPath],
    queryFn: async () => {
      const response = await fetch("/api/admin/templates/scaffold/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, extractedPath }),
      });
      if (!response.ok) throw new Error("Failed to fetch scaffold preview");
      return response.json();
    },
    enabled: open && !!extractedPath,
  });

  // Update state when preview data is loaded
  useEffect(() => {
    if (previewData?.success) {
      setConfig((prev) => ({
        ...prev,
        ...previewData.config,
        designTokens: previewData.config.designTokens || prev.designTokens,
      }));
      setDetectedComponents(previewData.detectedComponents || []);
      setPreviewFiles(previewData.generatedFiles || []);
      setWarnings(previewData.warnings || []);

      // Auto-map detected components to sections
      const mappings: Record<string, string> = {};
      for (const comp of previewData.detectedComponents || []) {
        if (comp.sectionType) {
          mappings[comp.sectionType] = comp.name;
        }
      }
      setSectionMappings(mappings);
    }
  }, [previewData]);

  // Generate scaffold mutation
  const generateMutation = useMutation({
    mutationFn: async (scaffoldConfig: ScaffoldConfig) => {
      const response = await fetch("/api/admin/templates/scaffold/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          extractedPath,
          config: scaffoldConfig,
          sectionMappings,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate scaffold");
      }
      return response.json();
    },
    onSuccess: (_data) => {
      toast.success(
        t("templateWizard.generationSuccess", {}, "Template scaffold generated successfully!")
      );
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      onComplete?.(config);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(
        error.message || t("templateWizard.generationError", {}, "Failed to generate scaffold")
      );
    },
  });

  // Step navigation
  const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);
  const canGoBack = currentStepIndex > 0;
  const canGoNext = currentStepIndex < WIZARD_STEPS.length - 1;
  const isLastStep = currentStepIndex === WIZARD_STEPS.length - 1;

  const goBack = useCallback(() => {
    if (canGoBack) {
      setCurrentStep(WIZARD_STEPS[currentStepIndex - 1].id);
    }
  }, [canGoBack, currentStepIndex]);

  const goNext = useCallback(() => {
    if (canGoNext) {
      setCurrentStep(WIZARD_STEPS[currentStepIndex + 1].id);
    }
  }, [canGoNext, currentStepIndex]);

  const handleGenerate = useCallback(() => {
    generateMutation.mutate(config);
  }, [config, generateMutation]);

  // Validate current step before proceeding
  const validateStep = (step: StepId): boolean => {
    switch (step) {
      case "info":
        return !!(config.name && config.slug && config.version);
      case "sections":
        return config.sections.length > 0;
      case "design":
        return true; // Design tokens always have defaults
      case "preview":
        return true;
      case "generate":
        return true;
      default:
        return true;
    }
  };

  const addSection = (sectionType: (typeof SECTION_TYPES)[number]) => {
    const newSection: TemplateSection = {
      id: sectionType.id,
      name: sectionType.name,
      component:
        sectionMappings[sectionType.id] ||
        `${sectionType.id.charAt(0).toUpperCase()}${sectionType.id.slice(1)}Section`,
      required: sectionType.required,
      defaultEnabled: true,
    };
    setConfig((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const removeSection = (sectionId: string) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== sectionId),
    }));
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "info":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t("templateWizard.templateName", {}, "Template Name")}
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="name"
                  value={config.name}
                  onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="My Memorial Template"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">
                  {t("templateWizard.slug", {}, "URL Slug")}
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="slug"
                  value={config.slug}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                    }))
                  }
                  placeholder="my-memorial-template"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {t("templateWizard.description", {}, "Description")}
              </Label>
              <Textarea
                id="description"
                value={config.description}
                onChange={(e) => setConfig((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="A beautiful memorial template..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author">{t("templateWizard.author", {}, "Author")}</Label>
                <Input
                  id="author"
                  value={config.author}
                  onChange={(e) => setConfig((prev) => ({ ...prev, author: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">
                  {t("templateWizard.version", {}, "Version")}
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="version"
                  value={config.version}
                  onChange={(e) => setConfig((prev) => ({ ...prev, version: e.target.value }))}
                  placeholder="1.0.0"
                />
              </div>
            </div>

            {/* Detected Components Info */}
            {detectedComponents.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    {t("templateWizard.detectedComponents", {}, "Detected Components")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {detectedComponents.map((comp) => (
                      <Badge key={comp.name} variant="secondary">
                        {comp.name}
                        {comp.sectionType && (
                          <span className="ml-1 text-xs opacity-70">({comp.sectionType})</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "sections":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">
                  {t("templateWizard.configureSections", {}, "Configure Sections")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "templateWizard.sectionsDescription",
                    {},
                    "Select and configure the sections for your template"
                  )}
                </p>
              </div>
            </div>

            {/* Available Sections */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {t("templateWizard.availableSections", {}, "Available Sections")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {SECTION_TYPES.filter(
                    (type) => !config.sections.some((s) => s.id === type.id)
                  ).map((type) => (
                    <Button
                      key={type.id}
                      variant="outline"
                      size="sm"
                      onClick={() => addSection(type)}
                      className="justify-start"
                    >
                      {type.name}
                      {type.required && (
                        <Badge variant="destructive" className="ml-auto text-xs">
                          Required
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Configured Sections */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {t("templateWizard.configuredSections", {}, "Configured Sections")}
                  <Badge variant="secondary" className="ml-2">
                    {config.sections.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px]">
                  <div className="space-y-3">
                    {config.sections.map((section, index) => (
                      <div
                        key={section.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{index + 1}</span>
                          <div>
                            <div className="font-medium">{section.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Component: {section.component}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {section.required && <Badge variant="outline">Required</Badge>}
                          <Select
                            value={sectionMappings[section.id] || ""}
                            onValueChange={(val) =>
                              setSectionMappings((prev) => ({ ...prev, [section.id]: val }))
                            }
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Map component..." />
                            </SelectTrigger>
                            <SelectContent>
                              {detectedComponents.map((comp) => (
                                <SelectItem key={comp.name} value={comp.name}>
                                  {comp.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!section.required && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSection(section.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {config.sections.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        {t(
                          "templateWizard.noSectionsAdded",
                          {},
                          "No sections added yet. Add sections from above."
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        );

      case "design":
        return (
          <div className="space-y-6">
            <Tabs defaultValue="colors">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="colors">{t("templateWizard.colors", {}, "Colors")}</TabsTrigger>
                <TabsTrigger value="fonts">{t("templateWizard.fonts", {}, "Fonts")}</TabsTrigger>
                <TabsTrigger value="layout">{t("templateWizard.layout", {}, "Layout")}</TabsTrigger>
              </TabsList>

              <TabsContent value="colors" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(config.designTokens.colors).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={`color-${key}`} className="capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={`color-${key}`}
                          type="color"
                          value={value}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              designTokens: {
                                ...prev.designTokens,
                                colors: {
                                  ...prev.designTokens.colors,
                                  [key]: e.target.value,
                                },
                              },
                            }))
                          }
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          type="text"
                          value={value}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              designTokens: {
                                ...prev.designTokens,
                                colors: {
                                  ...prev.designTokens.colors,
                                  [key]: e.target.value,
                                },
                              },
                            }))
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="fonts" className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fontFamily">
                      {t("templateWizard.fontFamily", {}, "Font Family")}
                    </Label>
                    <Select
                      value={config.designTokens.fonts.fontFamily}
                      onValueChange={(val) =>
                        setConfig((prev) => ({
                          ...prev,
                          designTokens: {
                            ...prev.designTokens,
                            fonts: { ...prev.designTokens.fonts, fontFamily: val },
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Open Sans">Open Sans</SelectItem>
                        <SelectItem value="Lora">Lora</SelectItem>
                        <SelectItem value="Merriweather">Merriweather</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="headingSize">
                        {t("templateWizard.headingSize", {}, "Heading Size")}
                      </Label>
                      <Select
                        value={config.designTokens.fonts.headingSize}
                        onValueChange={(val) =>
                          setConfig((prev) => ({
                            ...prev,
                            designTokens: {
                              ...prev.designTokens,
                              fonts: { ...prev.designTokens.fonts, headingSize: val },
                            },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bodySize">
                        {t("templateWizard.bodySize", {}, "Body Size")}
                      </Label>
                      <Select
                        value={config.designTokens.fonts.bodySize}
                        onValueChange={(val) =>
                          setConfig((prev) => ({
                            ...prev,
                            designTokens: {
                              ...prev.designTokens,
                              fonts: { ...prev.designTokens.fonts, bodySize: val },
                            },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="layout" className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="spacing">{t("templateWizard.spacing", {}, "Spacing")}</Label>
                    <Select
                      value={config.designTokens.layout.spacing}
                      onValueChange={(val) =>
                        setConfig((prev) => ({
                          ...prev,
                          designTokens: {
                            ...prev.designTokens,
                            layout: { ...prev.designTokens.layout, spacing: val },
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="comfortable">Comfortable</SelectItem>
                        <SelectItem value="spacious">Spacious</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="borderRadius">
                      {t("templateWizard.borderRadius", {}, "Border Radius")}
                    </Label>
                    <Select
                      value={config.designTokens.layout.borderRadius}
                      onValueChange={(val) =>
                        setConfig((prev) => ({
                          ...prev,
                          designTokens: {
                            ...prev.designTokens,
                            layout: { ...prev.designTokens.layout, borderRadius: val },
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="subtle">Subtle</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="rounded">Rounded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="containerWidth">
                      {t("templateWizard.containerWidth", {}, "Container Width")}
                    </Label>
                    <Select
                      value={config.designTokens.layout.containerWidth}
                      onValueChange={(val) =>
                        setConfig((prev) => ({
                          ...prev,
                          designTokens: {
                            ...prev.designTokens,
                            layout: { ...prev.designTokens.layout, containerWidth: val },
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="narrow">Narrow</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="wide">Wide</SelectItem>
                        <SelectItem value="full">Full Width</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );

      case "preview":
        return (
          <div className="space-y-6">
            {/* Warnings */}
            {warnings.length > 0 && (
              <Card className="border-yellow-500/50 bg-yellow-500/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                    <AlertCircle className="h-4 w-4" />
                    {t("templateWizard.warnings", {}, "Warnings")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside text-sm space-y-1 text-yellow-700 dark:text-yellow-400">
                    {warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Configuration Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {t("templateWizard.configSummary", {}, "Configuration Summary")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {config.name}
                  </div>
                  <div>
                    <span className="font-medium">Slug:</span> {config.slug}
                  </div>
                  <div>
                    <span className="font-medium">Version:</span> {config.version}
                  </div>
                  <div>
                    <span className="font-medium">Sections:</span> {config.sections.length}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Files to Generate */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FolderTree className="h-4 w-4" />
                  {t("templateWizard.filesToGenerate", {}, "Files to Generate")}
                  <Badge variant="secondary">{previewFiles.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2 text-sm font-mono">
                    {previewFiles.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between p-2 rounded bg-muted/50"
                      >
                        <span className="text-xs">{file.path}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {file.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        );

      case "generate":
        return (
          <div className="space-y-6">
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {t("templateWizard.readyToGenerate", {}, "Ready to Generate")}
                </CardTitle>
                <CardDescription>
                  {t(
                    "templateWizard.generateDescription",
                    {},
                    "Click the button below to generate your template scaffold. This will create all necessary files and submit them for review."
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t("templateWizard.templateName", {}, "Template Name")}:</span>
                    <span className="font-medium">{config.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("templateWizard.sections", {}, "Sections")}:</span>
                    <span className="font-medium">{config.sections.length} sections</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("templateWizard.filesToGenerate", {}, "Files")}:</span>
                    <span className="font-medium">{previewFiles.length} files</span>
                  </div>
                </div>

                {generateMutation.isPending && (
                  <div className="space-y-2">
                    <Progress value={50} className="animate-pulse" />
                    <p className="text-sm text-center text-muted-foreground">
                      {t("templateWizard.generatingScaffold", {}, "Generating scaffold...")}
                    </p>
                  </div>
                )}

                {generateMutation.isError && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/50 p-4 text-red-600 dark:text-red-400">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Error</span>
                    </div>
                    <p className="text-sm mt-1">{generateMutation.error?.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t("templateWizard.title", {}, "Template Configuration Wizard")}
          </DialogTitle>
          <DialogDescription>
            {t("templateWizard.subtitle", {}, "Configure your template scaffold generation")}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicators */}
        <div className="flex justify-center py-4 border-b">
          <div className="flex items-center gap-2">
            {WIZARD_STEPS.map((step, index) => {
              const isActive = step.id === currentStep;
              const isPast = index < currentStepIndex;
              const Icon = step.icon;

              return (
                <React.Fragment key={step.id}>
                  {index > 0 && (
                    <div
                      className={cn(
                        "w-8 h-0.5 transition-colors",
                        isPast ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    disabled={index > currentStepIndex + 1}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isPast
                          ? "bg-primary/20 text-primary hover:bg-primary/30"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{step.title}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <ScrollArea className="flex-1 px-1">
          <div className="p-4">
            {isPreviewLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  {t("templateWizard.loading", {}, "Analyzing template...")}
                </p>
              </div>
            ) : (
              renderStepContent()
            )}
          </div>
        </ScrollArea>

        {/* Footer Navigation */}
        <DialogFooter className="border-t pt-4 flex justify-between">
          <Button variant="outline" onClick={goBack} disabled={!canGoBack} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            {t("templateWizard.back", {}, "Back")}
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t("templateWizard.cancel", {}, "Cancel")}
            </Button>

            {isLastStep ? (
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !validateStep(currentStep)}
                className="gap-2"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("templateWizard.generating", {}, "Generating...")}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {t("templateWizard.generate", {}, "Generate Scaffold")}
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={goNext} disabled={!validateStep(currentStep)} className="gap-2">
                {t("templateWizard.next", {}, "Next")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
