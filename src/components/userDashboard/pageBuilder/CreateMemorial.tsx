"use client";

import React, { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";
import { useAvailableTemplates } from "@/hooks/useAvailableTemplates";
import { useUserPublishedStatus } from "@/hooks/useUserPublishedStatus";
import { useSubscription } from "@/hooks/useSubscription";
import {
  useActiveUserTemplate,
  useDeleteUserTemplate,
  useCreateUserTemplate,
  useUserTemplate,
} from "@/hooks/useUserTemplate";
import { useMemorialAutoSave } from "@/hooks/useMemorialAutoSave";
import { Header } from "./Header";
import { ProgressSteps } from "./ProgressSteps";
import { StepContent } from "./StepContent";
import { NavigationButtons } from "./NavigationButtons";
import { SubscriptionBanner } from "./SubscriptionBanner";
import { DesignTokens } from "./TemplateCustomizer";
import { SectionData } from "./DynamicSectionRenderer";
import { useUpdateUserTemplate } from "@/hooks/useUserTemplate";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { MediaPicker } from "./MediaPicker";
import { UserUpload } from "@/hooks/useUserUploads";

const CreateMemorial = () => {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const editTemplateId = searchParams.get("edit");
  const isEditMode = !!editTemplateId;

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedTemplateSlug, setSelectedTemplateSlug] = useState(""); // Add template slug state
  const [designTokens, setDesignTokens] = useState<DesignTokens | undefined>();
  const [sectionData, setSectionData] = useState<SectionData>({});
  const [memorialBasicInfo, setMemorialBasicInfo] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    deathDate: "",
    biography: "",
    profilePhoto: "",
  });
  interface BuilderTemplate {
    id: string;
    name: string;
    slug: string; // Add slug to interface
    description: string;
    preview: string;
    features: string[];
  }

  // Hooks for subscription-aware templates and published status
  const {
    data: availableData,
    isLoading: isLoadingTemplates,
    isPending: isPendingTemplates,
  } = useAvailableTemplates();
  const {
    data: publishedData,
    isLoading: isLoadingPublished,
    isPending: isPendingPublished,
  } = useUserPublishedStatus();
  const { data: subscriptionResponse } = useSubscription();

  // Active user template (single-selection constraint)
  const { data: activeTemplate, isLoading: isLoadingActiveTemplate } = useActiveUserTemplate();
  const { data: editTemplate, isLoading: isLoadingEditTemplate } = useUserTemplate(
    isEditMode ? editTemplateId : null
  );
  const deleteTemplateMutation = useDeleteUserTemplate();
  const { confirm: confirmDeleteTemplate, dialog: deleteTemplateDialog } = useConfirmDialog();
  const createTemplateMutation = useCreateUserTemplate();
  const currentTemplate = isEditMode ? editTemplate : activeTemplate;
  const updateTemplateMutation = useUpdateUserTemplate(currentTemplate?.id || "");

  // Debug current template state
  console.log("Debug CreateMemorial - currentTemplate:", {
    isEditMode,
    editTemplate: editTemplate?.id,
    activeTemplate: activeTemplate?.id,
    currentTemplateId: currentTemplate?.id,
    isLoadingActive: isLoadingActiveTemplate,
    isLoadingEdit: isLoadingEditTemplate,
  });

  // Check if we're loading template data
  const isLoadingCurrentTemplate = isEditMode ? isLoadingEditTemplate : isLoadingActiveTemplate;

  // Extract subscription details from response.data
  const subscriptionStatus = subscriptionResponse?.data?.status || "ACTIVE";
  const daysRemaining = subscriptionResponse?.data?.daysRemaining;
  const expiresAt = subscriptionResponse?.data?.subscription?.expiresAt;
  const isSubscriptionExpired = subscriptionStatus === "EXPIRED";
  const isInGracePeriod = subscriptionStatus === "GRACE_PERIOD";

  const [dbTemplates, setDbTemplates] = useState<BuilderTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const router = useRouter();
  const { status: sessionStatus } = useSession();

  // Auto-save for published memorials in edit mode
  const { autoSave } = useMemorialAutoSave({
    userTemplateId: currentTemplate?.id,
    memorialSlug: publishedData?.publishedMemorial?.slug,
    enabled: true,
    isEditMode,
    isPublished: currentTemplate?.isPublished,
    debounceMs: 2000,
  });

  // Track unsaved changes (disabled for published memorials with auto-save)
  useUnsavedChanges({
    hasUnsavedChanges: hasUnsavedChanges && !(isEditMode && currentTemplate?.isPublished),
    message: t(
      "dashboard.pageBuilder.unsavedChanges.message",
      {},
      "You have unsaved changes. Are you sure you want to leave?"
    ),
  });

  // Pre-fill form data when editing existing template
  useEffect(() => {
    if (isEditMode && editTemplate) {
      // Set template selection
      setSelectedTemplate(editTemplate.baseTemplateId);

      // Set template slug from baseTemplate
      if (editTemplate.baseTemplate?.slug) {
        setSelectedTemplateSlug(editTemplate.baseTemplate.slug);
      }

      // Set design tokens
      if (editTemplate.customization) {
        setDesignTokens(editTemplate.customization as unknown as DesignTokens);
      }

      // Set section data
      if (editTemplate.sections) {
        setSectionData(editTemplate.sections as unknown as SectionData);
      }

      // Set memorial basic info if memorial exists
      if (editTemplate.memorials && editTemplate.memorials.length > 0) {
        const memorial = editTemplate.memorials[0];
        // Note: We would need to fetch full memorial data to get birthDate, deathDate, etc.
        // For now, we set what's available
        setMemorialBasicInfo({
          firstName: memorial.firstName || "",
          lastName: memorial.lastName || "",
          birthDate: "",
          deathDate: "",
          biography: "",
          profilePhoto: "",
        });
      }
    }
  }, [isEditMode, editTemplate]);

  // Load templates from database filtered by user's plan
  useEffect(() => {
    let mounted = true;

    async function loadTemplates() {
      setTemplatesLoading(true);
      try {
        const res = await fetch(`/api/user/subscription/available-templates`);
        if (res.status === 401) {
          if (!mounted) return;
          setTemplatesError("Unauthorized");
          setDbTemplates([]);
          setTemplatesLoading(false);
          return;
        }

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to load templates");
        }

        const body = await res.json();
        const data = body?.data?.templates ?? [];
        if (!mounted) return;

        // Map database templates to builder template shape
        const mapped = (data as Array<Record<string, unknown>>).map((t) => {
          const id = String(t["id"] ?? "");
          const name = String(t["name"] ?? "");
          const slug = String(t["slug"] ?? ""); // Add slug extraction
          const description = String(t["description"] ?? "");
          const preview = String(t["previewImage"] ?? t["thumbnailImage"] ?? "");
          const supportedSections = (t["supportedSections"] as string[]) ?? [];
          const category = (t["category"] as Record<string, unknown>)?.name ?? "General";
          return {
            id,
            name,
            slug, // Include slug in the template object
            description,
            preview,
            features: supportedSections.length > 0 ? supportedSections : [String(category)],
          } as BuilderTemplate;
        });

        setDbTemplates(mapped);
        setTemplatesError(null);
      } catch (err) {
        console.error("Failed to load templates", err);
        if (!mounted) return;
        setDbTemplates([]);
        const message = err instanceof Error ? err.message : String(err);
        setTemplatesError(message ?? "Failed to load templates");
      } finally {
        if (mounted) setTemplatesLoading(false);
      }
    }

    loadTemplates();
    return () => {
      mounted = false;
    };
  }, []);

  // Load section data from active template
  useEffect(() => {
    // Set selectedTemplate from activeTemplate for navigation
    if (currentTemplate && !selectedTemplate) {
      setSelectedTemplate(currentTemplate.baseTemplateId);

      // Set the template slug from baseTemplate
      if (currentTemplate.baseTemplate?.slug) {
        setSelectedTemplateSlug(currentTemplate.baseTemplate.slug);
      }
    }

    // Load sections from server if they exist
    if (currentTemplate?.sections && Object.keys(currentTemplate.sections).length > 0) {
      setSectionData(currentTemplate.sections as SectionData);
    } else if (
      currentTemplate?.baseTemplate?.supportedSections &&
      currentTemplate.baseTemplate.supportedSections.length > 0 &&
      Object.keys(sectionData).length === 0
    ) {
      // Initialize empty section data for supported sections
      const initialSectionData: SectionData = {};
      const supportedSections = currentTemplate.baseTemplate.supportedSections;

      supportedSections.forEach((section) => {
        switch (section) {
          case "HERO":
            initialSectionData.HERO = {
              title:
                `${memorialBasicInfo.firstName || ""} ${memorialBasicInfo.lastName || ""}`.trim() ||
                "Memorial Title",
              subtitle: "In Loving Memory",
              mainImage: memorialBasicInfo.profilePhoto || "",
              quote: "Forever in our hearts",
              birthDate: memorialBasicInfo.birthDate || "",
              deathDate: memorialBasicInfo.deathDate || "",
            };
            break;
          case "BIOGRAPHY":
            initialSectionData.BIOGRAPHY = {
              fullStory:
                memorialBasicInfo.biography ||
                "Share the life story and memories of this special person. Add details about their childhood, career, family, hobbies, and the impact they had on others.",
            };
            break;
          case "GALLERY":
            initialSectionData.GALLERY = {
              items: [],
              layout: "grid",
            };
            break;
          case "TIMELINE":
            initialSectionData.TIMELINE = {
              events: [
                {
                  id: "1",
                  date: memorialBasicInfo.birthDate || "1950-01-01",
                  title: "Born",
                  description: `${memorialBasicInfo.firstName || "They"} entered this world`,
                },
                {
                  id: "2",
                  date: memorialBasicInfo.deathDate || "2023-12-31",
                  title: "Passed Away",
                  description: "Left us with beautiful memories",
                },
              ],
            };
            break;
          case "TRIBUTES":
            initialSectionData.TRIBUTES = {
              tributes: [],
              allowPublicTributes: true,
            };
            break;
          case "CONDOLENCES":
            initialSectionData.CONDOLENCES = {
              condolences: [],
              allowPublicCondolences: true,
              requireApproval: false,
            };
            break;
          case "VIRTUAL_CANDLES":
            initialSectionData.VIRTUAL_CANDLES = {
              candles: [],
              allowPublic: true,
            };
            break;
          case "ACHIEVEMENTS":
            initialSectionData.ACHIEVEMENTS = {
              achievements: [],
            };
            break;
          case "FAMILY_TREE":
            initialSectionData.FAMILY_TREE = {
              members: [],
              layout: "tree",
              showPhotos: true,
              showDates: true,
            };
            break;
          case "MEMORIES":
            initialSectionData.MEMORIES = {
              memories: [],
              allowPublicSubmissions: true,
              requireApproval: false,
              categories: [],
            };
            break;
          case "STORIES":
            initialSectionData.STORIES = {
              stories: [],
              allowPublicSubmissions: true,
              requireApproval: false,
              showAuthor: true,
            };
            break;
          case "MILITARY_SERVICE":
            initialSectionData.MILITARY_SERVICE = {
              service: { branch: "", rank: "", yearsOfService: "" },
              showOnMemorial: true,
              displayFormat: "detailed",
            };
            break;
          case "EDUCATION_CAREER":
            initialSectionData.EDUCATION_CAREER = {
              education: [],
              career: [],
              showEducation: true,
              showCareer: true,
            };
            break;
          case "MAP_LOCATIONS":
            initialSectionData.MAP_LOCATIONS = {
              locations: [],
              zoomLevel: 10,
              showDirections: true,
            };
            break;
          case "DOCUMENTS":
            initialSectionData.DOCUMENTS = {
              documents: [],
              allowPublicUploads: true,
              requireApproval: false,
              maxFileSize: 10,
              allowedFileTypes: ["pdf", "doc", "docx", "jpg", "png"],
            };
            break;
          case "AUDIO_MEMORIES":
            initialSectionData.AUDIO_MEMORIES = {
              audioMemories: [],
              allowPublicUploads: true,
              requireApproval: false,
              maxFileSize: 10,
              allowedFormats: ["mp3", "wav", "m4a"],
            };
            break;
          default:
            // Initialize other sections with basic structure
            initialSectionData[section] = {
              title: section
                .replace("_", " ")
                .toLowerCase()
                .replace(/\b\w/g, (l) => l.toUpperCase()),
              items: [],
            };
        }
      });
      setSectionData(initialSectionData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTemplate,
    currentTemplate,
    isLoadingCurrentTemplate,
    selectedTemplate,
    memorialBasicInfo,
    // Note: sectionData is intentionally excluded to prevent circular dependency
  ]);

  // Use only database templates (no hardcoded fallbacks)
  const templates = dbTemplates;

  // If user is not authenticated, show sign-in CTA (do not expose templates to the public)
  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t("dashboard.pageBuilder.mustSignInTitle", {}, "Please sign in")}
        </h2>
        <p className="mb-6">
          {t(
            "dashboard.pageBuilder.mustSignInMessage",
            {},
            "You must sign in to access templates and the Funeral Builder."
          )}
        </p>
        <button
          onClick={() =>
            signIn(undefined, {
              callbackUrl:
                typeof window !== "undefined"
                  ? window.location.href
                  : "/user-dashboard?section=funeral-builder",
            })
          }
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg"
        >
          {t("dashboard.pageBuilder.marketplace.signIn", {}, "Sign in")}
        </button>
      </div>
    );
  }

  // Handle delete active template
  const handleDeleteActiveTemplate = () => {
    if (!activeTemplate?.id) return;

    confirmDeleteTemplate({
      title: t("memorial.create.deleteTemplate.confirmTitle", {}, "Delete Template?"),
      description: t(
        "memorial.create.deleteTemplate.confirmDescription",
        { name: activeTemplate.baseTemplate?.name || "this template" },
        `Are you sure you want to delete "${activeTemplate.baseTemplate?.name || "this template"}"? This will allow you to select a new template, but any customizations will be lost.`
      ),
      confirmText: deleteTemplateMutation.isPending
        ? t("memorial.create.deleteTemplate.deleting", {}, "Deleting...")
        : t("memorial.create.deleteTemplate.confirm", {}, "Delete Template"),
      cancelText: t("common.cancel", {}, "Cancel"),
      variant: "danger",
      disabled: deleteTemplateMutation.isPending,
      onConfirm: async () => {
        try {
          await deleteTemplateMutation.mutateAsync(activeTemplate.id);
          toast.success(
            t("memorial.create.deleteTemplate.success", {}, "Template deleted successfully")
          );
        } catch (error) {
          console.error("Failed to delete template:", error);
          toast.error(t("memorial.create.deleteTemplate.error", {}, "Failed to delete template"));
        }
      },
    });
  };

  // Handle template selection - create UserTemplate
  const handleTemplateSelect = async (templateId: string) => {
    try {
      // Find the selected template to get its defaultConfig
      const selectedBaseTemplate = templates.find((t) => t.id === templateId);
      const templateSlug = selectedBaseTemplate?.slug || "";

      console.log("Template selected:", {
        templateId,
        templateSlug,
        template: selectedBaseTemplate,
      });

      // Initialize default sections based on supportedSections
      const initialSections: Record<string, unknown> = {};
      if (selectedBaseTemplate?.features) {
        const supportedSections = selectedBaseTemplate.features;
        supportedSections.forEach((section) => {
          switch (section) {
            case "HERO":
              initialSections["HERO"] = {
                title:
                  `${memorialBasicInfo.firstName || ""} ${memorialBasicInfo.lastName || ""}`.trim() ||
                  "Memorial Title",
                subtitle: "In Loving Memory",
                mainImage: memorialBasicInfo.profilePhoto || "",
                quote: "Forever in our hearts",
                birthDate: memorialBasicInfo.birthDate || "",
                deathDate: memorialBasicInfo.deathDate || "",
              };
              break;
            case "BIOGRAPHY":
              initialSections["BIOGRAPHY"] = {
                fullStory:
                  memorialBasicInfo.biography ||
                  "Share the life story and memories of this special person.",
              };
              break;
            case "GALLERY":
              initialSections["GALLERY"] = {
                items: [],
                layout: "grid",
              };
              break;
            case "TIMELINE":
              initialSections["TIMELINE"] = {
                events: [
                  {
                    id: "1",
                    date: memorialBasicInfo.birthDate || "1950-01-01",
                    title: "Born",
                    description: `${memorialBasicInfo.firstName || "They"} entered this world`,
                  },
                  {
                    id: "2",
                    date: memorialBasicInfo.deathDate || "2023-12-31",
                    title: "Passed Away",
                    description: "Left us with beautiful memories",
                  },
                ],
              };
              break;
            case "TRIBUTES":
              initialSections["TRIBUTES"] = {
                tributes: [],
                allowPublicTributes: true,
              };
              break;
            case "CONDOLENCES":
              initialSections["CONDOLENCES"] = {
                condolences: [],
                allowPublicCondolences: true,
                requireApproval: false,
              };
              break;
            case "VIRTUAL_CANDLES":
              initialSections["VIRTUAL_CANDLES"] = {
                candles: [],
                allowPublic: true,
              };
              break;
            case "ACHIEVEMENTS":
              initialSections["ACHIEVEMENTS"] = {
                achievements: [],
              };
              break;
            case "FAMILY_TREE":
              initialSections["FAMILY_TREE"] = {
                members: [],
                layout: "tree",
                showPhotos: true,
                showDates: true,
              };
              break;
            case "MEMORIES":
              initialSections["MEMORIES"] = {
                memories: [],
                allowPublicSubmissions: true,
                requireApproval: false,
                categories: [],
              };
              break;
            case "STORIES":
              initialSections["STORIES"] = {
                stories: [],
                allowPublicSubmissions: true,
                requireApproval: false,
                showAuthor: true,
              };
              break;
            case "MILITARY_SERVICE":
              initialSections["MILITARY_SERVICE"] = {
                service: { branch: "", rank: "", yearsOfService: "" },
                showOnMemorial: true,
                displayFormat: "detailed",
              };
              break;
            case "EDUCATION_CAREER":
              initialSections["EDUCATION_CAREER"] = {
                education: [],
                career: [],
                showEducation: true,
                showCareer: true,
              };
              break;
            case "MAP_LOCATIONS":
              initialSections["MAP_LOCATIONS"] = {
                locations: [],
                zoomLevel: 10,
                showDirections: true,
              };
              break;
            case "DOCUMENTS":
              initialSections["DOCUMENTS"] = {
                documents: [],
                allowPublicUploads: true,
                requireApproval: false,
                maxFileSize: 10,
                allowedFileTypes: ["pdf", "doc", "docx", "jpg", "png"],
              };
              break;
            case "AUDIO_MEMORIES":
              initialSections["AUDIO_MEMORIES"] = {
                audioMemories: [],
                allowPublicUploads: true,
                requireApproval: false,
                maxFileSize: 10,
                allowedFormats: ["mp3", "wav", "m4a"],
              };
              break;
            default:
              initialSections[section] = {
                items: [],
              };
          }
        });
      }

      // Create the template with sections included
      const newTemplate = await createTemplateMutation.mutateAsync({
        baseTemplateId: templateId,
        name: templates.find((t) => t.id === templateId)?.name || "My Template",
        sections: initialSections, // Pass sections directly to create
      });

      // Update the local state immediately so UI responds
      setSelectedTemplate(templateId);
      setSelectedTemplateSlug(templateSlug); // Store the slug
      setSectionData(initialSections as SectionData);

      // Force invalidation and wait for refetch to get the new template
      await queryClient.invalidateQueries({ queryKey: ["user-template"] });
      await queryClient.invalidateQueries({ queryKey: ["user-template", "active"] });

      // Give a moment for the cache to update, then refetch
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["user-template", "active"] });
      }, 100);

      console.log("Template created with sections:", {
        templateId,
        templateSlug,
        newTemplateId: newTemplate?.id,
        sections: Object.keys(initialSections),
        sectionData: initialSections,
      });
      toast.success("Template selected and initialized");
    } catch (error: unknown) {
      console.error("Failed to create template:", error);
      // Check for 409 conflict (active template exists)
      const err = error as { response?: { status?: number } };
      if (err?.response?.status === 409) {
        toast.error("You already have an active template. Please delete it first.");
      } else {
        toast.error("Failed to select template");
      }
    }
  };

  // Handle design tokens change with auto-save for published memorials
  const handleDesignTokensChange = async (tokens: DesignTokens) => {
    setDesignTokens(tokens);
    setHasUnsavedChanges(true);

    // Auto-save for published memorials in edit mode
    if (isEditMode && currentTemplate?.isPublished) {
      autoSave({ customization: tokens as unknown as Record<string, unknown> });
    } else if (currentTemplate?.id) {
      // Regular save for unpublished templates
      try {
        await updateTemplateMutation.mutateAsync({
          customization: tokens as unknown as Record<string, unknown>,
        });
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("Failed to save design tokens:", error);
      }
    }
  };

  // Handle memorial data change with auto-save for published memorials
  const handleMemorialDataChange = (
    data:
      | Partial<{
          firstName?: string;
          lastName?: string;
          birthYear?: number;
          deathYear?: number;
          biography?: string;
          birthDate?: string;
          deathDate?: string;
          profilePhoto?: string;
        }>
      | undefined
  ) => {
    console.log("DEBUG: handleMemorialDataChange called with:", data);

    // Return early if no data provided
    if (!data) return;

    setMemorialBasicInfo((prev) => {
      const updated = { ...prev, ...data };
      console.log("DEBUG: Updated memorialBasicInfo:", updated);

      // Auto-save for published memorials in edit mode
      if (isEditMode && currentTemplate?.isPublished) {
        autoSave({ memorialData: updated });
      }

      return updated;
    });
  };

  // Handle section data change - save to UserTemplate
  const handleSectionDataChange = async (section: string, data: unknown) => {
    console.log(
      "CreateMemorial: handleSectionDataChange called - section:",
      section,
      "data:",
      data
    );
    const updatedSectionData = { ...sectionData, [section]: data };
    console.log("CreateMemorial: Updated section data:", updatedSectionData);
    setSectionData(updatedSectionData);
    setHasUnsavedChanges(true);

    // Auto-save for published memorials in edit mode
    if (isEditMode && currentTemplate?.isPublished) {
      autoSave({ sections: updatedSectionData });
    } else if (currentTemplate?.id) {
      // Regular save for unpublished templates
      try {
        await updateTemplateMutation.mutateAsync({
          sections: updatedSectionData,
        });
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("Failed to save section data:", error);
      }
    }
  };

  // Handle publish success
  const handlePublishSuccess = (url: string) => {
    toast.success(
      isEditMode ? "Memorial updated successfully!" : "Memorial published successfully!"
    );
    router.push(url);
  };

  // Handle media picker
  const handleOpenMediaPicker = () => {
    setIsMediaPickerOpen(true);
  };

  const handleMediaSelect = (selectedMedia: UserUpload[]) => {
    // Get the first selected media item
    if (selectedMedia.length > 0) {
      const mediaUrl = selectedMedia[0].url;

      // Update the hero main image if that section exists
      if (sectionData.HERO) {
        handleSectionDataChange("HERO", {
          ...sectionData.HERO,
          mainImage: mediaUrl,
        });
      }
      setIsMediaPickerOpen(false);
      toast.success("Image added successfully!");
    }
  };

  // Get existing slug if editing
  const existingSlug = (isEditMode && editTemplate?.memorials?.[0]?.slug) || "";

  const steps = [
    {
      title: t("dashboard.pageBuilder.steps.chooseTemplate.title", {}, "Select Template"),
      description: t(
        "dashboard.pageBuilder.steps.chooseTemplate.description",
        {},
        "Choose a template design that fits your vision"
      ),
    },
    {
      title: t("dashboard.pageBuilder.steps.editTemplate.title", {}, "Edit Template"),
      description: t(
        "dashboard.pageBuilder.steps.editTemplate.description",
        {},
        "Customize colors, content, and sections"
      ),
    },
    {
      title: t("dashboard.pageBuilder.steps.review.title", {}, "Review & Publish"),
      description: t(
        "dashboard.pageBuilder.steps.review.description",
        {},
        "Review and publish your memorial page"
      ),
    },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Memorial creation is now handled by PublishModal in ReviewStep
  const createMemorial = async () => {
    // This function is no longer used - publishing happens via PublishModal
    console.log("Memorial creation handled by PublishModal");
  };

  // Create a wrapper for the t function to match component expectations
  const tWrapper = (key: string, params?: unknown, fallback?: string): string => {
    return t(key, params as Record<string, string | number> | undefined, fallback);
  };

  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      <Header />

      {/* Active template banner */}
      {activeTemplate && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
          <div
            className={`border rounded-lg p-4 mb-4 ${
              theme === "dark"
                ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
                : "border-yellow-500/50 bg-yellow-50 text-yellow-800"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Active Template</h4>
                <p className="text-sm opacity-90">
                  You have an active template:{" "}
                  <strong>{activeTemplate.baseTemplate?.name || "Unnamed"}</strong>
                </p>
                <p className="text-xs opacity-75 mt-1">
                  You can only have one active template at a time. Delete this to select a new one.
                </p>
              </div>
              <button
                onClick={handleDeleteActiveTemplate}
                disabled={deleteTemplateMutation.isPending}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  theme === "dark"
                    ? "bg-red-500/20 hover:bg-red-500/30 text-red-200"
                    : "bg-red-100 hover:bg-red-200 text-red-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {deleteTemplateMutation.isPending && (
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
                )}
                {deleteTemplateMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar - hidden on mobile, shown on large screens */}
          <aside className="hidden lg:block lg:col-span-3">
            <div
              className={`sticky top-20 border rounded-lg p-4 ${theme === "dark" ? "border-white/10 bg-black" : "border-gray-200 bg-white"}`}
            >
              <h3 className="text-sm font-semibold mb-3">
                {t("dashboard.pageBuilder.sidebar.title", {}, "Build steps")}
              </h3>
              <ProgressSteps steps={steps} currentStep={currentStep} t={tWrapper} vertical />

              <div
                className={`mt-6 text-sm ${theme === "dark" ? "text-white/70" : "text-gray-600"}`}
              >
                <p className="mb-2">
                  {t("dashboard.pageBuilder.sidebar.hint1", {}, "Tip: save frequently")}
                </p>
                <p>
                  {t(
                    "dashboard.pageBuilder.sidebar.hint2",
                    {},
                    "Tip: preview on different devices"
                  )}
                </p>
              </div>
            </div>
          </aside>

          {/* Main canvas */}
          <main className="lg:col-span-9">
            {/* Mobile progress indicator */}
            <div className="lg:hidden mb-6">
              <ProgressSteps
                steps={steps}
                currentStep={currentStep}
                t={tWrapper}
                vertical={false}
              />
            </div>

            <div
              className={`border rounded-lg p-4 md:p-6 shadow-sm ${theme === "dark" ? "border-white/10 bg-black" : "border-gray-200 bg-white"}`}
            >
              {/* Display subscription banner if in grace period or expired */}
              {(isInGracePeriod || isSubscriptionExpired) && (
                <div className="mb-6">
                  <SubscriptionBanner
                    status={subscriptionStatus}
                    alertLevel={isSubscriptionExpired ? "error" : "warning"}
                    daysRemaining={daysRemaining}
                    expiresAt={expiresAt}
                    onRenewClick={() => {
                      toast.success(
                        t(
                          "subscription.renewalRedirect",
                          {},
                          "Redirecting to subscription renewal..."
                        )
                      );
                      router.push("/user-dashboard?section=subscription");
                    }}
                  />
                </div>
              )}

              {/* Show loading state while templates and published status are being fetched */}
              {(templatesLoading ||
                isLoadingTemplates ||
                isPendingTemplates ||
                isLoadingPublished ||
                isPendingPublished) &&
              currentStep === 0 ? (
                <div className="p-6 text-center">
                  <p className={`${theme === "dark" ? "text-white/70" : "text-gray-600"}`}>
                    {t("dashboard.pageBuilder.loadingTemplates", {}, "Loading templates...")}
                  </p>
                </div>
              ) : templatesError === "Unauthorized" ? (
                <div className="p-6 text-center">
                  <p className="mb-4">
                    {t(
                      "dashboard.pageBuilder.marketplace.signinNeeded",
                      {},
                      "Sign in to access additional templates"
                    )}
                  </p>
                  <button
                    onClick={() => signIn(undefined, { callbackUrl: window.location.href })}
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg"
                  >
                    {t("dashboard.pageBuilder.marketplace.signIn", {}, "Sign in")}
                  </button>
                </div>
              ) : templatesError && currentStep === 0 ? (
                <div className="p-6 text-center">
                  <p className="mb-4 text-red-600 dark:text-red-400 font-semibold">
                    Failed to load templates: {templatesError}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg"
                  >
                    Retry
                  </button>
                </div>
              ) : templates.length === 0 && currentStep === 0 ? (
                <div className="p-6 text-center">
                  <p className="mb-4 font-semibold">
                    {t(
                      "dashboard.pageBuilder.noTemplates",
                      {},
                      "No templates available for your plan. Please contact support or upgrade your subscription."
                    )}
                  </p>
                  <button
                    onClick={() => router.push("/user-dashboard?section=subscription")}
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg"
                  >
                    View Plans
                  </button>
                </div>
              ) : isSubscriptionExpired ? (
                <div className="p-6 text-center">
                  <p className="mb-4 font-semibold">
                    {t(
                      "subscription.createMemorialExpired",
                      {},
                      "Your subscription has expired. Please renew to create a new memorial."
                    )}
                  </p>
                  <button
                    onClick={() => router.push("/user-dashboard?section=subscription")}
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg"
                  >
                    {t("subscription.renew", {}, "Renew Subscription")}
                  </button>
                </div>
              ) : (
                <StepContent
                  currentStep={currentStep}
                  selectedTemplate={selectedTemplate}
                  selectedTemplateSlug={selectedTemplateSlug} // Pass the slug
                  setSelectedTemplate={handleTemplateSelect}
                  templates={templates}
                  t={tWrapper}
                  availableTemplates={availableData?.templates}
                  subscription={availableData?.subscription}
                  userHasPublished={publishedData?.hasPublished}
                  designTokens={designTokens}
                  onDesignTokensChange={handleDesignTokensChange}
                  hasActiveTemplate={!!currentTemplate}
                  supportedSections={
                    // Get sections from the base template definition (what sections this template supports)
                    currentTemplate?.baseTemplate?.supportedSections || []
                  }
                  sectionData={sectionData}
                  onSectionDataChange={handleSectionDataChange}
                  isEditMode={isEditMode}
                  userTemplateId={currentTemplate?.id}
                  existingSlug={existingSlug}
                  onPublishSuccess={handlePublishSuccess}
                  memorialData={memorialBasicInfo}
                  onMemorialDataChange={handleMemorialDataChange}
                  daysRemaining={daysRemaining}
                  isLoadingTemplate={isLoadingCurrentTemplate}
                  onOpenMediaPicker={handleOpenMediaPicker}
                  userTemplate={currentTemplate || undefined}
                  // Debug log
                  {...(() => {
                    console.log(
                      "Debug - Passing userTemplateId to StepContent:",
                      currentTemplate?.id
                    );
                    return {};
                  })()}
                />
              )}

              <div className="mt-4">
                <NavigationButtons
                  currentStep={currentStep}
                  stepsLength={steps.length}
                  selectedTemplate={selectedTemplate}
                  onPrevStep={prevStep}
                  onNextStep={nextStep}
                  onCreateMemorial={createMemorial}
                  t={tWrapper}
                  isCreating={false}
                  userHasPublished={publishedData?.hasPublished}
                  subscriptionActive={
                    availableData?.subscription.status === "ACTIVE" ||
                    availableData?.subscription.status === "GRACE_PERIOD"
                  }
                  isSubscriptionExpired={isSubscriptionExpired}
                />
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Media Picker Modal */}
      <MediaPicker
        open={isMediaPickerOpen}
        onOpenChange={setIsMediaPickerOpen}
        onSelect={handleMediaSelect}
        allowMultiple={false}
        filterType={null}
      />

      {/* Confirmation Dialog */}
      {deleteTemplateDialog}
    </div>
  );
};

export default CreateMemorial;
