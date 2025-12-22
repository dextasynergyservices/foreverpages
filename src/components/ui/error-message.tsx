"use client";

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, WifiOff, RefreshCw, XCircle } from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";

export interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: "error" | "warning" | "network";
  className?: string;
}

/**
 * Reusable error message component with retry functionality
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  onRetry,
  onDismiss,
  variant = "error",
  className,
}) => {
  const { t } = useTranslations();

  const config = {
    error: {
      icon: <AlertCircle className="h-5 w-5" />,
      title: title || t("errors.generic.title", {}, "Error"),
      className:
        "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/10 dark:text-red-300",
    },
    warning: {
      icon: <AlertCircle className="h-5 w-5" />,
      title: title || t("errors.warning.title", {}, "Warning"),
      className:
        "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/10 dark:text-yellow-300",
    },
    network: {
      icon: <WifiOff className="h-5 w-5" />,
      title: title || t("errors.network.title", {}, "Connection Error"),
      className:
        "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-900/10 dark:text-orange-300",
    },
  };

  const currentConfig = config[variant];

  return (
    <Alert className={`${currentConfig.className} ${className || ""}`}>
      <div className="flex items-start gap-3">
        {currentConfig.icon}
        <div className="flex-1 space-y-1">
          <AlertTitle className="text-base font-semibold">{currentConfig.title}</AlertTitle>
          <AlertDescription className="text-sm">{message}</AlertDescription>
          {(onRetry || onDismiss) && (
            <div className="flex gap-2 mt-3">
              {onRetry && (
                <Button size="sm" variant="outline" onClick={onRetry} className="h-8">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {t("errors.actions.retry", {}, "Retry")}
                </Button>
              )}
              {onDismiss && (
                <Button size="sm" variant="ghost" onClick={onDismiss} className="h-8">
                  <XCircle className="h-3 w-3 mr-1" />
                  {t("errors.actions.dismiss", {}, "Dismiss")}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
};

/**
 * Network error detector utility
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.toLowerCase().includes("network") ||
      error.message.toLowerCase().includes("fetch") ||
      error.message.toLowerCase().includes("connection") ||
      error.name === "NetworkError" ||
      error.name === "TypeError"
    );
  }
  return false;
};

/**
 * Format error for display
 */
export const getErrorMessage = (
  error: unknown,
  t: (key: string, params?: Record<string, string | number>, fallback?: string) => string
): string => {
  if (typeof error === "string") return error;

  if (error instanceof Error) {
    if (isNetworkError(error)) {
      return t(
        "errors.network.message",
        {},
        "Unable to connect. Please check your internet connection and try again."
      );
    }
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }

  return t("errors.generic.message", {}, "An unexpected error occurred. Please try again.");
};
