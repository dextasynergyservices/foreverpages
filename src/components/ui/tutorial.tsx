"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/hooks/useTranslations";

export interface TutorialStep {
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  icon?: React.ReactNode;
}

interface TutorialProps {
  steps: TutorialStep[];
  storageKey: string; // LocalStorage key to track if tutorial was completed
  onComplete?: () => void;
  onSkip?: () => void;
}

/**
 * Tutorial/Onboarding component
 */
export const Tutorial: React.FC<TutorialProps> = ({ steps, storageKey, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslations();

  useEffect(() => {
    // Check if tutorial was already completed
    const completed = localStorage.getItem(storageKey);
    if (!completed) {
      setIsVisible(true);
    }
  }, [storageKey]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, "true");
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem(storageKey, "true");
    setIsVisible(false);
    onSkip?.();
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200" />

      {/* Tutorial Card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <Card className="max-w-lg w-full pointer-events-auto animate-in zoom-in-95 duration-200">
          <CardHeader className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              {step.icon && (
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">{step.icon}</div>
              )}
              <div className="flex-1">
                <CardTitle className="text-lg">{step.title}</CardTitle>
                <CardDescription>
                  {t(
                    "tutorial.step",
                    { current: currentStep + 1, total: steps.length },
                    `Step ${currentStep + 1} of ${steps.length}`
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-300">{step.description}</p>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  {currentStep + 1} / {steps.length}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex-1"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t("tutorial.previous", {}, "Previous")}
              </Button>
              <Button onClick={handleNext} className="flex-1">
                {currentStep === steps.length - 1 ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    {t("tutorial.finish", {}, "Finish")}
                  </>
                ) : (
                  <>
                    {t("tutorial.next", {}, "Next")}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>

            {/* Skip Button */}
            <div className="text-center">
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                {t("tutorial.skip", {}, "Skip Tutorial")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

/**
 * Hook to manage tutorial state
 */
export const useTutorial = (storageKey: string) => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(storageKey);
    setShouldShow(!completed);
  }, [storageKey]);

  const markComplete = () => {
    localStorage.setItem(storageKey, "true");
    setShouldShow(false);
  };

  const reset = () => {
    localStorage.removeItem(storageKey);
    setShouldShow(true);
  };

  return { shouldShow, markComplete, reset };
};
