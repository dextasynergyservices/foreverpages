import React, { useEffect, useState } from "react";
import { Check, AlertCircle, Loader } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";

export interface SaveStatusIndicatorProps {
  status: "idle" | "saving" | "saved" | "error";
  lastSavedAt?: Date | null;
  error?: Error | null;
  showTimestamp?: boolean;
  className?: string;
}

/**
 * Indicator component showing the auto-save status
 * Displays saving/saved/error states with appropriate icons and messages
 */
export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  lastSavedAt,
  error,
  showTimestamp = true,
  className = "",
}) => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [displayStatus, setDisplayStatus] = useState(status);

  // Auto-hide saved status after 2 seconds
  useEffect(() => {
    if (status === "saved") {
      const timer = setTimeout(() => {
        setDisplayStatus("idle");
      }, 2000);
      return () => clearTimeout(timer);
    }
    setDisplayStatus(status);
  }, [status]);

  if (displayStatus === "idle") {
    return null;
  }

  const textColor = theme === "dark" ? "text-white/70" : "text-gray-600";
  const bgColor =
    displayStatus === "saving"
      ? theme === "dark"
        ? "bg-blue-900/20"
        : "bg-blue-50"
      : displayStatus === "saved"
        ? theme === "dark"
          ? "bg-green-900/20"
          : "bg-green-50"
        : theme === "dark"
          ? "bg-red-900/20"
          : "bg-red-50";

  const iconColor =
    displayStatus === "saving"
      ? "text-blue-600 dark:text-blue-400"
      : displayStatus === "saved"
        ? "text-green-600 dark:text-green-400"
        : "text-red-600 dark:text-red-400";

  const getMessage = () => {
    if (displayStatus === "saving") {
      return t("dashboard.pageBuilder.form.saving", {}, "Saving...");
    }
    if (displayStatus === "saved") {
      if (showTimestamp && lastSavedAt) {
        const time = new Date(lastSavedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        return t("dashboard.pageBuilder.form.savedAt", { time }, `Saved at ${time}`);
      }
      return t("dashboard.pageBuilder.form.saved", {}, "Saved");
    }
    if (displayStatus === "error") {
      return error?.message || t("dashboard.pageBuilder.form.saveFailed", {}, "Save failed");
    }
    return "";
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bgColor} transition-all ${className}`}
      role="status"
      aria-live="polite"
    >
      {displayStatus === "saving" && <Loader className={`h-4 w-4 ${iconColor} animate-spin`} />}
      {displayStatus === "saved" && <Check className={`h-4 w-4 ${iconColor}`} />}
      {displayStatus === "error" && <AlertCircle className={`h-4 w-4 ${iconColor}`} />}
      <span className={`text-sm ${textColor}`}>{getMessage()}</span>
    </div>
  );
};
