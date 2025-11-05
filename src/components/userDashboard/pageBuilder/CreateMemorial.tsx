"use client";

import React, { useState } from "react";
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
  const router = useRouter();

  const templates = [
    {
      id: "classic",
      name: "Classic Memorial",
      description: "Traditional and elegant design with timeline and formal layout",
      preview: "/images/memorial-background.jpg",
      features: ["Biography section", "Photo timeline", "Tribute wall", "Service information"],
    },
    {
      id: "modern",
      name: "Modern Tribute",
      description: "Clean, contemporary layout with photo focus and minimalist design",
      preview: "/images/hero-memorial.jpg",
      features: [
        "Large photo gallery",
        "Clean typography",
        "Interactive tributes",
        "Social sharing",
      ],
    },
    {
      id: "garden",
      name: "Garden of Memories",
      description: "Nature-inspired theme with soft colors and organic elements",
      preview: "/images/memorial-background.jpg",
      features: ["Nature backgrounds", "Soft color palette", "Memory garden", "Peaceful design"],
    },
    {
      id: "celebration",
      name: "Celebration of Life",
      description: "Bright and uplifting design for joyful remembrance and celebration",
      preview: "/images/hero-memorial.jpg",
      features: ["Vibrant colors", "Celebration focus", "Happy memories", "Uplifting tone"],
    },
  ];

  const steps = [
    { title: "Choose Template", description: "Select a design that honors your loved one" },
    { title: "Basic Information", description: "Tell us about your loved one" },
    { title: "Memorial Details", description: "Add photos and memories" },
    { title: "Review", description: "Review and create your memorial" },
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

  // Create a type-safe wrapper for the t function
  const safeT = (key: string, params?: unknown, fallback?: string): string => {
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
                {safeT("dashboard.pageBuilder.sidebar.title", {}, "Build steps")}
              </h3>
              <ProgressSteps steps={steps} currentStep={currentStep} t={safeT} vertical />

              <div
                className={`mt-6 text-sm ${theme === "dark" ? "text-white/70" : "text-gray-600"}`}
              >
                <p className="mb-2">
                  {safeT("dashboard.pageBuilder.sidebar.hint1", {}, "Tip: save frequently")}
                </p>
                <p>
                  {safeT(
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
              <ProgressSteps steps={steps} currentStep={currentStep} t={safeT} vertical={false} />
            </div>

            <div
              className={`border rounded-lg p-4 md:p-6 shadow-sm ${theme === "dark" ? "border-white/10 bg-black" : "border-gray-200 bg-white"}`}
            >
              <StepContent
                currentStep={currentStep}
                selectedTemplate={selectedTemplate}
                setSelectedTemplate={setSelectedTemplate}
                templates={templates}
                t={safeT}
              />

              <div className="mt-4">
                <NavigationButtons
                  currentStep={currentStep}
                  stepsLength={steps.length}
                  selectedTemplate={selectedTemplate}
                  onPrevStep={prevStep}
                  onNextStep={nextStep}
                  onCreateMemorial={createMemorial}
                  t={safeT}
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
