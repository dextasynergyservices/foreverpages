import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Heart } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface NavigationButtonsProps {
  currentStep: number;
  stepsLength: number;
  selectedTemplate: string;
  onPrevStep: () => void;
  onNextStep: () => void;
  onCreateMemorial: () => void;
  t: (key: string, params?: unknown, fallback?: string) => string;
  isCreating?: boolean;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentStep,
  stepsLength,
  selectedTemplate,
  onPrevStep,
  onNextStep,
  onCreateMemorial,
  t,
  isCreating = false,
}) => {
  const { theme } = useTheme();
  const prevEnabled = currentStep > 0;
  const nextEnabled =
    currentStep < stepsLength - 1 ? !(currentStep === 0 && !selectedTemplate) : true;
  return (
    <div className="flex justify-between">
      <Button
        variant={prevEnabled ? "memorial" : theme === "dark" ? "memorial-ghost" : "outline"}
        onClick={onPrevStep}
        disabled={!prevEnabled}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t("dashboard.pageBuilder.buttons.previous")}
      </Button>

      {currentStep < stepsLength - 1 ? (
        <Button
          variant={nextEnabled ? "memorial" : theme === "dark" ? "memorial-ghost" : "outline"}
          onClick={onNextStep}
          disabled={!nextEnabled}
        >
          {t("dashboard.pageBuilder.buttons.next")}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      ) : (
        <Button variant="memorial" onClick={onCreateMemorial} disabled={isCreating}>
          {isCreating
            ? t("dashboard.pageBuilder.buttons.creating", {}, "Creating...")
            : t("dashboard.pageBuilder.buttons.create")}
          <Heart className="h-4 w-4 ml-2" />
        </Button>
      )}
    </div>
  );
};
