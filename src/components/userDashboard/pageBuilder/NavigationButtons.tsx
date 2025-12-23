import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";
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
  userHasPublished?: boolean;
  subscriptionActive?: boolean;
  isSubscriptionExpired?: boolean;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentStep,
  stepsLength,
  selectedTemplate,
  onPrevStep,
  onNextStep,
  onCreateMemorial: _onCreateMemorial,
  t,
  isCreating: _isCreating = false,
  userHasPublished = false,
  subscriptionActive = true,
  isSubscriptionExpired = false,
}) => {
  const { theme } = useTheme();
  const prevEnabled = currentStep > 0 && !isSubscriptionExpired;

  // Step 0: Template selection - require template to be selected
  // Step 1: Edit template - always allow next if template is active
  // Step 2: Review - this is the last step
  const nextEnabled = !isSubscriptionExpired && !(currentStep === 0 && !selectedTemplate);

  return (
    <div className="flex flex-col gap-4">
      {/* Show warning if user already has published memorial */}
      {userHasPublished && currentStep === stepsLength - 1 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-900 dark:text-red-200">
              You already have a published memorial
            </p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              Only one published memorial per account is allowed. Please manage your existing
              memorial or contact support to create a new one.
            </p>
          </div>
        </div>
      )}

      {/* Show warning if subscription is not active */}
      {!subscriptionActive && currentStep === stepsLength - 1 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Active subscription required
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Your subscription is expired or inactive. Please renew to publish your memorial.
            </p>
          </div>
        </div>
      )}

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
          // On the last step (Review), don't show Create Memorial button
          // The ReviewStep component handles publishing with its own button and modal
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
};
