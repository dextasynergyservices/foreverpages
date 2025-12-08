import React from "react";
// Memorial type is available via SectionProps; no direct import required here..
import { useTranslations } from "@/hooks/useTranslations";
import { createSection } from "@/lib/templates/sectionFactory";
import type { SectionProps } from "@/lib/templates/sectionRegistry";

interface HeroSectionConfig {
  showCoverPhoto: boolean;
  showEpitaph: boolean;
  height: "small" | "medium" | "large";
  overlayOpacity: number;
}

const HeroSectionComponent: React.FC<SectionProps & { config?: HeroSectionConfig }> = ({
  memorial,
  config,
}) => {
  const { t } = useTranslations();

  const heightClasses = {
    small: "h-64",
    medium: "h-96",
    large: "h-[32rem]",
  };

  const cfg = {
    showCoverPhoto: config?.showCoverPhoto ?? true,
    showEpitaph: config?.showEpitaph ?? true,
    height: config?.height ?? "medium",
    overlayOpacity: config?.overlayOpacity ?? 0.4,
  } as HeroSectionConfig;

  const heroImageContainerStyle: React.CSSProperties = {
    position: "relative",
    backgroundImage: `url(${memorial.coverPhoto})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  const heroOverlayStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundColor: "black",
    opacity: cfg.overlayOpacity,
  };

  const heroContentContainerStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const heroTextContainerStyle: React.CSSProperties = {
    textAlign: "center",
    color: "var(--color-header-text, white)",
    zIndex: 10,
  };

  const heroTitleStyle: React.CSSProperties = {
    fontSize: "var(--font-heading-size, 3rem)",
    fontWeight: "bold",
    marginBottom: "1rem",
    color: "var(--color-header-text, white)",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
  };

  const heroSubtitleStyle: React.CSSProperties = {
    fontSize: "var(--font-body-size, 1.25rem)",
    color: "var(--color-header-text, white)",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
  };

  const epitaphContainerStyle: React.CSSProperties = {
    maxWidth: "var(--container-width, 64rem)",
    marginLeft: "auto",
    marginRight: "auto",
    paddingLeft: "var(--spacing, 1.5rem)",
    paddingRight: "var(--spacing, 1.5rem)",
    paddingTop: "var(--spacing, 1.5rem)",
    paddingBottom: "var(--spacing, 1.5rem)",
  };

  const epitaphTextStyle: React.CSSProperties = {
    textAlign: "center",
    fontSize: "1.125rem",
    color: "var(--color-body-text, #374151)",
    lineHeight: "1.625",
    fontFamily: "var(--font-family, ui-sans-serif, system-ui)",
  };

  return (
    <section style={{ position: "relative" }}>
      {cfg.showCoverPhoto && memorial.coverPhoto && (
        <div style={heroImageContainerStyle} className={heightClasses[cfg.height]}>
          <div style={heroOverlayStyle} />
          <div style={heroContentContainerStyle}>
            <div style={heroTextContainerStyle}>
              <h1 style={heroTitleStyle}>
                {memorial.firstName} {memorial.lastName}
              </h1>
              <p style={heroSubtitleStyle}>
                {memorial.birthDate && new Date(memorial.birthDate).getFullYear()} -{" "}
                {memorial.deathDate && new Date(memorial.deathDate).getFullYear()}
              </p>
            </div>
          </div>
        </div>
      )}

      <div style={epitaphContainerStyle}>
        {cfg.showEpitaph && (
          <div style={{ textAlign: "center" }}>
            <p style={epitaphTextStyle}>
              {memorial.epitaph ||
                t(
                  "dashboard.pageBuilder.templates.content.epitaph.default",
                  {},
                  "In loving memory"
                )}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export const HeroSection = createSection("hero", HeroSectionComponent, {
  displayName: "Hero Section",
  category: "header",
  icon: "Image",
  defaultConfig: {
    showCoverPhoto: true,
    showEpitaph: true,
    height: "medium",
    overlayOpacity: 0.4,
  },
});
