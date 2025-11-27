import React from "react";
import { Memorial } from "@/generated/prisma";
import { useTranslations } from "@/hooks/useTranslations";
import { createSection } from "@/lib/templates/sectionFactory";

interface HeroSectionConfig {
  showCoverPhoto: boolean;
  showEpitaph: boolean;
  height: "small" | "medium" | "large";
  overlayOpacity: number;
}

const HeroSectionComponent: React.FC<{
  memorial: Memorial;
  config: HeroSectionConfig;
}> = ({ memorial, config }) => {
  const { t } = useTranslations();

  const heightClasses = {
    small: "h-64",
    medium: "h-96",
    large: "h-[32rem]",
  };

  return (
    <section className="relative">
      {config.showCoverPhoto && memorial.coverPhoto && (
        <div
          className={`${heightClasses[config.height]} bg-cover bg-center relative`}
          style={{ backgroundImage: `url(${memorial.coverPhoto})` }}
        >
          <div className="absolute inset-0 bg-black" style={{ opacity: config.overlayOpacity }} />
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
        {config.showEpitaph && (
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
    height: "medium" as const,
    overlayOpacity: 0.4,
  },
});
