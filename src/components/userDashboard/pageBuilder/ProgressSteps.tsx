import React from "react";
import { CheckCircle } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface Step {
  title: string;
  description: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  t: (key: string, params?: unknown, fallback?: string) => string;
  vertical?: boolean;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  steps,
  currentStep,
  t,
  vertical = false,
}) => {
  const { theme } = useTheme();
  const stepTitles = [
    t("dashboard.pageBuilder.steps.chooseTemplate.title"),
    t("dashboard.pageBuilder.steps.basicInfo.title"),
    t("dashboard.pageBuilder.steps.details.title"),
    t("dashboard.pageBuilder.steps.review.title"),
  ];

  const stepDescriptions = [
    t("dashboard.pageBuilder.steps.chooseTemplate.description"),
    t("dashboard.pageBuilder.steps.basicInfo.description"),
    t("dashboard.pageBuilder.steps.details.description"),
    t("dashboard.pageBuilder.steps.review.description"),
  ];

  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  if (vertical) {
    return (
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start">
            <div className="mr-3">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index <= currentStep
                    ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black"
                    : `${theme === "dark" ? "border-white/20 bg-black text-white/70" : "border-gray-300 bg-white text-gray-400"}`
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">{stepTitles[index]}</h4>
              <p className={`text-xs ${textMuted}`}>{stepDescriptions[index]}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8 overflow-x-auto">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center flex-shrink-0">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                index <= currentStep
                  ? "bg-black border-black text-white dark:bg-white dark:border-white dark:text-black"
                  : `${theme === "dark" ? "border-white/20 bg-black text-white/70" : "border-gray-300 bg-white text-gray-400"}`
              }`}
            >
              {index < currentStep ? (
                <CheckCircle className="md:h-5 md:w-5 h-2 w-2" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-5 md:w-10 md:w-16 h-0.5 mx-2 md:mx-4 ${
                  index < currentStep
                    ? theme === "dark"
                      ? "bg-white"
                      : "bg-black"
                    : theme === "dark"
                      ? "bg-white/20"
                      : "bg-gray-300"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="text-center mb-8">
        <h2 className="text-xl md:text-2xl font-serif font-bold mb-2">{stepTitles[currentStep]}</h2>
        <p className={textMuted}>{stepDescriptions[currentStep]}</p>
      </div>
    </>
  );
};
