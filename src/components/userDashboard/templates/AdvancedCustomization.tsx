"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textArea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/seperator";
import {
  Palette,
  Type,
  Layout,
  Image,
  Settings,
  Save,
  Undo,
  Redo,
  Eye,
  Download,
  Upload,
  RotateCcw,
} from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  validateTemplateCustomization,
  sanitizeTemplateCustomization,
  validateColor,
} from "@/utils/templateSecurity";
import toast from "react-hot-toast";

interface TemplateCustomization {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      heading: number;
      body: number;
      small: number;
    };
    fontWeight: {
      heading: string;
      body: string;
    };
    lineHeight: number;
  };
  layout: {
    spacing: number;
    borderRadius: number;
    maxWidth: number;
    padding: number;
  };
  elements: {
    showHeader: boolean;
    showFooter: boolean;
    showSidebar: boolean;
    headerHeight: number;
    footerHeight: number;
  };
  customCSS: string;
  customJS: string;
}

interface AdvancedCustomizationProps {
  templateId?: string;
}

const FONT_FAMILIES = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Poppins",
  "Montserrat",
  "Nunito",
  "Source Sans Pro",
  "Raleway",
  "Ubuntu",
];

const FONT_WEIGHTS = [
  { value: "300", label: "Light" },
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semi Bold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extra Bold" },
];

export const AdvancedCustomization: React.FC<AdvancedCustomizationProps> = ({ templateId }) => {
  const { t } = useTranslations();
  const queryClient = useQueryClient();
  const [customization, setCustomization] = useState<TemplateCustomization>({
    id: templateId || "",
    name: "",
    colors: {
      primary: "#3b82f6",
      secondary: "#64748b",
      accent: "#f59e0b",
      background: "#ffffff",
      text: "#1f2937",
    },
    typography: {
      fontFamily: "Inter",
      fontSize: {
        heading: 24,
        body: 16,
        small: 14,
      },
      fontWeight: {
        heading: "600",
        body: "400",
      },
      lineHeight: 1.5,
    },
    layout: {
      spacing: 16,
      borderRadius: 8,
      maxWidth: 1200,
      padding: 24,
    },
    elements: {
      showHeader: true,
      showFooter: true,
      showSidebar: false,
      headerHeight: 64,
      footerHeight: 64,
    },
    customCSS: "",
    customJS: "",
  });

  const [history, setHistory] = useState<TemplateCustomization[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const { isLoading } = useQuery({
    queryKey: ["template-customization", templateId],
    queryFn: async (): Promise<TemplateCustomization> => {
      if (!templateId) return customization;
      const response = await fetch(`/api/templates/${templateId}/customization`);
      if (!response.ok) throw new Error("Failed to fetch template customization");
      return response.json();
    },
    enabled: !!templateId,
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: TemplateCustomization) => {
      const response = await fetch(`/api/templates/${templateId || "new"}/customization`, {
        method: templateId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save customization");
      return response.json();
    },
    onSuccess: () => {
      toast.success(t("dashboard.templates.customization.save.success"));
      queryClient.invalidateQueries({ queryKey: ["template-customization"] });
    },
    onError: () => {
      toast.error(t("dashboard.templates.customization.save.error"));
    },
  });

  const updateCustomization = useCallback(
    (updates: Partial<TemplateCustomization>) => {
      setCustomization((prev) => {
        const newCustomization = { ...prev, ...updates };
        // Add to history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(prev);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        return newCustomization;
      });
    },
    [history, historyIndex]
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setCustomization(history[historyIndex - 1]);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setCustomization(history[historyIndex + 1]);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  const resetToDefault = useCallback(() => {
    setCustomization({
      id: templateId || "",
      name: "",
      colors: {
        primary: "#3b82f6",
        secondary: "#64748b",
        accent: "#f59e0b",
        background: "#ffffff",
        text: "#1f2937",
      },
      typography: {
        fontFamily: "Inter",
        fontSize: {
          heading: 24,
          body: 16,
          small: 14,
        },
        fontWeight: {
          heading: "600",
          body: "400",
        },
        lineHeight: 1.5,
      },
      layout: {
        spacing: 16,
        borderRadius: 8,
        maxWidth: 1200,
        padding: 24,
      },
      elements: {
        showHeader: true,
        showFooter: true,
        showSidebar: false,
        headerHeight: 64,
        footerHeight: 64,
      },
      customCSS: "",
      customJS: "",
    });
  }, [templateId]);

  const handleSave = () => {
    const validation = validateTemplateCustomization(customization);
    if (!validation.isValid) {
      toast.error(
        t(`dashboard.templates.validation.customizationInvalid`) ||
          `Validation failed: ${validation.errors.join(", ")}`
      );
      return;
    }

    const sanitizedCustomization = sanitizeTemplateCustomization(customization);
    saveMutation.mutate(sanitizedCustomization);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(customization, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `template-customization-${customization.name || "untitled"}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedCustomization = JSON.parse(e.target?.result as string);

          const validation = validateTemplateCustomization(importedCustomization);
          if (!validation.isValid) {
            toast.error(
              t(`dashboard.templates.validation.importInvalid`) ||
                `Invalid customization file: ${validation.errors.join(", ")}`
            );
            return;
          }

          const sanitizedCustomization = sanitizeTemplateCustomization(importedCustomization);
          setCustomization(sanitizedCustomization);
          toast.success(t("dashboard.templates.customization.import.success"));
        } catch (error) {
          toast.error(t("dashboard.templates.customization.import.error", error));
        }
      };
      reader.readAsText(file);
    }
  };

  const previewStyles = useMemo(
    () => ({
      container: {
        fontFamily: customization.typography.fontFamily,
        backgroundColor: customization.colors.background,
        color: customization.colors.text,
        maxWidth: `${customization.layout.maxWidth}px`,
        margin: "0 auto",
        padding: `${customization.layout.padding}px`,
        borderRadius: `${customization.layout.borderRadius}px`,
      },
      header: {
        height: `${customization.elements.headerHeight}px`,
        backgroundColor: customization.colors.primary,
        color: "white",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        borderRadius: `${customization.layout.borderRadius}px 0 0 0`,
      },
      heading: {
        fontSize: `${customization.typography.fontSize.heading}px`,
        fontWeight: customization.typography.fontWeight.heading,
        margin: 0,
      },
      subheading: {
        fontSize: `${customization.typography.fontSize.heading * 0.8}px`,
        fontWeight: customization.typography.fontWeight.heading,
        color: customization.colors.primary,
        margin: 0,
        lineHeight: customization.typography.lineHeight,
      },
      body: {
        fontSize: `${customization.typography.fontSize.body}px`,
        fontWeight: customization.typography.fontWeight.body,
        lineHeight: customization.typography.lineHeight,
        margin: 0,
      },
      accentBox: {
        backgroundColor: customization.colors.secondary + "20",
        border: `1px solid ${customization.colors.secondary}`,
        borderRadius: `${customization.layout.borderRadius}px`,
      },
      smallText: {
        fontSize: `${customization.typography.fontSize.small}px`,
        margin: 0,
        color: customization.colors.secondary,
      },
      footer: {
        height: `${customization.elements.footerHeight}px`,
        backgroundColor: customization.colors.secondary + "10",
        padding: "16px",
        borderRadius: `0 0 0 ${customization.layout.borderRadius}px`,
      },
      footerText: {
        fontSize: `${customization.typography.fontSize.small}px`,
        margin: 0,
        textAlign: "center" as const,
      },
    }),
    [customization]
  );

  if (isLoading) {
    return <div>Loading customization...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {t("dashboard.templates.customization.title")}
            <Badge variant="secondary">Premium</Badge>
          </h2>
          <p className="text-muted-foreground">{t("dashboard.templates.customization.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={resetToDefault}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
          </Button>
          <label>
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {t("dashboard.templates.customization.actions.import")}
              </span>
            </Button>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending
              ? "Saving..."
              : t("dashboard.templates.customization.actions.save")}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Help
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Customization Help</DialogTitle>
                <DialogDescription>
                  Learn how to use the advanced customization features
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Colors</h4>
                  <p className="text-sm text-muted-foreground">
                    Customize the color scheme including primary, secondary, accent, background, and
                    text colors.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Typography</h4>
                  <p className="text-sm text-muted-foreground">
                    Adjust font families, sizes, weights, and line heights for different text
                    elements.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Layout</h4>
                  <p className="text-sm text-muted-foreground">
                    Control spacing, border radius, max width, and padding for your template layout.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Elements</h4>
                  <p className="text-sm text-muted-foreground">
                    Show or hide header, footer, and sidebar elements, and adjust their dimensions.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Code</h4>
                  <p className="text-sm text-muted-foreground">
                    Add custom CSS and JavaScript to further customize your template.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            {t("dashboard.templates.customization.sections.colors")}
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            {t("dashboard.templates.customization.sections.typography")}
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            {t("dashboard.templates.customization.sections.layout")}
          </TabsTrigger>
          <TabsTrigger value="elements" className="flex items-center gap-2">
            <Image className="h-4 w-4" alt="" />
            Elements
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t("dashboard.templates.customization.sections.code")}
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
              <CardDescription>Customize the color palette for your template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(customization.colors).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">
                      {t(`dashboard.templates.customization.colors.${key}`)}
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => {
                          if (validateColor(e.target.value)) {
                            updateCustomization({
                              colors: { ...customization.colors, [key]: e.target.value },
                            });
                          }
                        }}
                        className="w-12 h-8 rounded border"
                      />
                      <Input
                        value={value}
                        onChange={(e) => {
                          if (validateColor(e.target.value)) {
                            updateCustomization({
                              colors: { ...customization.colors, [key]: e.target.value },
                            });
                          }
                        }}
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Typography Settings</CardTitle>
              <CardDescription>
                Configure fonts, sizes, and spacing for text elements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>{t("dashboard.templates.customization.typography.fontFamily")}</Label>
                    <Select
                      value={customization.typography.fontFamily}
                      onValueChange={(value) =>
                        updateCustomization({
                          typography: { ...customization.typography, fontFamily: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILIES.map((font) => (
                          <SelectItem key={font} value={font}>
                            {font}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Line Height: {customization.typography.lineHeight}</Label>
                    <Slider
                      value={[customization.typography.lineHeight]}
                      onValueChange={([value]) =>
                        updateCustomization({
                          typography: { ...customization.typography, lineHeight: value },
                        })
                      }
                      min={1}
                      max={2}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Heading Font Weight</Label>
                    <Select
                      value={customization.typography.fontWeight.heading}
                      onValueChange={(value) =>
                        updateCustomization({
                          typography: {
                            ...customization.typography,
                            fontWeight: { ...customization.typography.fontWeight, heading: value },
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_WEIGHTS.map((weight) => (
                          <SelectItem key={weight.value} value={weight.value}>
                            {weight.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Body Font Weight</Label>
                    <Select
                      value={customization.typography.fontWeight.body}
                      onValueChange={(value) =>
                        updateCustomization({
                          typography: {
                            ...customization.typography,
                            fontWeight: { ...customization.typography.fontWeight, body: value },
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_WEIGHTS.map((weight) => (
                          <SelectItem key={weight.value} value={weight.value}>
                            {weight.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Heading Size: {customization.typography.fontSize.heading}px</Label>
                  <Slider
                    value={[customization.typography.fontSize.heading]}
                    onValueChange={([value]) =>
                      updateCustomization({
                        typography: {
                          ...customization.typography,
                          fontSize: { ...customization.typography.fontSize, heading: value },
                        },
                      })
                    }
                    min={16}
                    max={48}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Body Size: {customization.typography.fontSize.body}px</Label>
                  <Slider
                    value={[customization.typography.fontSize.body]}
                    onValueChange={([value]) =>
                      updateCustomization({
                        typography: {
                          ...customization.typography,
                          fontSize: { ...customization.typography.fontSize, body: value },
                        },
                      })
                    }
                    min={12}
                    max={24}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Small Text Size: {customization.typography.fontSize.small}px</Label>
                  <Slider
                    value={[customization.typography.fontSize.small]}
                    onValueChange={([value]) =>
                      updateCustomization({
                        typography: {
                          ...customization.typography,
                          fontSize: { ...customization.typography.fontSize, small: value },
                        },
                      })
                    }
                    min={10}
                    max={18}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Layout Configuration</CardTitle>
              <CardDescription>Adjust spacing, dimensions, and layout properties</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Spacing: {customization.layout.spacing}px</Label>
                  <Slider
                    value={[customization.layout.spacing]}
                    onValueChange={([value]) =>
                      updateCustomization({
                        layout: { ...customization.layout, spacing: value },
                      })
                    }
                    min={4}
                    max={32}
                    step={2}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Border Radius: {customization.layout.borderRadius}px</Label>
                  <Slider
                    value={[customization.layout.borderRadius]}
                    onValueChange={([value]) =>
                      updateCustomization({
                        layout: { ...customization.layout, borderRadius: value },
                      })
                    }
                    min={0}
                    max={24}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Max Width: {customization.layout.maxWidth}px</Label>
                  <Slider
                    value={[customization.layout.maxWidth]}
                    onValueChange={([value]) =>
                      updateCustomization({
                        layout: { ...customization.layout, maxWidth: value },
                      })
                    }
                    min={800}
                    max={1600}
                    step={50}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Padding: {customization.layout.padding}px</Label>
                  <Slider
                    value={[customization.layout.padding]}
                    onValueChange={([value]) =>
                      updateCustomization({
                        layout: { ...customization.layout, padding: value },
                      })
                    }
                    min={8}
                    max={64}
                    step={4}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Elements Tab */}
        <TabsContent value="elements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Element Visibility & Dimensions</CardTitle>
              <CardDescription>
                Control which elements are displayed and their sizes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Show Header</Label>
                    <Switch
                      checked={customization.elements.showHeader}
                      onCheckedChange={(checked) =>
                        updateCustomization({
                          elements: { ...customization.elements, showHeader: checked },
                        })
                      }
                    />
                  </div>

                  {customization.elements.showHeader && (
                    <div>
                      <Label>Header Height: {customization.elements.headerHeight}px</Label>
                      <Slider
                        value={[customization.elements.headerHeight]}
                        onValueChange={([value]) =>
                          updateCustomization({
                            elements: { ...customization.elements, headerHeight: value },
                          })
                        }
                        min={32}
                        max={128}
                        step={8}
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Show Footer</Label>
                    <Switch
                      checked={customization.elements.showFooter}
                      onCheckedChange={(checked) =>
                        updateCustomization({
                          elements: { ...customization.elements, showFooter: checked },
                        })
                      }
                    />
                  </div>

                  {customization.elements.showFooter && (
                    <div>
                      <Label>Footer Height: {customization.elements.footerHeight}px</Label>
                      <Slider
                        value={[customization.elements.footerHeight]}
                        onValueChange={([value]) =>
                          updateCustomization({
                            elements: { ...customization.elements, footerHeight: value },
                          })
                        }
                        min={32}
                        max={128}
                        step={8}
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label>Show Sidebar</Label>
                  <Switch
                    checked={customization.elements.showSidebar}
                    onCheckedChange={(checked) =>
                      updateCustomization({
                        elements: { ...customization.elements, showSidebar: checked },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Code Tab */}
        <TabsContent value="code" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Code</CardTitle>
              <CardDescription>Add custom CSS and JavaScript to your template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>{t("dashboard.templates.customization.code.css")}</Label>
                <Textarea
                  value={customization.customCSS}
                  onChange={(e) => updateCustomization({ customCSS: e.target.value })}
                  placeholder="Enter your custom CSS here..."
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <div>
                <Label>{t("dashboard.templates.customization.code.javascript")}</Label>
                <Textarea
                  value={customization.customJS}
                  onChange={(e) => updateCustomization({ customJS: e.target.value })}
                  placeholder="Enter your custom JavaScript here..."
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
              <CardDescription>See how your customizations look in the template</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 min-h-[400px]" style={previewStyles.container}>
                {customization.elements.showHeader && (
                  <div className="mb-6 border-b" style={previewStyles.header}>
                    <h1 style={previewStyles.heading}>Header</h1>
                  </div>
                )}

                <div className="space-y-4">
                  <h2 style={previewStyles.subheading}>Sample Heading</h2>

                  <p style={previewStyles.body}>
                    This is sample body text to demonstrate your typography settings. The quick
                    brown fox jumps over the lazy dog.
                  </p>

                  <div className="p-4 rounded" style={previewStyles.accentBox}>
                    <p style={previewStyles.smallText}>Small text example</p>
                  </div>

                  <Button
                    style={{
                      backgroundColor: customization.colors.accent,
                      borderRadius: `${customization.layout.borderRadius}px`,
                    }}
                  >
                    Sample Button
                  </Button>
                </div>

                {customization.elements.showFooter && (
                  <div className="mt-6 border-t pt-4" style={previewStyles.footer}>
                    <p style={previewStyles.footerText}>Footer Content</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
