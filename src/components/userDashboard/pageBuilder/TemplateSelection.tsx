import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Lock, AlertCircle, Zap, Eye } from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/hooks/useTheme";
import { AvailableTemplate, SubscriptionInfo } from "@/hooks/useAvailableTemplates";
import { TemplatePreviewModal } from "./TemplatePreviewModal";

interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  features: string[];
}

interface TemplateSelectionProps {
  selectedTemplate: string;
  setSelectedTemplate: (template: string) => void;
  templates: Template[];
  availableTemplates?: AvailableTemplate[];
  subscription?: SubscriptionInfo;
  userHasPublished?: boolean;
  disabled?: boolean;
}

export const TemplateSelection: React.FC<TemplateSelectionProps> = ({
  selectedTemplate,
  setSelectedTemplate,
  templates,
  availableTemplates,
  subscription,
  userHasPublished,
  disabled,
}) => {
  const { theme } = useTheme();
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const cardBorder = theme === "dark" ? "border-white/10" : "border-gray-200";
  const cardBg = theme === "dark" ? "bg-black" : "bg-white";
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";
  const bgMuted = theme === "dark" ? "bg-white/5" : "bg-gray-100";

  const handlePreviewClick = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewTemplateId(templateId);
    setIsPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setIsPreviewOpen(false);
    setPreviewTemplateId(null);
  };

  const handleSelectFromPreview = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const isSubscriptionActive =
    subscription?.status === "ACTIVE" || subscription?.status === "GRACE_PERIOD";
  const isInGracePeriod = subscription?.inGracePeriod;

  // Helper to check if template is available for current plan
  const isTemplateAvailable = (templateId: string): boolean => {
    if (!availableTemplates) return true; // Fallback if no data
    return availableTemplates.some((t) => t.id === templateId);
  };

  // Render subscription status banner
  const renderSubscriptionStatus = () => {
    if (!subscription) return null;

    if (subscription.status === "EXPIRED") {
      return (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-200">
                Subscription Expired
              </h4>
              <p className={`text-sm mt-1 ${textMuted}`}>
                Your subscription has expired. Please renew to create a new memorial.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (isInGracePeriod) {
      return (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-200">
                Grace Period Active
              </h4>
              <p className={`text-sm mt-1 ${textMuted}`}>
                Your subscription expires on{" "}
                {new Date(subscription.expiresAt!).toLocaleDateString()}. Renew soon to avoid
                service interruption.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Render one-template-per-user warning
  const renderOneTemplateWarning = () => {
    if (!userHasPublished) return null;

    return (
      <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-red-900 dark:text-red-200">
              You already have a published memorial
            </h4>
            <p className={`text-sm mt-1 ${textMuted}`}>
              You can only have one published memorial per account. To create a new one, you would
              need to manage your existing memorial first.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderSubscriptionStatus()}
      {renderOneTemplateWarning()}

      {disabled && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-200">
                You already have an active template
              </h4>
              <p className={`text-sm mt-1 ${textMuted}`}>
                Please delete your active template above to select a new one.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {templates.map((template) => {
          const isAvailable = isTemplateAvailable(template.id);
          const isLocked = !isAvailable || !isSubscriptionActive;
          const isSelected = selectedTemplate === template.id;

          return (
            <Card
              key={template.id}
              className={`transition-all relative ${
                isLocked || disabled ? "opacity-75" : "cursor-pointer"
              } ${
                isSelected && !isLocked && !disabled
                  ? "ring-2 ring-black dark:ring-white shadow-lg"
                  : "hover:shadow-md"
              } ${cardBorder} ${cardBg}`}
              onClick={() => !isLocked && !disabled && setSelectedTemplate(template.id)}
            >
              <CardContent className="p-0">
                {/* Disabled overlay when user has active template */}
                {disabled && !isLocked && (
                  <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-2 bg-black/80 rounded-lg p-4">
                      <AlertCircle className="h-6 w-6 text-yellow-500" />
                      <span className="text-white text-sm font-semibold text-center">
                        Delete Active Template First
                      </span>
                    </div>
                  </div>
                )}

                {/* Lock overlay for unavailable templates */}
                {isLocked && (
                  <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-2 bg-black/80 rounded-lg p-4">
                      <Lock className="h-6 w-6 text-white" />
                      <span className="text-white text-sm font-semibold text-center">
                        {!isSubscriptionActive
                          ? "Requires Active Subscription"
                          : "Premium Plan Only"}
                      </span>
                    </div>
                  </div>
                )}

                <div className={`aspect-video rounded-t-lg overflow-hidden ${bgMuted}`}>
                  {template.preview ? (
                    <Image
                      src={template.preview}
                      alt={template.name}
                      className="w-full h-full object-cover"
                      width={400}
                      height={225}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                      <span className="text-gray-400 dark:text-gray-600 text-sm">
                        No preview available
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 md:p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-serif font-semibold text-lg">{template.name}</h3>
                    {isAvailable && isSubscriptionActive && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                        <CheckCircle className="h-3 w-3" />
                        Available
                      </span>
                    )}
                  </div>

                  <p className={`text-sm mb-4 ${textMuted}`}>{template.description}</p>

                  <div className="space-y-1">
                    {template.features.map((feature, idx) => (
                      <div key={idx} className={`flex items-center text-xs ${textMuted}`}>
                        <CheckCircle className="h-3 w-3 mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  {/* Preview button */}
                  <div className="mt-4">
                    <button
                      onClick={(e) => handlePreviewClick(template.id, e)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        theme === "dark"
                          ? "bg-white/10 hover:bg-white/20 text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                    >
                      <Eye className="h-4 w-4" />
                      Preview Template
                    </button>
                  </div>

                  {/* Marketplace template button */}
                  {template.id?.toString().startsWith("marketplace:") && (
                    <div className="mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isLocked) setSelectedTemplate(template.id);
                        }}
                        disabled={isLocked}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          isLocked
                            ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                      >
                        Use this template
                      </button>
                    </div>
                  )}

                  {/* Selection indicator */}
                  {isSelected && !isLocked && (
                    <div className="mt-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                        <CheckCircle className="h-3 w-3" />
                        Selected
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        templateId={previewTemplateId}
        isOpen={isPreviewOpen}
        onClose={handlePreviewClose}
        onSelectTemplate={handleSelectFromPreview}
        disabled={disabled}
      />
    </div>
  );
};
