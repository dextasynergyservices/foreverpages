"use client";

import React, { Suspense, lazy, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Palette,
  Plus,
  Trash2,
  Edit,
  Eye,
  Copy,
  AlertCircle,
  RefreshCw,
  FileText,
  Settings,
  TrendingUp,
  ShoppingCart,
  ExternalLink,
  Calendar,
  Users,
} from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useBaseTemplates, BaseTemplate } from "@/hooks/useBaseTemplates";
import { useUserTemplates, UserTemplate } from "@/hooks/useUserTemplates";
import { useTranslations } from "@/hooks/useTranslations";
import { DeleteMemorialModal } from "../pageBuilder/DeleteMemorialModal";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";
import {
  sanitizeInput,
  validateTemplateName,
  validateTemplateDescription,
} from "@/utils/templateSecurity";
import toast from "react-hot-toast";

const TemplateMarketplace = lazy(() =>
  import("@/components/userDashboard/templates/TemplateMarketplace").then((module) => ({
    default: module.TemplateMarketplace,
  }))
);
const TemplateAnalytics = lazy(() =>
  import("./TemplateAnalytics").then((module) => ({ default: module.TemplateAnalytics }))
);
const AdvancedCustomization = lazy(() =>
  import("./AdvancedCustomization").then((module) => ({ default: module.AdvancedCustomization }))
);

interface Memorial {
  id: string;
  firstName: string;
  lastName: string;
  slug: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  views?: number;
  expiresAt?: string | null;
}

const TemplatesTab = () => {
  const { t } = useTranslations();
  const queryClient = useQueryClient();
  const router = useRouter();

  // UI State
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteMemorialModal, setShowDeleteMemorialModal] = useState(false);

  const [selectedMemorial, setSelectedMemorial] = useState<Memorial | null>(null);
  const [selectedBaseTemplate, setSelectedBaseTemplate] = useState<BaseTemplate | null>(null);

  // Form state
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");

  // Fetch memorials
  const { data: memorialsData, isLoading: isLoadingMemorials } = useQuery<{
    ownedMemorials: Memorial[];
  }>({
    queryKey: ["memorials"],
    queryFn: async () => {
      const response = await fetch("/api/user/memorials");
      if (!response.ok) throw new Error("Failed to fetch memorials");
      return response.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch user templates
  const {
    data: userTemplates = [],
    isLoading: isLoadingUserTemplates,
    error: userTemplatesError,
  } = useUserTemplates();

  // Fetch base templates
  const {
    data: baseTemplates = [],
    isLoading: isLoadingBaseTemplates,
    error: baseTemplatesError,
  } = useBaseTemplates();

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; baseTemplateId: string }) => {
      const response = await fetch("/api/user/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create template");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success(t("dashboard.templates.createSuccess"));
      setShowCreateDialog(false);
      setTemplateName("");
      setTemplateDescription("");
      setSelectedBaseTemplate(null);
      queryClient.invalidateQueries({ queryKey: ["user-templates"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("dashboard.templates.createError"));
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await fetch(`/api/user/templates/${templateId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete template");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success(t("dashboard.templates.deleteSuccess"));
      queryClient.invalidateQueries({ queryKey: ["user-templates"] });
    },
    onError: (error: Error) => {
      toast.error(String(error.message || t("dashboard.templates.deleteError")));
    },
  });

  const handleCreateTemplate = () => {
    const nameValidation = validateTemplateName(templateName);
    if (!nameValidation.isValid) {
      toast.error(
        String(t(`dashboard.templates.validation.${nameValidation.error}`) || nameValidation.error)
      );
      return;
    }

    const descriptionValidation = validateTemplateDescription(templateDescription);
    if (!descriptionValidation.isValid) {
      toast.error(
        String(
          t(`dashboard.templates.validation.${descriptionValidation.error}`) ||
            descriptionValidation.error
        )
      );
      return;
    }

    if (!selectedBaseTemplate) {
      toast.error(t("dashboard.templates.validationError"));
      return;
    }

    const sanitizedName = sanitizeInput(templateName);
    const sanitizedDescription = sanitizeInput(templateDescription);

    createTemplateMutation.mutate({
      name: sanitizedName,
      description: sanitizedDescription || undefined,
      baseTemplateId: selectedBaseTemplate.id,
    });
  };

  const { confirm: confirmDeleteTemplate, dialog: deleteTemplateDialog } = useConfirmDialog();

  const handleDeleteTemplate = (template: UserTemplate) => {
    confirmDeleteTemplate({
      title: t("dashboard.templates.delete.confirmTitle", {}, "Delete Template?"),
      description: t(
        "dashboard.templates.delete.confirmDescription",
        { name: template.name },
        `Are you sure you want to delete "${template.name}"? This action cannot be undone.`
      ),
      confirmText: deleteTemplateMutation.isPending
        ? t("dashboard.templates.deleteDialog.deleting", {}, "Deleting...")
        : t("dashboard.templates.delete.confirm", {}, "Delete"),
      cancelText: t("common.cancel", {}, "Cancel"),
      variant: "danger",
      disabled: deleteTemplateMutation.isPending,
      onConfirm: () => {
        deleteTemplateMutation.mutate(template.id);
      },
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleViewLive = (slug: string) => {
    window.open(`${process.env.NEXT_PUBLIC_APP_URL || ""}/${slug}`, "_blank");
  };

  const handleEditMemorial = (memorialId: string) => {
    router.push(`/dashboard/create-memorial?edit=${memorialId}`);
  };

  const handleDeleteMemorial = (memorial: Memorial) => {
    setSelectedMemorial(memorial);
    setShowDeleteMemorialModal(true);
  };

  // Map templates with their memorials
  const templatesWithMemorials = userTemplates.map((template) => {
    const memorial = memorialsData?.ownedMemorials.find(
      (m) => m.id === template.id || template.name.includes(m.firstName)
    );
    return { ...template, memorial };
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="my-templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="my-templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t("dashboard.templates.tabs.myTemplates")}
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            {t("dashboard.templates.tabs.marketplace")}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t("dashboard.templates.tabs.analytics")}
          </TabsTrigger>
          <TabsTrigger value="customization" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t("dashboard.templates.tabs.customization")}
          </TabsTrigger>
        </TabsList>

        {/* My Templates Tab */}
        <TabsContent value="my-templates" className="space-y-6">
          {/* Header Section */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 flex-shrink-0" />
                    <span>{t("dashboard.templates.title")}</span>
                  </CardTitle>
                  <CardDescription>{t("dashboard.templates.subtitle")}</CardDescription>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto flex-shrink-0">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">
                        {t("dashboard.templates.createButton")}
                      </span>
                      <span className="sm:hidden">
                        {t("dashboard.templates.createButtonShort")}
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>{t("dashboard.templates.createDialog.title")}</DialogTitle>
                      <DialogDescription>
                        {t("dashboard.templates.createDialog.description")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="template-name">
                          {t("dashboard.templates.form.name.label")} *
                        </Label>
                        <Input
                          id="template-name"
                          placeholder={t("dashboard.templates.form.name.placeholder")}
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="template-description">
                          {t("dashboard.templates.form.description.label")}
                        </Label>
                        <Textarea
                          id="template-description"
                          placeholder={t("dashboard.templates.form.description.placeholder")}
                          rows={3}
                          value={templateDescription}
                          onChange={(e) => setTemplateDescription(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>{t("dashboard.templates.form.baseTemplate.label")} *</Label>
                        <div className="grid grid-cols-1 gap-2 mt-2 max-h-48 overflow-y-auto">
                          {isLoadingBaseTemplates ? (
                            <div className="space-y-2">
                              {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                              ))}
                            </div>
                          ) : baseTemplatesError ? (
                            <div className="text-center py-4 text-sm text-muted-foreground">
                              {t("dashboard.templates.failedToLoadBaseTemplates")}
                            </div>
                          ) : (
                            baseTemplates.map((template) => (
                              <div
                                key={template.id}
                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                  selectedBaseTemplate?.id === template.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                }`}
                                onClick={() => setSelectedBaseTemplate(template)}
                              >
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-muted-foreground" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{template.name}</p>
                                    {template.description && (
                                      <p className="text-sm text-muted-foreground truncate">
                                        {template.description}
                                      </p>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {template.category?.name || "General"}
                                  </Badge>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowCreateDialog(false);
                            setTemplateName("");
                            setTemplateDescription("");
                            setSelectedBaseTemplate(null);
                          }}
                          className="w-full sm:w-auto"
                        >
                          {t("common.cancel")}
                        </Button>
                        <Button
                          onClick={handleCreateTemplate}
                          disabled={createTemplateMutation.isPending || !selectedBaseTemplate}
                          className="w-full sm:w-auto"
                        >
                          {createTemplateMutation.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              {t("dashboard.templates.form.creating")}
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              {t("dashboard.templates.createButton")}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
          </Card>

          {/* User Templates List */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("dashboard.templates.list.title", { count: userTemplates.length })}
              </CardTitle>
              <CardDescription>{t("dashboard.templates.list.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUserTemplates ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : userTemplatesError ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive opacity-70" />
                  <h3 className="text-lg font-semibold mb-2">
                    {t("dashboard.templates.error.title")}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {userTemplatesError instanceof Error
                      ? userTemplatesError.message
                      : t("common.unknownError")}
                  </p>
                  <Button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["user-templates"] })}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t("common.retry")}
                  </Button>
                </div>
              ) : userTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <Palette className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    {t("dashboard.templates.empty.title")}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {t("dashboard.templates.empty.description")}
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)} variant="default" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("dashboard.templates.empty.createButton")}
                  </Button>
                </div>
              ) : isLoadingMemorials ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {templatesWithMemorials.map((template) => {
                    const memorial = memorialsData?.ownedMemorials.find(
                      (m) =>
                        m.firstName &&
                        m.lastName &&
                        template.name.toLowerCase().includes(m.firstName.toLowerCase()) &&
                        template.name.toLowerCase().includes(m.lastName.toLowerCase())
                    );

                    const isPublished = !!memorial?.isPublished;
                    const memorialUrl = memorial?.slug
                      ? `${process.env.NEXT_PUBLIC_APP_URL || ""}/${memorial.slug}`
                      : "";

                    return (
                      <Card key={template.id} className="border">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0 space-y-3">
                              {/* Header with name and status */}
                              <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold truncate">{template.name}</h3>
                                    {isPublished ? (
                                      memorial.expiresAt &&
                                      new Date(memorial.expiresAt) < new Date() ? (
                                        <Badge variant="destructive">
                                          {t("dashboard.templates.status.expired", {}, "Expired")}
                                        </Badge>
                                      ) : (
                                        <Badge variant="default" className="bg-green-600">
                                          {t("dashboard.templates.status.live", {}, "Live")}
                                        </Badge>
                                      )
                                    ) : (
                                      <Badge variant="secondary">
                                        {t("dashboard.templates.status.draft", {}, "Draft")}
                                      </Badge>
                                    )}
                                  </div>
                                  {template.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {template.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Memorial info for published templates */}
                              {isPublished && memorial && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <ExternalLink className="h-4 w-4 flex-shrink-0" />
                                    <a
                                      href={memorialUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="truncate hover:text-primary hover:underline"
                                    >
                                      {memorial.slug}
                                    </a>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(memorialUrl);
                                        toast.success(
                                          t(
                                            "dashboard.pageBuilder.publish.urlCopied",
                                            {},
                                            "URL copied!"
                                          )
                                        );
                                      }}
                                      className="p-1 hover:bg-accent rounded transition-colors"
                                      title="Copy URL"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                  </div>
                                  {memorial.views !== undefined && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Users className="h-4 w-4 flex-shrink-0" />
                                      <span>
                                        {memorial.views}{" "}
                                        {t("dashboard.templates.views", {}, "views")}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Dates */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {t("dashboard.templates.created", {}, "Created")}{" "}
                                    {formatDate(template.createdAt)}
                                  </span>
                                </div>
                                {template.updatedAt !== template.createdAt && (
                                  <span>
                                    {t("dashboard.templates.updated", {}, "Updated")}{" "}
                                    {formatDate(template.updatedAt)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                              {isPublished && memorial ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewLive(memorial.slug)}
                                    title={t(
                                      "dashboard.templates.actions.viewLive",
                                      {},
                                      "View Live"
                                    )}
                                  >
                                    <Eye className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">
                                      {t("dashboard.templates.actions.viewLive", {}, "View Live")}
                                    </span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditMemorial(memorial.id)}
                                    title={t("dashboard.templates.actions.edit", {}, "Edit")}
                                  >
                                    <Edit className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">
                                      {t("dashboard.templates.actions.edit", {}, "Edit")}
                                    </span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteMemorial(memorial)}
                                    title={t("dashboard.templates.actions.delete", {}, "Delete")}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/create-memorial?template=${template.id}`
                                      )
                                    }
                                    title={t(
                                      "dashboard.templates.actions.continue",
                                      {},
                                      "Continue Editing"
                                    )}
                                  >
                                    <Edit className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">
                                      {t("dashboard.templates.actions.continue", {}, "Continue")}
                                    </span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteTemplate(template)}
                                    disabled={deleteTemplateMutation.isPending}
                                    title={t(
                                      "dashboard.templates.actions.deleteDraft",
                                      {},
                                      "Delete Draft"
                                    )}
                                  >
                                    {deleteTemplateMutation.isPending ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace">
          <Suspense
            fallback={
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading marketplace...</span>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <TemplateMarketplace />
          </Suspense>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Suspense
            fallback={
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading analytics...</span>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <TemplateAnalytics />
          </Suspense>
        </TabsContent>

        {/* Customization Tab */}
        <TabsContent value="customization">
          <Suspense
            fallback={
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading customization...</span>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <AdvancedCustomization />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Delete Memorial Modal */}
      {selectedMemorial && (
        <DeleteMemorialModal
          isOpen={showDeleteMemorialModal}
          onClose={() => {
            setShowDeleteMemorialModal(false);
            setSelectedMemorial(null);
          }}
          memorialId={selectedMemorial.id}
          memorialName={`${selectedMemorial.firstName} ${selectedMemorial.lastName}`}
          memorialUrl={`${process.env.NEXT_PUBLIC_APP_URL || ""}/${selectedMemorial.slug}`}
          firstName={selectedMemorial.firstName}
          lastName={selectedMemorial.lastName}
        />
      )}

      {/* Confirmation Dialogs */}
      {deleteTemplateDialog}
    </div>
  );
};

export default TemplatesTab;
