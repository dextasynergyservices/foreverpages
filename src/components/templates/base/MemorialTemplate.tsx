import React from "react";
import { Template, UserTemplate, Memorial } from "@/generated/prisma";
import { useTranslations } from "@/hooks/useTranslations";

interface MemorialTemplateProps {
  memorial: Memorial;
  userTemplate: UserTemplate & {
    baseTemplate: Template;
  };
  config?: Record<string, unknown>;
}

export const MemorialTemplate: React.FC<MemorialTemplateProps> = ({ memorial }) => {
  const { t } = useTranslations();

  return (
    <div className="memorial-template min-h-screen">
      <header className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">
            {memorial.firstName} {memorial.lastName}
          </h1>
          <p className="text-xl text-gray-300">
            {memorial.birthDate && new Date(memorial.birthDate).getFullYear()} -{" "}
            {memorial.deathDate && new Date(memorial.deathDate).getFullYear()}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {memorial.biography && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {t("dashboard.pageBuilder.templates.content.biography.title", {}, "Biography")}
            </h2>
            <p className="text-gray-700 leading-relaxed">{memorial.biography}</p>
          </section>
        )}

        {memorial.epitaph && (
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {t("dashboard.pageBuilder.templates.content.epitaph.title", {}, "Epitaph")}
            </h2>
            <blockquote className="text-lg italic text-gray-600 border-l-4 border-gray-400 pl-4">
              {memorial.epitaph}
            </blockquote>
          </section>
        )}
      </main>
    </div>
  );
};
