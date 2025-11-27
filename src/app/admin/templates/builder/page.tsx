"use client";

import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textArea";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Save,
  Eye,
  Smartphone,
  Monitor,
  Tablet,
  Plus,
  GripVertical,
  Trash2,
  Copy,
} from "lucide-react";
import { toastNotification } from "@/lib/toastNotifications";
import { Template, TemplateCategory, TemplateLayout } from "@/generated/prisma";
import Image from "next/image";

interface Section {
  id: string;
  type: string;
  config: Record<string, unknown>;
  enabled: boolean;
}

interface TemplateConfig {
  id: string;
  name: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
  };
  sections: Section[];
  layout: TemplateLayout;
}

const availableSections = [
  { id: "hero", name: "Hero Section", icon: "Image", category: "header" },
  { id: "biography", name: "Biography", icon: "User", category: "content" },
  { id: "gallery", name: "Photo Gallery", icon: "Images", category: "media" },
  { id: "timeline", name: "Timeline", icon: "Calendar", category: "content" },
  { id: "tributes", name: "Tributes", icon: "Heart", category: "social" },
  { id: "family-tree", name: "Family Tree", icon: "Users", category: "content" },
  { id: "guestbook", name: "Guest Book", icon: "Book", category: "social" },
];

export default function TemplateBuilderPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showPreview, setShowPreview] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: templates } = useQuery({
    queryKey: ["admin-templates"],
    queryFn: async () => {
      const response = await fetch("/api/admin/templates/templates");
      if (!response.ok) throw new Error("Failed to fetch templates");
      return response.json();
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const response = await fetch("/api/admin/templates/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const { data: plans } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const response = await fetch("/api/plans?all=true");
      if (!response.ok) throw new Error("Failed to fetch plans");
      const result = await response.json();
      return result.data || [];
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      slug: string;
      categoryId?: string;
      planIds?: string[];
      layoutType: TemplateLayout;
      description?: string;
    }) => {
      const defaultSections = getDefaultSectionsForLayout(data.layoutType);

      const response = await fetch("/api/admin/templates/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          categoryIds: data.categoryId ? [data.categoryId] : [],
          planIds: data.planIds ?? [],
          componentPath: "templates/modular/MemorialTemplate",
          previewImage: "/placeholder-template.png",
          thumbnailImage: "/placeholder-template.png",
          supportedSections: [],
          designTokens: {
            primaryColor: "#3b82f6",
            secondaryColor: "#64748b",
            backgroundColor: "#ffffff",
            textColor: "#1f2937",
            fontFamily: "Inter",
          },
          defaultConfig: defaultSections,
          navigationConfig: {},
          headerConfig: {},
          displayOrder: 0,
          isFeatured: false,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create template");
      }
      return response.json();
    },
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
      setShowCreateDialog(false);
      handleTemplateSelect(newTemplate);
      try {
        toastNotification.success("Template created successfully");
      } catch {
        // ignore
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to create template";
      try {
        toastNotification.error("Failed to create template: " + message);
      } catch {
        // ignore
      }
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleTemplateSelect = useCallback((template: Template) => {
    setSelectedTemplate(template);
    const tokens = template.designTokens as unknown as Partial<{
      primaryColor: string;
      secondaryColor: string;
      backgroundColor: string;
      textColor: string;
      fontFamily: string;
    }>;

    setTemplateConfig({
      id: template.id,
      name: template.name,
      theme: {
        primaryColor: tokens?.primaryColor ?? "#3b82f6",
        secondaryColor: tokens?.secondaryColor ?? "#64748b",
        backgroundColor: tokens?.backgroundColor ?? "#ffffff",
        textColor: tokens?.textColor ?? "#1f2937",
        fontFamily: tokens?.fontFamily ?? "Inter",
      },
      sections: Array.isArray(template.defaultConfig)
        ? (template.defaultConfig as unknown as Section[])
        : getDefaultSectionsForLayout(template.layoutType),
      layout: template.layoutType,
    });
  }, []);

  const getDefaultSectionsForLayout = (layoutType: TemplateLayout): Section[] => {
    const baseSections: Section[] = [
      {
        id: "hero-1",
        type: "hero",
        config: {},
        enabled: true,
      },
    ];

    switch (layoutType) {
      case TemplateLayout.SINGLE_COLUMN:
        return [
          ...baseSections,
          {
            id: "biography-1",
            type: "biography",
            config: {},
            enabled: true,
          },
          {
            id: "timeline-1",
            type: "timeline",
            config: {},
            enabled: true,
          },
          {
            id: "gallery-1",
            type: "gallery",
            config: {},
            enabled: true,
          },
          {
            id: "tributes-1",
            type: "tributes",
            config: {},
            enabled: true,
          },
        ];
      case TemplateLayout.TWO_COLUMN:
        return [
          ...baseSections,
          {
            id: "biography-1",
            type: "biography",
            config: {},
            enabled: true,
          },
          {
            id: "family-tree-1",
            type: "family-tree",
            config: {},
            enabled: true,
          },
          {
            id: "timeline-1",
            type: "timeline",
            config: {},
            enabled: true,
          },
          {
            id: "gallery-1",
            type: "gallery",
            config: {},
            enabled: true,
          },
        ];
      case TemplateLayout.GRID:
        return [
          ...baseSections,
          {
            id: "biography-1",
            type: "biography",
            config: {},
            enabled: true,
          },
          {
            id: "gallery-1",
            type: "gallery",
            config: {},
            enabled: true,
          },
          {
            id: "tributes-1",
            type: "tributes",
            config: {},
            enabled: true,
          },
          {
            id: "guestbook-1",
            type: "guestbook",
            config: {},
            enabled: true,
          },
        ];
      default:
        return [
          ...baseSections,
          {
            id: "biography-1",
            type: "biography",
            config: {},
            enabled: true,
          },
          {
            id: "timeline-1",
            type: "timeline",
            config: {},
            enabled: true,
          },
          {
            id: "gallery-1",
            type: "gallery",
            config: {},
            enabled: true,
          },
        ];
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTemplateConfig((prev) => {
        if (!prev) return prev;

        const oldIndex = prev.sections.findIndex((section) => section.id === active.id);
        const newIndex = prev.sections.findIndex((section) => section.id === over.id);

        return {
          ...prev,
          sections: arrayMove(prev.sections, oldIndex, newIndex),
        };
      });
    }
  };

  const addSection = (sectionType: string) => {
    const newSection: Section = {
      id: `${sectionType}-${Date.now()}`,
      type: sectionType,
      config: {},
      enabled: true,
    };

    setTemplateConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: [...prev.sections, newSection],
      };
    });
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setTemplateConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((section) =>
          section.id === sectionId ? { ...section, ...updates } : section
        ),
      };
    });
  };

  const removeSection = (sectionId: string) => {
    setTemplateConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.filter((section) => section.id !== sectionId),
      };
    });
  };

  const duplicateSection = (sectionId: string) => {
    setTemplateConfig((prev) => {
      if (!prev) return prev;
      const sectionToDuplicate = prev.sections.find((s) => s.id === sectionId);
      if (!sectionToDuplicate) return prev;

      const duplicatedSection: Section = {
        ...sectionToDuplicate,
        id: `${sectionToDuplicate.type}-${Date.now()}`,
      };

      return {
        ...prev,
        sections: [...prev.sections, duplicatedSection],
      };
    });
  };

  const saveTemplate = useMutation({
    mutationFn: async () => {
      if (!templateConfig || !selectedTemplate) return;

      const response = await fetch(`/api/admin/templates/templates/${selectedTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designTokens: templateConfig.theme,
          defaultConfig: templateConfig.sections,
          layoutType: templateConfig.layout,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save template");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
      try {
        toastNotification.success("Template saved successfully");
      } catch {
        // swallow toast errors so mutation still succeeds
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to save template";
      try {
        toastNotification.error("Failed to save template: " + message);
      } catch {
        // ignore
      }
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/templates/templates/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete template");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
      try {
        toastNotification.success("Template deleted");
      } catch {
        // ignore
      }
      setSelectedTemplate(null);
      setTemplateConfig(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to delete template";
      try {
        toastNotification.error("Failed to delete template: " + message);
      } catch {
        // ignore
      }
    },
  });

  if (!templates) {
    return (
      <div className="p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Template Builder</h1>
          <p className="text-gray-600 dark:text-white">Create and customize memorial templates</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? "Hide" : "Show"} Preview
          </Button>
          <Button onClick={() => saveTemplate.mutate()} disabled={saveTemplate.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {saveTemplate.isPending ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {!selectedTemplate ? (
          <div className="flex-1 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold dark:text-white">Choose a Template to Edit</h2>
                <p className="text-gray-600 dark:text-white">
                  Select an existing template or create a new one
                </p>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="dark:text-white">Create New Template</DialogTitle>
                  </DialogHeader>
                  <CreateTemplateForm
                    categories={categories || []}
                    plans={plans || []}
                    onSubmit={(data) => createTemplateMutation.mutate(data)}
                    isLoading={createTemplateMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template: Template & { category?: TemplateCategory }) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-gray-100 rounded mb-4 overflow-hidden">
                      <Image
                        src={template.previewImage}
                        alt={template.name}
                        width={400}
                        height={225}
                        className="w-full h-full object-cover"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.src = "/placeholder-template.png";
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-white mb-2">
                      {template.description}
                    </p>
                    <Badge variant="secondary">{template.category?.name || "No Category"}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="w-80 border-r bg-gray-50 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold dark:text-white">Template Settings</h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(null);
                        setTemplateConfig(null);
                      }}
                    >
                      Back
                    </Button>
                    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="dark:text-white">Confirm Delete</DialogTitle>
                        </DialogHeader>
                        <div className="p-2 dark:text-white">
                          {`Are you sure you want to delete the template "${selectedTemplate?.name}"?`}
                        </div>
                        <div className="flex justify-end space-x-2 mt-4">
                          <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={async () => {
                              if (!selectedTemplate) return;
                              try {
                                await deleteTemplateMutation.mutateAsync(selectedTemplate.id);
                                setShowDeleteDialog(false);
                              } catch (err) {
                                // error handled by onError
                                console.error("Delete failed:", err);
                              }
                            }}
                            disabled={deleteTemplateMutation.isPending}
                          >
                            {deleteTemplateMutation.isPending ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <Tabs defaultValue="sections" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="sections">Sections</TabsTrigger>
                    <TabsTrigger value="theme">Theme</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>

                  <TabsContent value="sections" className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 dark:text-white">Available Sections</h4>
                      <div className="space-y-2">
                        {availableSections.map((section) => (
                          <Button
                            key={section.id}
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => addSection(section.id)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {section.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2 dark:text-white">Current Sections</h4>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={
                            Array.isArray(templateConfig?.sections)
                              ? templateConfig.sections.map((s) => s.id)
                              : []
                          }
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {Array.isArray(templateConfig?.sections) &&
                              templateConfig.sections.map((section) => (
                                <SortableSection
                                  key={section.id}
                                  section={section}
                                  onUpdate={updateSection}
                                  onRemove={removeSection}
                                  onDuplicate={duplicateSection}
                                />
                              ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  </TabsContent>

                  <TabsContent value="theme" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="primaryColor" className="dark:text-white">
                          Primary Color
                        </Label>
                        <Input
                          id="primaryColor"
                          type="color"
                          value={templateConfig?.theme.primaryColor ?? "#3b82f6"}
                          onChange={(e) =>
                            setTemplateConfig((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    theme: { ...prev.theme, primaryColor: e.target.value },
                                  }
                                : prev
                            )
                          }
                          className="dark:bg-gray-800 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="secondaryColor" className="dark:text-white">
                          Secondary Color
                        </Label>
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={templateConfig?.theme.secondaryColor ?? "#64748b"}
                          onChange={(e) =>
                            setTemplateConfig((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    theme: { ...prev.theme, secondaryColor: e.target.value },
                                  }
                                : prev
                            )
                          }
                          className="dark:bg-gray-800 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="backgroundColor" className="dark:text-white">
                          Background Color
                        </Label>
                        <Input
                          id="backgroundColor"
                          type="color"
                          value={templateConfig?.theme.backgroundColor ?? "#ffffff"}
                          onChange={(e) =>
                            setTemplateConfig((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    theme: { ...prev.theme, backgroundColor: e.target.value },
                                  }
                                : prev
                            )
                          }
                          className="dark:bg-gray-800 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="textColor" className="dark:text-white">
                          Text Color
                        </Label>
                        <Input
                          id="textColor"
                          type="color"
                          value={templateConfig?.theme.textColor ?? "#1f2937"}
                          onChange={(e) =>
                            setTemplateConfig((prev) =>
                              prev
                                ? { ...prev, theme: { ...prev.theme, textColor: e.target.value } }
                                : prev
                            )
                          }
                          className="dark:bg-gray-800 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="fontFamily" className="dark:text-white">
                          Font Family
                        </Label>
                        <Select
                          value={templateConfig?.theme.fontFamily ?? "Inter"}
                          onValueChange={(value) =>
                            setTemplateConfig((prev) =>
                              prev ? { ...prev, theme: { ...prev.theme, fontFamily: value } } : prev
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Open Sans">Open Sans</SelectItem>
                            <SelectItem value="Lato">Lato</SelectItem>
                            <SelectItem value="Poppins">Poppins</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4">
                    <div>
                      <Label htmlFor="layout" className="dark:text-white">
                        Layout Type
                      </Label>
                      <Select
                        value={templateConfig?.layout ?? TemplateLayout.FLEXIBLE}
                        onValueChange={(value: TemplateLayout) =>
                          setTemplateConfig((prev) => (prev ? { ...prev, layout: value } : prev))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TemplateLayout.SINGLE_COLUMN}>
                            Single Column
                          </SelectItem>
                          <SelectItem value={TemplateLayout.TWO_COLUMN}>Two Column</SelectItem>
                          <SelectItem value={TemplateLayout.GRID}>Grid</SelectItem>
                          <SelectItem value={TemplateLayout.FLEXIBLE}>Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              {showPreview && (
                <div className="border-b p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={previewMode === "desktop" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewMode("desktop")}
                    >
                      <Monitor className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={previewMode === "tablet" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewMode("tablet")}
                    >
                      <Tablet className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={previewMode === "mobile" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewMode("mobile")}
                    >
                      <Smartphone className="w-4 h-4" />
                    </Button>
                  </div>
                  <Badge variant="outline">Preview Mode</Badge>
                </div>
              )}

              <div className="flex-1 overflow-auto">
                <div
                  className={`mx-auto transition-all duration-300 ${
                    showPreview
                      ? previewMode === "mobile"
                        ? "w-80 max-w-sm"
                        : previewMode === "tablet"
                          ? "w-96 max-w-md"
                          : "w-full max-w-4xl"
                      : "w-full"
                  }`}
                  style={{
                    fontFamily: templateConfig?.theme.fontFamily,
                    backgroundColor: templateConfig?.theme.backgroundColor,
                    color: templateConfig?.theme.textColor,
                  }}
                >
                  <div className="min-h-screen">
                    {Array.isArray(templateConfig?.sections) &&
                      templateConfig.sections
                        .filter((section) => section.enabled)
                        .map((section) => (
                          <div
                            key={section.id}
                            className="border-b border-gray-200 p-8"
                            style={{
                              backgroundColor: templateConfig.theme.backgroundColor,
                              color: templateConfig.theme.textColor,
                            }}
                          >
                            <div className="text-center">
                              <h3 className="text-xl font-semibold mb-4 capitalize">
                                {section.type.replace("-", " ")}
                              </h3>
                              <div className="bg-gray-100 p-4 rounded">
                                <p className="text-gray-600 dark:text-white">
                                  {section.type} section preview
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface CreateTemplateFormProps {
  categories: TemplateCategory[];
  plans?: { id: string; name: string }[];
  onSubmit: (data: {
    name: string;
    slug: string;
    categoryId?: string;
    layoutType: TemplateLayout;
    description?: string;
  }) => void;
  isLoading?: boolean;
}

function CreateTemplateForm({ categories, plans, onSubmit, isLoading }: CreateTemplateFormProps) {
  type FormState = {
    name: string;
    slug: string;
    categoryId: string;
    layoutType: TemplateLayout;
    description: string;
  };

  const [formData, setFormData] = useState<FormState>({
    name: "",
    slug: "",
    categoryId: "none",
    layoutType: TemplateLayout.FLEXIBLE,
    description: "",
  });
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      categoryId: formData.categoryId === "none" ? undefined : formData.categoryId,
      planIds: selectedPlanIds,
    };
    onSubmit(submitData);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const getDefaultSections = (layoutType: TemplateLayout) => {
    const baseSections = [{ id: "hero", type: "hero" }];

    switch (layoutType) {
      case TemplateLayout.SINGLE_COLUMN:
        return [
          ...baseSections,
          { id: "biography", type: "biography" },
          { id: "timeline", type: "timeline" },
          { id: "gallery", type: "gallery" },
          { id: "tributes", type: "tributes" },
        ];
      case TemplateLayout.TWO_COLUMN:
        return [
          ...baseSections,
          { id: "biography", type: "biography" },
          { id: "family-tree", type: "family-tree" },
          { id: "timeline", type: "timeline" },
          { id: "gallery", type: "gallery" },
        ];
      case TemplateLayout.GRID:
        return [
          ...baseSections,
          { id: "biography", type: "biography" },
          { id: "gallery", type: "gallery" },
          { id: "tributes", type: "tributes" },
          { id: "guestbook", type: "guestbook" },
        ];
      default:
        return [
          ...baseSections,
          { id: "biography", type: "biography" },
          { id: "timeline", type: "timeline" },
          { id: "gallery", type: "gallery" },
        ];
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="templateName" className="dark:text-white">
          Template Name
        </Label>
        <Input
          id="templateName"
          value={formData.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g., Classic Memorial"
          required
          className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
        />
      </div>

      <div>
        <Label htmlFor="templateSlug" className="dark:text-white">
          Slug
        </Label>
        <Input
          id="templateSlug"
          value={formData.slug ?? ""}
          onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
          placeholder="e.g., classic-memorial"
          required
          className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
        />
      </div>

      <div>
        <Label htmlFor="templateCategory" className="dark:text-white">
          Category
        </Label>
        <Select
          value={formData.categoryId}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, categoryId: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Category</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="layoutType" className="dark:text-white">
          Layout Type
        </Label>
        <Select
          value={formData.layoutType ?? TemplateLayout.FLEXIBLE}
          onValueChange={(value: TemplateLayout) =>
            setFormData((prev) => ({ ...prev, layoutType: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TemplateLayout.SINGLE_COLUMN}>Single Column</SelectItem>
            <SelectItem value={TemplateLayout.TWO_COLUMN}>Two Column</SelectItem>
            <SelectItem value={TemplateLayout.GRID}>Grid Layout</SelectItem>
            <SelectItem value={TemplateLayout.FLEXIBLE}>Flexible</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="templateDescription" className="dark:text-white">
          Description (Optional)
        </Label>
        <Textarea
          id="templateDescription"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of the template"
          rows={3}
          className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
        />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-white mb-2">Default Sections</h4>
        <p className="text-sm text-blue-700 dark:text-white mb-2">
          This layout will include these default sections:
        </p>
        <div className="flex flex-wrap gap-2">
          {getDefaultSections(formData.layoutType).map((section) => (
            <Badge key={section.id} variant="secondary">
              {section.type.replace("-", " ")}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label className="block text-sm font-medium mb-1 dark:text-white">Plans</Label>
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-3">
          {(plans || []).map((plan) => (
            <label key={plan.id} className="flex items-center space-x-2 text-sm dark:text-white">
              <input
                type="checkbox"
                checked={selectedPlanIds.includes(plan.id)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSelectedPlanIds((prev) =>
                    checked ? [...prev, plan.id] : prev.filter((id) => id !== plan.id)
                  );
                }}
              />
              <span>{plan.name}</span>
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Creating..." : "Create Template"}
      </Button>
    </form>
  );
}

interface SortableSectionProps {
  section: Section;
  onUpdate: (sectionId: string, updates: Partial<Section>) => void;
  onRemove: (sectionId: string) => void;
  onDuplicate: (sectionId: string) => void;
}

function SortableSection({ section, onUpdate, onRemove, onDuplicate }: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-2 p-2 bg-white border rounded"
    >
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-medium capitalize">{section.type.replace("-", " ")}</span>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={() => onDuplicate(section.id)}>
              <Copy className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onRemove(section.id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      <Switch
        checked={section.enabled}
        onCheckedChange={(enabled) => onUpdate(section.id, { enabled })}
      />
    </div>
  );
}
