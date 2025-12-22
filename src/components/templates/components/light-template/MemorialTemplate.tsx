"use client";

import React from "react";
import { Template, UserTemplate, Memorial } from "@/generated/prisma";
import StarField from "@/app/templates/light-template/components/StarField";
import HeroSection from "@/app/templates/light-template/components/HeroSection";
import LifeJourney from "@/app/templates/light-template/components/LifeJourney";
import PhotoGallery from "@/app/templates/light-template/components/PhotoGallery";
import Condolence from "@/app/templates/light-template/components/Condolence";
import CandleSanctuary from "@/app/templates/light-template/components/CandleSanctuary";
import Navigation from "@/app/templates/light-template/components/Navigation";
import MobileNavigation from "@/app/templates/light-template/components/MobileNavigation";
import TributeSection from "@/app/templates/light-template/components/Tribute";
import Footer from "@/app/templates/light-template/components/Footer";
import { TemplateProvider } from "@/app/templates/light-template/TemplateProvider";
import { MusicProvider } from "@/app/templates/light-template/components/MusicContext";
import { templateConfig } from "@/app/templates/light-template/config";
import { DesignTokens } from "@/components/userDashboard/pageBuilder/TemplateCustomizer";

interface MemorialTemplateProps {
  memorial: Memorial;
  userTemplate: UserTemplate & {
    baseTemplate: Template;
  };
  config?: Record<string, unknown>;
}

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
    sectionsData, // Include sections data from UserTemplate
    config: {
      ...templateConfig,
      // Merge user customization from UserTemplate
      defaultDesign: customDesignTokens || templateConfig.defaultDesign,
    },
  };
}

export const LightMemorialTemplate: React.FC<MemorialTemplateProps> = ({
  memorial,
  userTemplate,
}) => {
  const memorialData = convertMemorialData(memorial, userTemplate);

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
    <TemplateProvider
      isPreview={true}
      memorialId={memorial.id}
      memorial={memorialData}
      config={templateConfig}
      customization={customization}
      sectionsData={memorialData.sectionsData}
    >
      <MusicProvider>
        <div className="relative min-h-screen overflow-x-hidden bg-black text-white">
          {/* Optimizations for preview scrolling */}
          <style jsx global>{`
            .template-preview {
              /* Ensure smooth scrolling */
              scroll-behavior: smooth;
              /* Optimize for preview container */
              contain: layout style;
            }
          `}</style>
          <StarField />
          <Navigation />
          <MobileNavigation />
          <main className="relative z-10">
            <HeroSection />
            <LifeJourney />
            <PhotoGallery />
            <TributeSection />
            <CandleSanctuary />
            <Condolence />
            <Footer />
          </main>
        </div>
      </MusicProvider>
    </TemplateProvider>
  );
};

export default LightMemorialTemplate;
