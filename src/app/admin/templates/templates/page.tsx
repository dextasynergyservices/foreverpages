"use client";

import React, { useState, FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textArea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toastNotification } from "@/lib/toastNotifications";
import {
  Template,
  TemplateCategory,
  TemplateLayout,
  TemplateSectionType,
  PreviewMode,
} from "@/generated/prisma";
import { JsonValue } from "@prisma/client/runtime/library";

interface ExtendedTemplate extends Omit<Template, "categoryId" | "category"> {
  templateCategories?: Array<{
    categoryId: string;
    category: TemplateCategory;
  }>;
  plans?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  _count?: {
    userTemplates: number;
  };
}

interface Plan {
  id: string;
  name: string;
  slug: string;
}

export default function TemplatesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ExtendedTemplate | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery<ExtendedTemplate[]>({
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

  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const response = await fetch("/api/admin/templates/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create template");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
      setIsCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Template> }) => {
      const response = await fetch(`/api/admin/templates/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update template");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
      setEditingTemplate(null);
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/templates/${id}/publish`, {
        method: "POST",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to publish template");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-templates"] });
      try {
        toastNotification.success("Template published successfully");
      } catch {
        // ignore
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to publish template";
      try {
        toastNotification.error(message);
      } catch {
        // ignore
      }
    },
  });

  const deleteMutation = useMutation({
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
      setDeleteTemplateId(null);
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

  if (isLoading || !templates) {
    return (
      <div className="p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-900 dark:border-gray-100 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Templates</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Create Template</DialogTitle>
            </DialogHeader>
            <TemplateForm
              categories={categories || []}
              plans={plans || []}
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates?.map((template: ExtendedTemplate) => (
          <Card key={template.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                {template.processingStatus && (
                  <Badge
                    variant={
                      template.processingStatus === "PUBLISHED"
                        ? "default"
                        : template.processingStatus === "VALIDATED"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {template.processingStatus}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {template.processingStatus === "VALIDATED" && (
                  <Button
                    size="sm"
                    onClick={() => publishMutation.mutate(template.id)}
                    disabled={publishMutation.isPending}
                  >
                    Publish
                  </Button>
                )}
                <Switch
                  checked={template.isActive}
                  onCheckedChange={(checked) => {
                    updateMutation.mutate(
                      { id: template.id, data: { isActive: checked } },
                      {
                        onError: (error) => {
                          console.error("Failed to update template:", error);
                        },
                      }
                    );
                  }}
                />
                <Button variant="ghost" size="sm" onClick={() => setEditingTemplate(template)}>
                  <Edit className="w-4 h-4 dark:text-white" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteTemplateId(template.id)}>
                  <Trash2 className="w-4 h-4 dark:text-white" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-100 rounded mb-4 overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={template.previewImage}
                  alt={template.name}
                  className="w-full h-full object-cover"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.src = "/placeholder-template.png";
                  }}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-white mb-2">{template.description}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {template.templateCategories?.map((tc) => (
                  <Badge key={tc.categoryId} variant="secondary">
                    {tc.category.name}
                  </Badge>
                ))}
                {template.plans?.map((plan) => (
                  <Badge key={plan.id} variant="outline">
                    {plan.name}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-white">
                <span>Usage: {template._count?.userTemplates || 0}</span>
                <span>Order: {template.displayOrder}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Edit Template</DialogTitle>
            </DialogHeader>
            <TemplateForm
              categories={categories || []}
              plans={plans || []}
              initialData={editingTemplate}
              onSubmit={(data) => updateMutation.mutate({ id: editingTemplate.id, data })}
              isLoading={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
      {deleteTemplateId && (
        <Dialog open={!!deleteTemplateId} onOpenChange={() => setDeleteTemplateId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="dark:text-white">Confirm Delete</DialogTitle>
            </DialogHeader>
            <div className="p-2 dark:text-white">
              {`Are you sure you want to delete the template "${templates?.find((t: ExtendedTemplate) => t.id === deleteTemplateId)?.name}"?`}
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteTemplateId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!deleteTemplateId) return;
                  try {
                    await deleteMutation.mutateAsync(deleteTemplateId);
                    // onSuccess will clear deleteTemplateId and invalidate queries
                  } catch (err) {
                    // Already handled by onError, but keep console for debugging

                    console.error("Delete failed:", err);
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface TemplateFormData {
  name: string;
  slug: string;
  description?: string;
  categoryIds: string[];
  planIds: string[];
  componentPath: string;
  previewImage: string;
  thumbnailImage: string;
  layoutType: TemplateLayout;
  supportedSections: TemplateSectionType[];
  designTokens?: JsonValue;
  defaultConfig?: JsonValue;
  navigationConfig?: JsonValue;
  headerConfig?: JsonValue;
  displayOrder?: number;
  isFeatured?: boolean;
  previewMode?: PreviewMode;
}

interface TemplateFormProps {
  categories: TemplateCategory[];
  plans: Plan[];
  initialData?: Partial<TemplateFormData> | Partial<ExtendedTemplate>;
  onSubmit: (data: TemplateFormData) => void;
  isLoading?: boolean;
}

function TemplateForm({ categories, plans, initialData, onSubmit, isLoading }: TemplateFormProps) {
  const [formData, setFormData] = useState<TemplateFormData>({
    name: (initialData?.name as string) ?? "",
    slug: (initialData?.slug as string) ?? "",
    description: (initialData?.description as string) ?? "",
    categoryIds:
      (initialData as ExtendedTemplate)?.templateCategories?.map((tc) => tc.categoryId) ?? [],
    planIds: (initialData as ExtendedTemplate)?.plans?.map((p) => p.id) ?? [],
    componentPath: (initialData?.componentPath as string) ?? "",
    previewImage: (initialData?.previewImage as string) ?? "",
    thumbnailImage: (initialData?.thumbnailImage as string) ?? "",
    layoutType: (initialData?.layoutType as TemplateLayout) ?? TemplateLayout.FLEXIBLE,
    supportedSections: (initialData?.supportedSections as TemplateSectionType[]) ?? [],
    designTokens: (initialData?.designTokens as JsonValue) ?? {},
    defaultConfig: (initialData?.defaultConfig as JsonValue) ?? {},
    navigationConfig: (initialData?.navigationConfig as JsonValue) ?? {},
    headerConfig: (initialData?.headerConfig as JsonValue) ?? {},
    displayOrder: (initialData?.displayOrder as number) ?? 0,
    isFeatured: (initialData?.isFeatured as boolean) ?? false,
    previewMode: (initialData as Partial<TemplateFormData>)?.previewMode ?? PreviewMode.AUTO,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const sectionOptions: TemplateSectionType[] = [
    TemplateSectionType.HERO,
    TemplateSectionType.BIOGRAPHY,
    TemplateSectionType.GALLERY,
    TemplateSectionType.TIMELINE,
    TemplateSectionType.FAMILY_TREE,
    TemplateSectionType.TRIBUTES,
    TemplateSectionType.CONDOLENCES,
    TemplateSectionType.GUESTBOOK,
    TemplateSectionType.DONATIONS,
    TemplateSectionType.FUNERAL_INFO,
    TemplateSectionType.MEMORIES,
    TemplateSectionType.STORIES,
    TemplateSectionType.ACHIEVEMENTS,
    TemplateSectionType.MILITARY_SERVICE,
    TemplateSectionType.EDUCATION_CAREER,
    TemplateSectionType.PHOTO_ALBUM,
    TemplateSectionType.VIDEO_GALLERY,
    TemplateSectionType.AUDIO_MEMORIES,
    TemplateSectionType.DOCUMENTS,
    TemplateSectionType.VIRTUAL_CANDLES,
    TemplateSectionType.VIRTUAL_FLOWERS,
    TemplateSectionType.MAP_LOCATIONS,
    TemplateSectionType.TESTIMONIALS,
    TemplateSectionType.QUOTES,
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-white">Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
            className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 dark:text-white">Slug</label>
          <Input
            value={formData.slug}
            onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
            required
            className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-white">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-white">Categories</label>
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-3">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex items-center space-x-2 text-sm dark:text-white"
            >
              <input
                type="checkbox"
                checked={formData.categoryIds.includes(category.id)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData((prev) => ({
                    ...prev,
                    categoryIds: checked
                      ? [...prev.categoryIds, category.id]
                      : prev.categoryIds.filter((id) => id !== category.id),
                  }));
                }}
              />
              <span>{category.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-white">Plans</label>
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-3">
          {plans.map((plan) => (
            <label key={plan.id} className="flex items-center space-x-2 text-sm dark:text-white">
              <input
                type="checkbox"
                checked={formData.planIds.includes(plan.id)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData((prev) => ({
                    ...prev,
                    planIds: checked
                      ? [...prev.planIds, plan.id]
                      : prev.planIds.filter((id) => id !== plan.id),
                  }));
                }}
              />
              <span>{plan.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-white">Layout Type</label>
        <Select
          value={formData.layoutType}
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
            <SelectItem value={TemplateLayout.TWO_COLUMN_ASYMMETRICAL}>
              Two Column Asymmetrical
            </SelectItem>
            <SelectItem value={TemplateLayout.GRID}>Grid</SelectItem>
            <SelectItem value={TemplateLayout.MAGAZINE}>Magazine</SelectItem>
            <SelectItem value={TemplateLayout.TIMELINE_FOCUS}>Timeline Focus</SelectItem>
            <SelectItem value={TemplateLayout.STORY}>Story</SelectItem>
            <SelectItem value={TemplateLayout.FLEXIBLE}>Flexible</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-white">
            Preview Image URL
          </label>
          <Input
            value={formData.previewImage}
            onChange={(e) => setFormData((prev) => ({ ...prev, previewImage: e.target.value }))}
            required
            className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 dark:text-white">
            Thumbnail Image URL
          </label>
          <Input
            value={formData.thumbnailImage}
            onChange={(e) => setFormData((prev) => ({ ...prev, thumbnailImage: e.target.value }))}
            required
            className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-white">Component Path</label>
        <Input
          value={formData.componentPath}
          onChange={(e) => setFormData((prev) => ({ ...prev, componentPath: e.target.value }))}
          placeholder="e.g., templates/classic/MemorialTemplate"
          required
          className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-white">Preview Mode</label>
        <Select
          value={formData.previewMode as PreviewMode}
          onValueChange={(value: PreviewMode) =>
            setFormData((prev) => ({ ...prev, previewMode: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PreviewMode.AUTO}>Auto (use manifest)</SelectItem>
            <SelectItem value={PreviewMode.IFRAME}>Iframe (embed)</SelectItem>
            <SelectItem value={PreviewMode.STATIC}>Static (serve built HTML)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-white">Supported Sections</label>
        <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded p-3">
          {sectionOptions.map((section) => (
            <label key={section} className="flex items-center space-x-2 text-sm dark:text-white">
              <input
                type="checkbox"
                checked={formData.supportedSections.includes(section)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData((prev) => ({
                    ...prev,
                    supportedSections: checked
                      ? [...prev.supportedSections, section]
                      : prev.supportedSections.filter((s) => s !== section),
                  }));
                }}
              />
              <span>{section.replace("_", " ").toLowerCase()}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-white">Display Order</label>
          <Input
            type="number"
            value={formData.displayOrder}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))
            }
            className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
          />
        </div>

        <div className="flex items-center space-x-2 pt-6">
          <input
            type="checkbox"
            id="isFeatured"
            checked={formData.isFeatured}
            onChange={(e) => setFormData((prev) => ({ ...prev, isFeatured: e.target.checked }))}
          />
          <label htmlFor="isFeatured" className="text-sm font-medium dark:text-white">
            Featured Template
          </label>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : "Save Template"}
      </Button>
    </form>
  );
}
