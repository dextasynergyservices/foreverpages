import React from "react";
import { Heart } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";

interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  features: string[];
}

interface ReviewStepProps {
  selectedTemplate: string;
  templates: Template[];
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ selectedTemplate, templates }) => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const textMuted = theme === "dark" ? "text-black" : "text-white";
  const bgMuted = theme === "dark" ? "bg-white/70" : "bg-black/70";

  return (
    <div className="space-y-6 max-w-xl mx-auto text-center">
      <div className={`p-8 rounded-lg ${bgMuted}`}>
        <Heart className={`h-16 w-16 mx-auto mb-4 ${textMuted}`} />
        <h3 className={`text-xl font-serif font-semibold mb-2 ${textMuted}`}>
          {t("dashboard.pageBuilder.review.title", {}, "Ready to Create Memorial")}
        </h3>
        <p className={`mb-6 ${textMuted}`}>
          {t(
            "dashboard.pageBuilder.review.description",
            {},
            "Your beautiful memorial page is ready to be created. You can always edit and add more content later."
          )}
        </p>

        <div className="space-y-3 text-left">
          <div className="flex items-center justify-between">
            <span className={`text-sm ${textMuted}`}>
              {t("dashboard.pageBuilder.review.templateLabel", {}, "Template:")}
            </span>
            <span className={`text-sm font-medium ${textMuted}`}>
              {templates.find((t) => t.id === selectedTemplate)?.name}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${textMuted}`}>
              {t("dashboard.pageBuilder.review.privacyLabel", {}, "Privacy:")}
            </span>
            <span className={`text-sm font-medium ${textMuted}`}>
              {t("dashboard.pageBuilder.review.privacyValue", {}, "Public")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${textMuted}`}>
              {t("dashboard.pageBuilder.review.featuresLabel", {}, "Features:")}
            </span>
            <span className={`text-sm font-medium ${textMuted}`}>
              {t("dashboard.pageBuilder.review.featuresValue", {}, "Full Access")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
