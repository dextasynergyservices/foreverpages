import React from "react";
import { TemplateProps } from "@/lib/templates";
import { TemplateHeader } from "../../base/TemplateHeader";
import { TemplateNavigation } from "../../base/TemplateNavigation";
import { HeroSection } from "../../sections/HeroSection";
import { BiographySection } from "../../sections/BiographySection";
import { GallerySection } from "../../sections/GallerySection";
import { TimelineSection } from "../../sections/TimelineSection";
import { FamilyTreeSection } from "../../sections/FamilyTreeSection";
import { TributesSection } from "../../sections/TributesSection";
import { CondolencesSection } from "../../sections/CondolencesSection";
import { SupportSection } from "../../sections/SupportSection";

export const ClassicMemorialTemplate: React.FC<TemplateProps> = ({
  memorial,
  userTemplate,
  config,
}) => {
  const template = userTemplate.baseTemplate;

  return (
    <div className="min-h-screen bg-gray-50">
      <TemplateNavigation template={template} config={config?.navigation} />

      <TemplateHeader template={template} memorial={memorial} config={config?.header} />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <HeroSection memorial={memorial} layout="centered" />

        {memorial.biography && <BiographySection memorial={memorial} layout="default" />}

        <TimelineSection memorial={memorial} layout="default" />

        <FamilyTreeSection memorial={memorial} layout="default" />

        <TributesSection memorial={memorial} layout="default" />

        <CondolencesSection memorial={memorial} layout="default" />

        <SupportSection memorial={memorial} layout="default" />

        {memorial.galleryPhotos && memorial.galleryPhotos.length > 0 && (
          <GallerySection memorial={memorial} layout="grid" />
        )}
      </main>
    </div>
  );
};
