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

  // Get default styles with CSS variables applied
  const containerStyle: React.CSSProperties = {
    backgroundColor: "var(--color-body-bg, #f9fafb)",
    color: "var(--color-body-text, #1f2937)",
    fontFamily:
      "var(--font-family, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto)",
  };

  const mainStyle: React.CSSProperties = {
    maxWidth: "var(--container-width, 64rem)",
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: "var(--spacing, 1.5rem)",
    paddingRight: "var(--spacing, 1.5rem)",
    paddingTop: "var(--spacing, 1.5rem)",
    paddingBottom: "var(--spacing, 1.5rem)",
  };

  return (
    <div className="min-h-screen" style={containerStyle}>
      <TemplateNavigation template={template} config={config?.navigation} />

      <TemplateHeader template={template} memorial={memorial} config={config?.header} />

      <main style={mainStyle}>
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
