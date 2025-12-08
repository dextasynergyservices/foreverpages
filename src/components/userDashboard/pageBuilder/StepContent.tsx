import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TemplateSelection } from "./TemplateSelection";
import { BasicInfoForm } from "./BasicInfoForm";
import { SectionData } from "./DynamicSectionRenderer";
import { CustomizationStep } from "./CustomizationStep";
import { MemorialDetailsStep } from "./MemorialDetailsStep";
import { ReviewStep } from "./ReviewStep";
import { useTheme } from "@/hooks/useTheme";
import { AvailableTemplate, SubscriptionInfo } from "@/hooks/useAvailableTemplates";
import { DesignTokens } from "./TemplateCustomizer";

interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  features: string[];
}

interface StepContentProps {
  currentStep: number;
  selectedTemplate: string;
  setSelectedTemplate: (template: string) => void;
  templates: Template[];
  t: (key: string, params?: unknown, fallback?: string) => string;
  availableTemplates?: AvailableTemplate[];
  subscription?: SubscriptionInfo;
  userHasPublished?: boolean;
  designTokens?: DesignTokens;
  onDesignTokensChange?: (tokens: DesignTokens) => void;
  hasActiveTemplate?: boolean;
  supportedSections?: string[];
  sectionData?: SectionData;
  onSectionDataChange?: (section: string, data: unknown) => void;
  onOpenMediaPicker?: () => void;
  isEditMode?: boolean;
  userTemplateId?: string;
  existingSlug?: string;
  onPublishSuccess?: (url: string) => void;
  memorialData?: {
    firstName?: string;
    lastName?: string;
    birthYear?: number;
    deathYear?: number;
    biography?: string;
    birthDate?: string;
    deathDate?: string;
    profilePhoto?: string;
  };
}

export const StepContent: React.FC<StepContentProps> = ({
  currentStep,
  selectedTemplate,
  setSelectedTemplate,
  templates,
  availableTemplates,
  subscription,
  userHasPublished,
  designTokens,
  onDesignTokensChange,
  hasActiveTemplate,
  supportedSections,
  sectionData,
  onSectionDataChange,
  onOpenMediaPicker,
  isEditMode,
  userTemplateId,
  existingSlug,
  onPublishSuccess,
  memorialData,
}) => {
  const { theme } = useTheme();
  const cardBorder = theme === "dark" ? "border-white/10" : "border-gray-200";
  const cardBg = theme === "dark" ? "bg-black" : "bg-white";

  return (
    <Card className={`mb-0 border ${cardBorder} ${cardBg}`}>
      <CardContent className="p-4 md:p-6">
        {currentStep === 0 && (
          <TemplateSelection
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            templates={templates}
            availableTemplates={availableTemplates}
            subscription={subscription}
            userHasPublished={userHasPublished}
            disabled={hasActiveTemplate || isEditMode}
          />
        )}

        {currentStep === 1 && <BasicInfoForm />}

        {currentStep === 2 && (
          <CustomizationStep
            selectedTemplate={selectedTemplate}
            onCustomizationChange={onDesignTokensChange || (() => {})}
            initialDesign={designTokens}
            memorialData={memorialData}
            sectionData={sectionData}
            supportedSections={supportedSections}
          />
        )}

        {currentStep === 3 && supportedSections && sectionData && onSectionDataChange && (
          <MemorialDetailsStep
            supportedSections={supportedSections as string[]}
            sectionData={sectionData}
            onSectionDataChange={onSectionDataChange}
            onOpenMediaPicker={onOpenMediaPicker}
            designTokens={designTokens}
            memorialData={memorialData}
          />
        )}

        {currentStep === 4 && (
          <ReviewStep
            selectedTemplate={selectedTemplate}
            templates={templates}
            isEditMode={isEditMode}
            userTemplateId={userTemplateId}
            firstName={memorialData?.firstName}
            lastName={memorialData?.lastName}
            existingSlug={existingSlug}
            onPublishSuccess={onPublishSuccess}
          />
        )}
      </CardContent>
    </Card>
  );
};
