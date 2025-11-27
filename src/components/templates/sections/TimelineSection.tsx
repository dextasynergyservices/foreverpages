import React from "react";
import { Memorial } from "@/generated/prisma";
import { useTranslations } from "@/hooks/useTranslations";

interface TimelineSectionProps {
  memorial: Memorial;
  layout?: string;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({ memorial }) => {
  const { t } = useTranslations();

  // For now, show basic life dates
  if (!memorial.birthDate || !memorial.deathDate) return null;

  return (
    <section className="py-12 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-8">
          {t("dashboard.pageBuilder.templates.content.timeline.title", {}, "Life Timeline")}
        </h2>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <div>
              <h3 className="font-semibold">
                {t("dashboard.pageBuilder.templates.content.timeline.born", {}, "Born")}
              </h3>
              <p className="text-gray-600">
                {new Date(memorial.birthDate).toLocaleDateString()}
                {memorial.birthPlace && ` in ${memorial.birthPlace}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <div>
              <h3 className="font-semibold">
                {t(
                  "dashboard.pageBuilder.templates.content.timeline.passedAway",
                  {},
                  "Passed Away"
                )}
              </h3>
              <p className="text-gray-600">
                {new Date(memorial.deathDate).toLocaleDateString()}
                {memorial.deathPlace && ` in ${memorial.deathPlace}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
