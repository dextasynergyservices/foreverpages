"use client";

import React, { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";
import { Header } from "./Header";
import { ProgressSteps } from "./ProgressSteps";
import { StepContent } from "./StepContent";
import { NavigationButtons } from "./NavigationButtons";
import { useOfflineMemorials } from "@/hooks/useOfflineMemorials";
import { OfflineBanner, SyncProgress } from "@/components/ui/offline-indicator";

const CreateMemorial = () => {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const { createMemorial: createOfflineMemorial, isLoading: isCreating } = useOfflineMemorials();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  interface BuilderTemplate {
    id: string;
    name: string;
    description: string;
    preview: string;
    features: string[];
  }

  const [marketplaceTemplates, setMarketplaceTemplates] = useState<BuilderTemplate[] | null>(null);
  const [marketplaceError, setMarketplaceError] = useState<string | null>(null);
  const router = useRouter();
  const { status: sessionStatus } = useSession();

  const templates = [
    {
      id: "classic",
      name: t("dashboard.pageBuilder.templates.classic.name", {}, "Classic Memorial"),
      description: t(
        "dashboard.pageBuilder.templates.classic.description",
        {},
        "Traditional and elegant design with timeline and formal layout"
      ),
      preview: "/images/memorial-background.jpg",
      features: [
        t("dashboard.pageBuilder.templates.classic.features.0", {}, "Biography section"),
        t("dashboard.pageBuilder.templates.classic.features.1", {}, "Photo timeline"),
        t("dashboard.pageBuilder.templates.classic.features.2", {}, "Tribute wall"),
        t("dashboard.pageBuilder.templates.classic.features.3", {}, "Service information"),
      ],
    },
    {
      id: "modern",
      name: t("dashboard.pageBuilder.templates.modern.name", {}, "Modern Tribute"),
      description: t(
        "dashboard.pageBuilder.templates.modern.description",
        {},
        "Clean, contemporary layout with photo focus and minimalist design"
      ),
      preview: "/images/hero-memorial.jpg",
      features: [
        t("dashboard.pageBuilder.templates.modern.features.0", {}, "Large photo gallery"),
        t("dashboard.pageBuilder.templates.modern.features.1", {}, "Clean typography"),
        t("dashboard.pageBuilder.templates.modern.features.2", {}, "Interactive tributes"),
        t("dashboard.pageBuilder.templates.modern.features.3", {}, "Social sharing"),
      ],
    },
    {
      id: "garden",
      name: t("dashboard.pageBuilder.templates.garden.name", {}, "Garden of Memories"),
      description: t(
        "dashboard.pageBuilder.templates.garden.description",
        {},
        "Nature-inspired theme with soft colors and organic elements"
      ),
      preview: "/images/memorial-background.jpg",
      features: [
        t("dashboard.pageBuilder.templates.garden.features.0", {}, "Nature backgrounds"),
        t("dashboard.pageBuilder.templates.garden.features.1", {}, "Soft color palette"),
        t("dashboard.pageBuilder.templates.garden.features.2", {}, "Memory garden"),
        t("dashboard.pageBuilder.templates.garden.features.3", {}, "Peaceful design"),
      ],
    },
    {
      id: "celebration",
      name: t("dashboard.pageBuilder.templates.celebration.name", {}, "Celebration of Life"),
      description: t(
        "dashboard.pageBuilder.templates.celebration.description",
        {},
        "Bright and uplifting design for joyful remembrance and celebration"
      ),
      preview: "/images/hero-memorial.jpg",
      features: [
        t("dashboard.pageBuilder.templates.celebration.features.0", {}, "Vibrant colors"),
        t("dashboard.pageBuilder.templates.celebration.features.1", {}, "Celebration focus"),
        t("dashboard.pageBuilder.templates.celebration.features.2", {}, "Happy memories"),
        t("dashboard.pageBuilder.templates.celebration.features.3", {}, "Uplifting tone"),
      ],
    },
  ];

  // Merge marketplace templates when available (marketplace templates take precedence)
  useEffect(() => {
    let mounted = true;

    async function loadMarketplace() {
      try {
        const res = await fetch(`/api/templates/marketplace`);
        if (res.status === 401) {
          if (!mounted) return;
          setMarketplaceError("Unauthorized");
          setMarketplaceTemplates(null);
          return;
        }

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to load marketplace");
        }

        const body = await res.json();
        const data = body?.data?.templates ?? [];
        if (!mounted) return;

        // Map marketplace shape to builder template shape
        const mapped = (data as Array<Record<string, unknown>>).map((t) => {
          const id = String(t["id"] ?? "");
          const name = String(t["name"] ?? "");
          const description = String(t["description"] ?? "");
          const preview = String(
            t["previewImage"] ?? t["thumbnailImage"] ?? "/images/memorial-background.jpg"
          );
          const category = String(t["category"] ?? "Marketplace");
          return {
            id: `marketplace:${id}`,
            name,
            description,
            preview,
            features: [category],
          } as BuilderTemplate;
        });

        setMarketplaceTemplates(mapped);
        setMarketplaceError(null);
      } catch (err) {
        console.error("Failed to load marketplace templates", err);
        if (!mounted) return;
        setMarketplaceTemplates(null);
        const message = err instanceof Error ? err.message : String(err);
        setMarketplaceError(message ?? "Failed to load marketplace");
      }
    }

    loadMarketplace();
    return () => {
      mounted = false;
    };
  }, []);

  const mergedTemplates =
    marketplaceTemplates && marketplaceTemplates.length > 0
      ? marketplaceTemplates.concat(templates)
      : templates;

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

  const createMemorial = async () => {
    try {
      // Create memorial data (this would come from form state in a real implementation)
      const memorialData = {
        title: `Memorial for ${selectedTemplate}`,
        description: `A beautiful memorial created with the ${selectedTemplate} template`,
        imageUrl: `/images/memorial-${selectedTemplate}.jpg`,
        createdBy: "current-user-id", // This would come from auth context
      };

      const memorialId = await createOfflineMemorial(memorialData);
      router.push(`/memorial/${memorialId}`);
    } catch (error) {
      console.error("Failed to create memorial:", error);
      // In a real app, you'd show an error toast here
    }
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

      {/* Offline indicators */}
      <OfflineBanner />
      <SyncProgress />

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
              {marketplaceError === "Unauthorized" ? (
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
              ) : (
                <StepContent
                  currentStep={currentStep}
                  selectedTemplate={selectedTemplate}
                  setSelectedTemplate={setSelectedTemplate}
                  templates={mergedTemplates}
                  t={tWrapper}
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
                  isCreating={isCreating}
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
