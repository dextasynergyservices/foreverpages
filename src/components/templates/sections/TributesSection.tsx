import React from "react";
import { Memorial } from "@/generated/prisma";
import { useTranslations } from "@/hooks/useTranslations";

interface TributesSectionProps {
  memorial: Memorial;
  layout?: string;
}

export const TributesSection: React.FC<TributesSectionProps> = ({ memorial }) => {
  const { t } = useTranslations();

  // Check for available tribute content
  const hasTributes = memorial.legacy || memorial.lifeStory;

  if (!hasTributes) return null;

  return (
    <section className="py-12 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-8">
          {t("dashboard.pageBuilder.templates.content.tributes.title", {}, "Tributes & Memories")}
        </h2>
        <div className="space-y-8">
          {memorial.legacy && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">
                {t("dashboard.pageBuilder.templates.content.tributes.legacy", {}, "Legacy")}
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{memorial.legacy}</p>
            </div>
          )}

          {memorial.lifeStory && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">
                {t("dashboard.pageBuilder.templates.content.tributes.lifeStory", {}, "Life Story")}
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {memorial.lifeStory}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
