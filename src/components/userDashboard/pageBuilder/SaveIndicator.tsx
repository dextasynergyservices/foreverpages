"use client";

import React from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";

interface SaveIndicatorProps {
  status: "idle" | "saving" | "saved" | "error";
  message?: string;
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({ status, message }) => {
  const { theme } = useTheme();
  const { t } = useTranslations();

  if (status === "idle") {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case "saving":
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: message || t("dashboard.pageBuilder.saveIndicator.saving", {}, "Saving..."),
          colorClass:
            theme === "dark"
              ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
              : "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "saved":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: message || t("dashboard.pageBuilder.saveIndicator.saved", {}, "Saved"),
          colorClass:
            theme === "dark"
              ? "bg-green-500/20 text-green-300 border-green-500/30"
              : "bg-green-50 text-green-700 border-green-200",
        };
      case "error":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: message || t("dashboard.pageBuilder.saveIndicator.error", {}, "Error saving"),
          colorClass:
            theme === "dark"
              ? "bg-red-500/20 text-red-300 border-red-500/30"
              : "bg-red-50 text-red-700 border-red-200",
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-all ${config.colorClass}`}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
};
