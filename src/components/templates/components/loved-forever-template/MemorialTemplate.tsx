"use client";

import React, { useState, createContext, useContext } from "react";
import type { Template, UserTemplate, Memorial } from "@/generated/prisma";
import { TemplateProvider } from "@/app/templates/loved-forever-template/TemplateProvider";
import { templateConfig } from "@/app/templates/loved-forever-template/config";
import { DesignTokens } from "@/components/userDashboard/pageBuilder/TemplateCustomizer";
import SupportModal from "@/components/modals/SupportModal";
import HeroSection from "@/app/templates/loved-forever-template/components/HeroSection";
import LifeSection from "@/app/templates/loved-forever-template/components/LifeSection";
import FamilyTree from "@/app/templates/loved-forever-template/components/FamilyTree";
import PhotoGallery from "@/app/templates/loved-forever-template/components/PhotoGallery";
import PrayerWall from "@/app/templates/loved-forever-template/components/PrayerWall";
import SupportSection from "@/app/templates/loved-forever-template/components/SupportSection";
import CondolencesSection from "@/app/templates/loved-forever-template/components/CondolencesSection";
import BlessingModal from "@/app/templates/loved-forever-template/components/BlessingModal";
import Footer from "@/app/templates/loved-forever-template/components/Footer";
import LifeSection from "@/app/templates/loved-forever-template/components/LifeSection";
import MusicPlayer from "@/app/templates/loved-forever-template/components/MusicPlayer";
import Navbar from "@/app/templates/loved-forever-template/components/Navbar";
import PrayerWall from "@/app/templates/loved-forever-template/components/PrayerWall";
import SupportSection from "@/app/templates/loved-forever-template/components/SupportSection";

interface MemorialTemplateProps {
  memorial: Memorial;
  userTemplate: UserTemplate & {
    baseTemplate: Template;
  };
  config?: Record<string, unknown>;
}

// Context for SupportModal to be accessible from any child component
interface SupportModalContextType {
  openSupportModal: () => void;
  closeSupportModal: () => void;
  isOpen: boolean;
}

const SupportModalContext = createContext<SupportModalContextType | null>(null);

// Export hook for child components to trigger the support modal
export const useSupportModal = () => {
  const context = useContext(SupportModalContext);
  if (!context) {
    throw new Error("useSupportModal must be used within MemorialTemplate");
  }
  return context;
};

// Convert Prisma Memorial to template's expected MemorialData format
function convertMemorialData(memorial: Memorial, userTemplate: UserTemplate) {
  // Safely convert customization to DesignTokens
  let customDesignTokens: DesignTokens | undefined;
  try {
    if (userTemplate.customization && typeof userTemplate.customization === "object") {
      customDesignTokens = userTemplate.customization as unknown as DesignTokens;
    }
  } catch (error) {
    console.warn("Failed to parse user customization:", error);
  }

  // Safely convert sections to sections data
  let sectionsData = {};
  try {
    if (userTemplate.sections && typeof userTemplate.sections === "object") {
      sectionsData = userTemplate.sections as Record<string, unknown>;
    }
  } catch (error) {
    console.warn("Failed to parse user sections:", error);
  }

  return {
    name: `${memorial.firstName} ${memorial.lastName}`,
    birthYear: memorial.birthDate
      ? new Date(memorial.birthDate).getFullYear().toString()
      : "Unknown",
    deathYear: memorial.deathDate
      ? new Date(memorial.deathDate).getFullYear().toString()
      : "Unknown",
    tagline: "Forever in our hearts",
    portraitUrl: memorial.profilePhoto || "",
    videoUrl: undefined,
    ownerId: memorial.ownerId,
    sectionsData,
    config: {
      ...templateConfig,
      defaultDesign: customDesignTokens || templateConfig.defaultDesign,
    },
  };
}

export const LovedForeverTemplateMemorialTemplate: React.FC<MemorialTemplateProps> = ({
  memorial,
  userTemplate,
}) => {
  const memorialData = convertMemorialData(memorial, userTemplate);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  // Support modal context value for child components
  const supportModalContextValue: SupportModalContextType = {
    openSupportModal: () => setSupportModalOpen(true),
    closeSupportModal: () => setSupportModalOpen(false),
    isOpen: supportModalOpen,
  };

  // Safely convert customization to DesignTokens
  let customization: DesignTokens;
  const defaultTokens: DesignTokens = {
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

  try {
    if (userTemplate.customization && typeof userTemplate.customization === "object") {
      customization = userTemplate.customization as unknown as DesignTokens;
    } else {
      customization = templateConfig.defaultDesign || defaultTokens;
    }
  } catch (error) {
    console.warn("Failed to parse user customization:", error);
    customization = templateConfig.defaultDesign || defaultTokens;
  }

  return (
    <SupportModalContext.Provider value={supportModalContextValue}>
      <TemplateProvider
        isPreview={true}
        memorialId={memorial.id}
        memorial={memorialData}
        config={templateConfig}
        customization={customization}
        sectionsData={memorialData.sectionsData}
      >
        <div className="relative min-h-screen overflow-x-hidden">
          <style jsx global>{\`
            .template-preview {
              scroll-behavior: smooth;
              contain: layout style;
            }
          \`}</style>
          <main className="relative z-10">
            <HeroSection />
            <LifeSection />
            <FamilyTree />
            <PhotoGallery />
            <PrayerWall />
            <SupportSection />
            <CondolencesSection />
            <BlessingModal />
            <Footer />
            <LifeSection />
            <MusicPlayer />
            <Navbar />
            <PrayerWall />
            <SupportSection />
          </main>

          {/* Support Modal Integration - Uses shared component */}
          <SupportModal
            isOpen={supportModalOpen}
            onClose={() => setSupportModalOpen(false)}
            memorialOwner={{
              id: memorial.ownerId,
              email: "",
            }}
            memorialId={memorial.id}
            onSuccess={() => {
              console.log("Support submitted successfully");
            }}
          />
        </div>
      </TemplateProvider>
    </SupportModalContext.Provider>
  );
};

export default LovedForeverTemplateMemorialTemplate;
