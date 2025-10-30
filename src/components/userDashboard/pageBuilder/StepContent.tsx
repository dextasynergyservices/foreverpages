import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TemplateSelection } from "./TemplateSelection";
import { BasicInfoForm } from "./BasicInfoForm";
import { MemorialDetailsForm } from "./MemorialDetailsForm";
import { ReviewStep } from "./ReviewStep";
import { useTheme } from "@/hooks/useTheme";

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
}

export const StepContent: React.FC<StepContentProps> = ({
  currentStep,
  selectedTemplate,
  setSelectedTemplate,
  templates,
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
          />
        )}

        {currentStep === 1 && <BasicInfoForm />}

        {currentStep === 2 && <MemorialDetailsForm />}

        {currentStep === 3 && (
          <ReviewStep selectedTemplate={selectedTemplate} templates={templates} />
        )}
      </CardContent>
    </Card>
  );
};
