"use client";

import React, { useState, FormEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textArea";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import type { TemplateCategory } from "@/generated/prisma";
import { toastNotification } from "@/lib/toastNotifications";

export default function CategoriesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TemplateCategory | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  const {
    data: categories,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const response = await fetch("/api/admin/templates/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      slug: string;
      description?: string;
      icon?: string;
      color?: string;
    }) => {
      const response = await fetch("/api/admin/templates/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create category");
      }
      return response.json();
    },
    onSuccess: () => {
      refetch();
      setIsCreateOpen(false);
      toastNotification.success("Category created successfully");
    },
    onError: (error) => {
      toastNotification.error("Failed to create category: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TemplateCategory> }) => {
      const response = await fetch(`/api/admin/templates/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update category");
      }
      return response.json();
    },
    onSuccess: () => {
      refetch();
      setEditingCategory(null);
      toastNotification.success("Category updated successfully");
    },
    onError: (error) => {
      toastNotification.error("Failed to update category: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/templates/categories/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete category");
      }
      return response.json();
    },
    onSuccess: () => {
      refetch();
      toastNotification.success("Category deleted successfully");
    },
    onError: (error) => {
      toastNotification.error("Failed to delete category: " + error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Template Categories</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="dark:text-white">Create Category</DialogTitle>
            </DialogHeader>
            <CategoryForm
              onSubmit={(data) => createMutation.mutate(data)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="dark:text-white">Icon</TableHead>
              <TableHead className="dark:text-white">Name</TableHead>
              <TableHead className="dark:text-white">Slug</TableHead>
              <TableHead className="dark:text-white">Description</TableHead>
              <TableHead className="dark:text-white">Color</TableHead>
              <TableHead className="dark:text-white">Templates</TableHead>
              <TableHead className="dark:text-white">Status</TableHead>
              <TableHead className="dark:text-white">Order</TableHead>
              <TableHead className="dark:text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map((category: TemplateCategory) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div className="w-8 h-8 rounded flex items-center justify-center bg-gray-100">
                    <span className="text-sm">{category.icon || "★"}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium dark:text-white">{category.name}</TableCell>
                <TableCell className="dark:text-white">
                  <Badge variant="secondary">{category.slug}</Badge>
                </TableCell>
                <TableCell className="dark:text-white max-w-xs truncate">
                  {category.description || "-"}
                </TableCell>
                <TableCell>
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: category.color || "transparent" }}
                    aria-hidden
                  />
                </TableCell>
                <TableCell className="dark:text-white">{category.templates?.length || 0}</TableCell>
                <TableCell>
                  <Switch
                    checked={category.isActive}
                    onCheckedChange={(checked) =>
                      updateMutation.mutate({ id: category.id, data: { isActive: checked } })
                    }
                  />
                </TableCell>
                <TableCell className="dark:text-white">{category.displayOrder}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingCategory(category)}>
                      <Edit className="w-4 h-4 dark:text-white" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteCategoryId(category.id)}
                    >
                      <Trash2 className="w-4 h-4 dark:text-white" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingCategory && (
        <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="dark:text-white">Edit Category</DialogTitle>
            </DialogHeader>
            <CategoryForm
              initialData={editingCategory}
              onSubmit={(data) => updateMutation.mutate({ id: editingCategory.id, data })}
              isLoading={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      {deleteCategoryId && (
        <Dialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="dark:text-white">Confirm Delete</DialogTitle>
            </DialogHeader>
            <div className="p-2 dark:text-white">
              {`Are you sure you want to delete the category "${categories?.find((c) => c.id === deleteCategoryId)?.name}"?`}
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                className="dark:text-white"
                onClick={() => setDeleteCategoryId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteCategoryId) deleteMutation.mutate(deleteCategoryId);
                  setDeleteCategoryId(null);
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

interface CategoryFormData {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  displayOrder?: number;
}

interface CategoryFormProps {
  initialData?: Partial<CategoryFormData> | Partial<TemplateCategory>;
  onSubmit: (data: CategoryFormData) => void;
  isLoading?: boolean;
}

function CategoryForm({ initialData, onSubmit, isLoading }: CategoryFormProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: initialData?.name ?? "",
    slug: initialData?.slug ?? "",
    description: initialData?.description ?? "",
    icon: initialData?.icon ?? "",
    color: initialData?.color ?? "",
    displayOrder: initialData?.displayOrder ?? 0,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-white">Name</label>
        <Input
          value={formData.name}
          onChange={(e) => handleNameChange(e.target.value)}
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

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-white">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-white">Icon</label>
          <Input
            value={formData.icon}
            onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
            placeholder="e.g., heart, star"
            className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 dark:text-white">Color</label>
          <Input
            value={formData.color}
            onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
            placeholder="e.g., #3b82f6"
            className="dark:bg-gray-800 dark:text-white dark:border-gray-600"
          />
        </div>
      </div>

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

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : "Save Category"}
      </Button>
    </form>
  );
}
