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
import { Header } from "./Header";
import { ProgressSteps } from "./ProgressSteps";
import { StepContent } from "./StepContent";
import { NavigationButtons } from "./NavigationButtons";
import { SubscriptionBanner } from "./SubscriptionBanner";
import { DesignTokens } from "./TemplateCustomizer";
import { SectionData } from "./DynamicSectionRenderer";
import { useUpdateUserTemplate } from "@/hooks/useUserTemplate";
import toast from "react-hot-toast";

const CreateMemorial = () => {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  const editTemplateId = searchParams.get("edit");
  const isEditMode = !!editTemplateId;

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState("");
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
  const { data: activeTemplate } = useActiveUserTemplate();
  const { data: editTemplate } = useUserTemplate(isEditMode ? editTemplateId : null);
  const deleteTemplateMutation = useDeleteUserTemplate();
  const createTemplateMutation = useCreateUserTemplate();
  const currentTemplate = isEditMode ? editTemplate : activeTemplate;
  const updateTemplateMutation = useUpdateUserTemplate(currentTemplate?.id || "");

  // Extract subscription details from response.data
  const subscriptionStatus = subscriptionResponse?.data?.status || "ACTIVE";
  const daysRemaining = subscriptionResponse?.data?.daysRemaining;
  const expiresAt = subscriptionResponse?.data?.subscription?.expiresAt;
  const isSubscriptionExpired = subscriptionStatus === "EXPIRED";
  const isInGracePeriod = subscriptionStatus === "GRACE_PERIOD";

  const [dbTemplates, setDbTemplates] = useState<BuilderTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const router = useRouter();
  const { status: sessionStatus } = useSession();

  // Pre-fill form data when editing existing template
  useEffect(() => {
    if (isEditMode && editTemplate) {
      // Set template selection
      setSelectedTemplate(editTemplate.baseTemplateId);

      // Set design tokens
      if (editTemplate.config) {
        setDesignTokens(editTemplate.config as unknown as DesignTokens);
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
          const description = String(t["description"] ?? "");
          const preview = String(t["previewImage"] ?? t["thumbnailImage"] ?? "");
          const supportedSections = (t["supportedSections"] as string[]) ?? [];
          const category = (t["category"] as Record<string, unknown>)?.name ?? "General";
          return {
            id,
            name,
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
    if (activeTemplate?.sections) {
      setSectionData(activeTemplate.sections as SectionData);
    }
  }, [activeTemplate]);

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
  const handleDeleteActiveTemplate = async () => {
    if (!activeTemplate?.id) return;

    try {
      await deleteTemplateMutation.mutateAsync(activeTemplate.id);
      toast.success("Template deleted successfully");
    } catch (error) {
      console.error("Failed to delete template:", error);
      toast.error("Failed to delete template");
    }
  };

  // Handle template selection - create UserTemplate
  const handleTemplateSelect = async (templateId: string) => {
    try {
      await createTemplateMutation.mutateAsync({
        baseTemplateId: templateId,
        name: templates.find((t) => t.id === templateId)?.name || "My Template",
      });
      setSelectedTemplate(templateId);
      toast.success("Template selected");
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

  // Handle section data change - save to UserTemplate
  const handleSectionDataChange = async (section: string, data: unknown) => {
    const updatedSectionData = { ...sectionData, [section]: data };
    setSectionData(updatedSectionData);

    // Auto-save to UserTemplate if current template exists
    if (currentTemplate?.id) {
      try {
        await updateTemplateMutation.mutateAsync({
          sections: updatedSectionData,
        });
      } catch (error) {
        console.error("Failed to save section data:", error);
        // Silent failure - we don't want to interrupt user's flow
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

  // Get existing slug if editing
  const existingSlug = (isEditMode && editTemplate?.memorials?.[0]?.slug) || "";

  const steps = [
    {
      title: t("dashboard.pageBuilder.steps.chooseTemplate.title", {}, "Choose Template"),
      description: t(
        "dashboard.pageBuilder.steps.chooseTemplate.description",
        {},
        "Select a design that honors your loved one"
      ),
    },
    {
      title: t("dashboard.pageBuilder.steps.basicInfo.title", {}, "Basic Information"),
      description: t(
        "dashboard.pageBuilder.steps.basicInfo.description",
        {},
        "Tell us about your loved one"
      ),
    },
    {
      title: t("dashboard.pageBuilder.steps.customize.title", {}, "Customize Design"),
      description: t(
        "dashboard.pageBuilder.steps.customize.description",
        {},
        "Personalize colors and layout"
      ),
    },
    {
      title: t("dashboard.pageBuilder.steps.details.title", {}, "Memorial Details"),
      description: t(
        "dashboard.pageBuilder.steps.details.description",
        {},
        "Add photos and memories"
      ),
    },
    {
      title: t("dashboard.pageBuilder.steps.review.title", {}, "Review"),
      description: t(
        "dashboard.pageBuilder.steps.review.description",
        {},
        "Review and create your memorial"
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
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  theme === "dark"
                    ? "bg-red-500/20 hover:bg-red-500/30 text-red-200"
                    : "bg-red-100 hover:bg-red-200 text-red-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
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
                  setSelectedTemplate={handleTemplateSelect}
                  templates={templates}
                  t={tWrapper}
                  availableTemplates={availableData?.templates}
                  subscription={availableData?.subscription}
                  userHasPublished={publishedData?.hasPublished}
                  designTokens={designTokens}
                  onDesignTokensChange={setDesignTokens}
                  hasActiveTemplate={!!currentTemplate}
                  supportedSections={currentTemplate?.baseTemplate?.supportedSections || []}
                  sectionData={sectionData}
                  onSectionDataChange={handleSectionDataChange}
                  isEditMode={isEditMode}
                  userTemplateId={currentTemplate?.id}
                  existingSlug={existingSlug}
                  onPublishSuccess={handlePublishSuccess}
                  memorialData={memorialBasicInfo}
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
    </div>
  );
};

export default CreateMemorial;
