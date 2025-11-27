import React from "react";
import { Memorial } from "@/generated/prisma";
import { useTranslations } from "@/hooks/useTranslations";

interface BiographySectionProps {
  memorial: Memorial;
  layout?: string;
}

export const BiographySection: React.FC<BiographySectionProps> = ({ memorial }) => {
  const { t } = useTranslations();

  if (!memorial.biography) return null;

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-8">
          {t("dashboard.pageBuilder.templates.content.biography.title", {}, "Biography")}
        </h2>
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {memorial.biography}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
