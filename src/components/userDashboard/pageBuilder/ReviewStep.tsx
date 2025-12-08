import React, { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { PublishModal } from "./PublishModal";

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
  userTemplateId?: string;
  firstName?: string;
  lastName?: string;
  onPublishSuccess?: (url: string) => void;
  isEditMode?: boolean;
  existingSlug?: string;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  selectedTemplate,
  templates,
  userTemplateId,
  firstName = "",
  lastName = "",
  onPublishSuccess,
  isEditMode = false,
  existingSlug = "",
}) => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  const textMuted = theme === "dark" ? "text-black" : "text-white";
  const bgMuted = theme === "dark" ? "bg-white/70" : "bg-black/70";

  const handlePublishClick = () => {
    if (!userTemplateId || !firstName || !lastName) {
      return;
    }
    setIsPublishModalOpen(true);
  };

  const handlePublishSuccess = (url: string) => {
    setIsPublishModalOpen(false);
    onPublishSuccess?.(url);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto text-center">
      <div className={`p-8 rounded-lg ${bgMuted}`}>
        <Heart className={`h-16 w-16 mx-auto mb-4 ${textMuted}`} />
        <h3 className={`text-xl font-serif font-semibold mb-2 ${textMuted}`}>
          {isEditMode
            ? t("dashboard.pageBuilder.review.titleEdit", {}, "Ready to Update Memorial")
            : t("dashboard.pageBuilder.review.title", {}, "Ready to Create Memorial")}
        </h3>
        <p className={`mb-6 ${textMuted}`}>
          {isEditMode
            ? t(
                "dashboard.pageBuilder.review.descriptionEdit",
                {},
                "Your memorial updates are ready to be published. The changes will be reflected immediately."
              )
            : t(
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

      {/* Publish Button */}
      <Button
        onClick={handlePublishClick}
        disabled={!userTemplateId || !firstName || !lastName}
        className="w-full"
        size="lg"
      >
        {isEditMode
          ? t("dashboard.pageBuilder.review.updateButton", {}, "Update Memorial")
          : t("dashboard.pageBuilder.review.publishButton", {}, "Publish Memorial")}
      </Button>

      {/* Publish Modal */}
      {userTemplateId && (
        <PublishModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          onSuccess={handlePublishSuccess}
          userTemplateId={userTemplateId}
          firstName={firstName}
          lastName={lastName}
          isEditMode={isEditMode}
          existingSlug={existingSlug}
        />
      )}
    </div>
  );
};
