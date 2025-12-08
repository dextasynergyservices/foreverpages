import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Copy, ExternalLink } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { usePublishMemorial } from "@/hooks/usePublishMemorial";
import toast from "react-hot-toast";

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (url: string) => void;
  userTemplateId: string;
  firstName: string;
  lastName: string;
  isEditMode?: boolean;
  existingSlug?: string;
}

/**
 * Modal for publishing a memorial with slug customization
 * Handles validation, publication, and success confirmation
 */
export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userTemplateId,
  firstName,
  lastName,
  isEditMode = false,
  existingSlug = "",
}) => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [slug, setSlug] = useState(existingSlug);
  const [showSuccess, setShowSuccess] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");

  const { mutate: publishMemorial, isPending, error } = usePublishMemorial();

  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";
  const bgMuted = theme === "dark" ? "bg-white/5" : "bg-gray-50";
  const borderMuted = theme === "dark" ? "border-white/10" : "border-gray-200";
  const errorBg = theme === "dark" ? "bg-red-900/20" : "bg-red-50";
  const errorBorder = theme === "dark" ? "border-red-700" : "border-red-200";
  const errorText = theme === "dark" ? "text-red-400" : "text-red-600";

  // Validate slug format
  const isValidSlug = useCallback((value: string): boolean => {
    if (!value || value.length < 3 || value.length > 50) {
      return false;
    }
    // Allow alphanumeric, hyphens, underscores
    return /^[a-zA-Z0-9_-]+$/.test(value);
  }, []);

  const handlePublish = useCallback(() => {
    if (!isValidSlug(slug)) {
      toast.error(
        t(
          "dashboard.pageBuilder.publish.invalidSlug",
          {},
          "Slug must be 3-50 characters, alphanumeric with hyphens/underscores"
        )
      );
      return;
    }

    publishMemorial(
      {
        userTemplateId,
        slug,
        firstName,
        lastName,
      },
      {
        onSuccess: (data) => {
          setPublishedUrl(data.publishedUrl);
          setShowSuccess(true);
          onSuccess?.(data.publishedUrl);
        },
      }
    );
  }, [slug, isValidSlug, publishMemorial, userTemplateId, firstName, lastName, onSuccess, t]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(publishedUrl);
      toast.success(t("dashboard.pageBuilder.publish.urlCopied", {}, "URL copied!"), {
        duration: 1500,
      });
    } catch {
      toast.error(t("dashboard.pageBuilder.publish.copyFailed", {}, "Failed to copy"));
    }
  }, [publishedUrl, t]);

  const handleOpenPublished = useCallback(() => {
    window.open(publishedUrl, "_blank");
  }, [publishedUrl]);

  const handleClose = useCallback(() => {
    if (!isPending) {
      setSlug("");
      setShowSuccess(false);
      setPublishedUrl("");
      onClose();
    }
  }, [isPending, onClose]);

  if (showSuccess) {
    // Success view
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              {isEditMode
                ? t("dashboard.pageBuilder.publish.successUpdate", {}, "Memorial Updated!")
                : t("dashboard.pageBuilder.publish.success", {}, "Memorial Published!")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className={textMuted}>
              {isEditMode
                ? t(
                    "dashboard.pageBuilder.publish.successDescriptionUpdate",
                    {},
                    "Your memorial has been successfully updated. Share the link below:"
                  )
                : t(
                    "dashboard.pageBuilder.publish.successDescription",
                    {},
                    "Your memorial has been successfully published. Share the link below:"
                  )}
            </p>

            <div className={`p-4 rounded-lg ${bgMuted} border ${borderMuted} break-all`}>
              <p className="text-sm font-mono">{publishedUrl}</p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="flex-1"
                disabled={isPending}
              >
                <Copy className="h-4 w-4 mr-2" />
                {t("dashboard.pageBuilder.publish.copy", {}, "Copy")}
              </Button>
              <Button onClick={handleOpenPublished} className="flex-1" disabled={isPending}>
                <ExternalLink className="h-4 w-4 mr-2" />
                {t("dashboard.pageBuilder.publish.view", {}, "View")}
              </Button>
            </div>

            <Button onClick={handleClose} className="w-full" disabled={isPending}>
              {t("dashboard.pageBuilder.publish.done", {}, "Done")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Form view
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? t("dashboard.pageBuilder.publish.titleUpdate", {}, "Update Memorial")
              : t("dashboard.pageBuilder.publish.title", {}, "Publish Memorial")}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? t(
                  "dashboard.pageBuilder.publish.descriptionUpdate",
                  {},
                  "Confirm the memorial URL to update"
                )
              : t(
                  "dashboard.pageBuilder.publish.description",
                  {},
                  "Create a custom URL for your memorial page"
                )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Deceased name preview */}
          <div className={`p-3 rounded-lg ${bgMuted} border ${borderMuted}`}>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("dashboard.pageBuilder.publish.memorialFor", {}, "Memorial for:")}
            </p>
            <p className="font-semibold">
              {firstName} {lastName}
            </p>
          </div>

          {/* Slug input */}
          <div className="space-y-2">
            <Label htmlFor="slug">
              {t("dashboard.pageBuilder.publish.slugLabel", {}, "Memorial URL")}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${textMuted}`}>
                {process.env.NEXT_PUBLIC_APP_URL}/memorial/
              </span>
              <Input
                id="slug"
                placeholder="beloved-mom"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                disabled={isPending}
                className="flex-1"
              />
            </div>
            <p className={`text-xs ${textMuted}`}>
              {t(
                "dashboard.pageBuilder.publish.slugHint",
                {},
                "3-50 characters. Use letters, numbers, hyphens, underscores"
              )}
            </p>
          </div>

          {/* Validation error */}
          {slug && !isValidSlug(slug) && (
            <div className={`p-3 rounded-lg border ${errorBg} ${errorBorder} flex gap-2`}>
              <AlertCircle className={`h-5 w-5 ${errorText} flex-shrink-0 mt-0.5`} />
              <p className={`text-sm ${errorText}`}>
                {t("dashboard.pageBuilder.publish.invalidSlugError", {}, "Invalid URL format")}
              </p>
            </div>
          )}

          {/* API error */}
          {error && (
            <div className={`p-3 rounded-lg border ${errorBg} ${errorBorder} flex gap-2`}>
              <AlertCircle className={`h-5 w-5 ${errorText} flex-shrink-0 mt-0.5`} />
              <p className={`text-sm ${errorText}`}>
                {error.message ||
                  t("dashboard.pageBuilder.publish.error", {}, "Publication failed")}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleClose} variant="outline" className="flex-1" disabled={isPending}>
              {t("dashboard.pageBuilder.publish.cancel", {}, "Cancel")}
            </Button>
            <Button
              onClick={handlePublish}
              className="flex-1"
              disabled={!slug || !isValidSlug(slug) || isPending}
            >
              {isPending
                ? t("dashboard.pageBuilder.publish.publishing", {}, "Publishing...")
                : t("dashboard.pageBuilder.publish.publish", {}, "Publish")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
