import React from "react";
// Memorial type is available via SectionProps; no direct import required here
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

  return (
    <section className="relative">
      {cfg.showCoverPhoto && memorial.coverPhoto && (
        <div
          className={`${heightClasses[cfg.height]} bg-cover bg-center relative`}
          style={{ backgroundImage: `url(${memorial.coverPhoto})` }}
        >
          <div className="absolute inset-0 bg-black" style={{ opacity: cfg.overlayOpacity }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white z-10">
              <h1 className="text-5xl font-bold mb-4">
                {memorial.firstName} {memorial.lastName}
              </h1>
              <p className="text-xl">
                {memorial.birthDate && new Date(memorial.birthDate).getFullYear()} -{" "}
                {memorial.deathDate && new Date(memorial.deathDate).getFullYear()}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-8">
        {cfg.showEpitaph && (
          <div className="text-center">
            <p className="text-lg text-gray-700 leading-relaxed">
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
