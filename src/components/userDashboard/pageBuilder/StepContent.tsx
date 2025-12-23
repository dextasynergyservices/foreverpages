import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TemplateSelection } from "./TemplateSelection";
import { SectionData } from "./DynamicSectionRenderer";
import { TemplateEditView } from "./TemplateEditView";
import { ReviewStep } from "./ReviewStep";
import { useTheme } from "@/hooks/useTheme";
import { AvailableTemplate, SubscriptionInfo } from "@/hooks/useAvailableTemplates";
import { DesignTokens } from "./TemplateCustomizer";
import { Spinner } from "@/components/ui/skeleton-loader";
import { UserTemplate } from "@/hooks/useUserTemplate";
import { useUserPublishedStatus } from "@/hooks/useUserPublishedStatus";

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
  selectedTemplateSlug?: string; // Add optional slug prop
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
  userTemplate?: UserTemplate; // Use the hook's UserTemplate type
  existingSlug?: string;
  onPublishSuccess?: (url: string) => void;
  daysRemaining?: number;
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
  onMemorialDataChange?: (data: Partial<StepContentProps["memorialData"]>) => void;
  isLoadingTemplate?: boolean;
}

export const StepContent: React.FC<StepContentProps> = ({
  currentStep,
  selectedTemplate,
  selectedTemplateSlug,
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
  userTemplate,
  existingSlug,
  onPublishSuccess,
  daysRemaining,
  memorialData,
  isLoadingTemplate = false,
  onMemorialDataChange,
}) => {
  const { theme } = useTheme();
  const { data: publishedData } = useUserPublishedStatus();
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

        {currentStep === 1 && (
          <>
            {isLoadingTemplate ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Spinner className="h-8 w-8 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Loading template sections...</p>
                </div>
              </div>
            ) : (
              supportedSections &&
              sectionData &&
              onSectionDataChange && (
                <TemplateEditView
                  selectedTemplate={selectedTemplate}
                  selectedTemplateSlug={selectedTemplateSlug} // Pass the slug
                  supportedSections={supportedSections as string[]}
                  sectionData={sectionData}
                  onSectionDataChange={onSectionDataChange}
                  designTokens={designTokens}
                  onDesignTokensChange={onDesignTokensChange || (() => {})}
                  memorialData={memorialData}
                  onMemorialDataChange={onMemorialDataChange}
                  userTemplateId={userTemplateId}
                  onOpenMediaPicker={onOpenMediaPicker}
                  userTemplate={userTemplate}
                />
              )
            )}
          </>
        )}

        {currentStep === 2 && (
          <>
            {console.log("DEBUG StepContent: Passing to ReviewStep:", {
              isEditMode,
              existingSlug,
              actualMemorialSlug: publishedData?.publishedMemorial?.slug,
              actualMemorialId: publishedData?.publishedMemorial?.id,
              publishedData: publishedData
                ? {
                    hasPublished: publishedData.hasPublished,
                    publishedMemorial: publishedData.publishedMemorial,
                  }
                : null,
              userTemplate: userTemplate
                ? {
                    id: userTemplate.id,
                    isPublished: userTemplate.isPublished,
                    memorialCount: userTemplate.memorials?.length || 0,
                    firstMemorialId: userTemplate.memorials?.[0]?.id,
                  }
                : null,
              computedProps: {
                publishedMemorialUrl:
                  userTemplate?.isPublished === true || !!publishedData?.hasPublished
                    ? publishedData?.publishedMemorial?.slug
                      ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${publishedData.publishedMemorial.slug}`
                      : existingSlug
                        ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${existingSlug}`
                        : undefined
                    : undefined,
                memorialId:
                  publishedData?.publishedMemorial?.id ||
                  userTemplate?.memorials?.[0]?.id ||
                  (isEditMode && userTemplate?.isPublished ? userTemplate?.id : undefined),
                isPublished: userTemplate?.isPublished === true || !!publishedData?.hasPublished,
                finalSlugUsed: publishedData?.publishedMemorial?.slug || existingSlug,
              },
            })}
            <ReviewStep
              selectedTemplate={selectedTemplate}
              templates={templates}
              isEditMode={isEditMode}
              userTemplateId={userTemplateId}
              firstName={memorialData?.firstName}
              lastName={memorialData?.lastName}
              existingSlug={publishedData?.publishedMemorial?.slug || existingSlug}
              onPublishSuccess={onPublishSuccess}
              memorialData={memorialData}
              sectionData={sectionData}
              isInGracePeriod={subscription?.status === "GRACE_PERIOD"}
              isSubscriptionExpired={subscription?.status === "EXPIRED"}
              daysRemaining={daysRemaining}
              publishedMemorialUrl={
                userTemplate?.isPublished === true || !!publishedData?.hasPublished
                  ? publishedData?.publishedMemorial?.slug
                    ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${publishedData.publishedMemorial.slug}`
                    : existingSlug
                      ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${existingSlug}`
                      : undefined
                  : undefined
              }
              memorialId={
                publishedData?.publishedMemorial?.id ||
                userTemplate?.memorials?.[0]?.id ||
                (isEditMode && userTemplate?.isPublished ? userTemplate?.id : undefined)
              }
              isPublished={userTemplate?.isPublished === true || !!publishedData?.hasPublished}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};
