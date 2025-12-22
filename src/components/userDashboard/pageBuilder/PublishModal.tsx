import React, { useState, useCallback, useEffect } from "react";
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
import { AlertCircle, CheckCircle, Copy, ExternalLink, Loader2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { usePublishMemorial } from "@/hooks/usePublishMemorial";
import { useDebounce } from "@/hooks/useDebounce";
import { useEditorShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ErrorMessage, getErrorMessage, isNetworkError } from "@/components/ui/error-message";
import { Spinner } from "@/components/ui/skeleton-loader";
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
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [suggestedSlugs, setSuggestedSlugs] = useState<string[]>([]);

  const { mutate: publishMemorial, isPending, error } = usePublishMemorial();

  // Validate slug format
  const isValidSlug = useCallback((value: string): boolean => {
    if (!value || value.length < 3 || value.length > 50) {
      return false;
    }
    // Allow alphanumeric, hyphens, underscores
    return /^[a-zA-Z0-9_-]+$/.test(value);
  }, []);

  // Check slug availability (debounced)
  const checkSlugAvailability = useCallback(
    async (slugToCheck: string) => {
      if (!slugToCheck || slugToCheck.length < 3 || isEditMode) {
        setSlugAvailable(null);
        return;
      }

      setIsCheckingSlug(true);
      try {
        const response = await fetch(
          `/api/memorials/check-slug?slug=${encodeURIComponent(slugToCheck)}`
        );
        const data = await response.json();
        setSlugAvailable(data.available === true);
      } catch (error) {
        console.error("Failed to check slug:", error);
        setSlugAvailable(null);
      } finally {
        setIsCheckingSlug(false);
      }
    },
    [isEditMode]
  );

  const debouncedCheckSlug = useDebounce(checkSlugAvailability, 500);

  // Generate suggested slugs based on name
  const generateSuggestedSlugs = useCallback((first: string, last: string) => {
    const suggestions: string[] = [];
    const firstClean = first.toLowerCase().replace(/[^a-z0-9]/g, "");
    const lastClean = last.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (firstClean && lastClean) {
      suggestions.push(`${firstClean}-${lastClean}`);
      suggestions.push(`in-memory-of-${firstClean}-${lastClean}`);
      suggestions.push(`remembering-${firstClean}-${lastClean}`);
      suggestions.push(`${firstClean}${lastClean}-memorial`);
    }

    return suggestions.filter((s) => s.length >= 3 && s.length <= 50);
  }, []);

  // Handle slug change with validation
  const handleSlugChange = useCallback(
    (value: string) => {
      const cleaned = value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
      setSlug(cleaned);

      if (isValidSlug(cleaned) && !isEditMode) {
        debouncedCheckSlug(cleaned);
      } else {
        setSlugAvailable(null);
      }
    },
    [isValidSlug, isEditMode, debouncedCheckSlug]
  );

  // Handle suggested slug selection
  const handleSelectSuggested = useCallback(
    (suggested: string) => {
      setSlug(suggested);
      if (!isEditMode) {
        debouncedCheckSlug(suggested);
      }
    },
    [isEditMode, debouncedCheckSlug]
  );

  // Build preview URL - match the format: foreverpages.com/{slug}
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://foreverpages.com";
  const previewUrl = `${baseUrl}/${slug}`;

  // Initialize suggested slugs
  useEffect(() => {
    if (!existingSlug && firstName && lastName) {
      const suggestions = generateSuggestedSlugs(firstName, lastName);
      setSuggestedSlugs(suggestions);
      if (suggestions.length > 0 && !slug) {
        setSlug(suggestions[0]);
      }
    }
  }, [firstName, lastName, existingSlug, generateSuggestedSlugs, slug]);

  const handleClose = useCallback(() => {
    if (!isPending) {
      setSlug("");
      setShowSuccess(false);
      setPublishedUrl("");
      onClose();
    }
  }, [isPending, onClose]);

  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";
  const bgMuted = theme === "dark" ? "bg-white/5" : "bg-gray-50";
  const borderMuted = theme === "dark" ? "border-white/10" : "border-gray-200";
  const errorBg = theme === "dark" ? "bg-red-900/20" : "bg-red-50";
  const errorBorder = theme === "dark" ? "border-red-700" : "border-red-200";
  const errorText = theme === "dark" ? "text-red-400" : "text-red-600";

  // Keyboard shortcuts: Escape to close
  useEditorShortcuts({
    onEscape: handleClose,
    enabled: isOpen && !isPending,
  });

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
            <div className="relative">
              <Input
                id="slug"
                placeholder="beloved-mom"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                disabled={isPending || isEditMode}
                className="pr-10"
              />
              {isCheckingSlug && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {!isCheckingSlug && slugAvailable !== null && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {slugAvailable ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              )}
            </div>

            {/* Preview URL */}
            {slug && isValidSlug(slug) && (
              <div className={`text-xs ${textMuted} break-all`}>
                <span>{t("dashboard.pageBuilder.publish.previewUrl", {}, "Preview:")}</span>{" "}
                <span className="font-mono">{previewUrl}</span>
              </div>
            )}

            {/* Slug availability message */}
            {!isEditMode &&
              slug &&
              isValidSlug(slug) &&
              !isCheckingSlug &&
              slugAvailable === false && (
                <p className="text-xs text-red-500">
                  {t(
                    "dashboard.pageBuilder.publish.slugTaken",
                    {},
                    "This URL is already taken. Please choose another."
                  )}
                </p>
              )}

            {/* Suggested slugs */}
            {!isEditMode && suggestedSlugs.length > 0 && (
              <div className="space-y-2">
                <p className={`text-xs ${textMuted}`}>
                  {t("dashboard.pageBuilder.publish.suggestions", {}, "Suggested URLs:")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedSlugs.slice(0, 3).map((suggested) => (
                    <button
                      key={suggested}
                      type="button"
                      onClick={() => handleSelectSuggested(suggested)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        slug === suggested
                          ? "border-primary bg-primary/10"
                          : theme === "dark"
                            ? "border-white/10 hover:border-white/20"
                            : "border-gray-200 hover:border-gray-300"
                      }`}
                      disabled={isPending}
                    >
                      {suggested}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
            <ErrorMessage
              message={getErrorMessage(error, t)}
              variant={isNetworkError(error) ? "network" : "error"}
              onRetry={isNetworkError(error) ? handlePublish : undefined}
              className="mt-4"
            />
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleClose} variant="outline" className="flex-1" disabled={isPending}>
              {t("dashboard.pageBuilder.publish.cancel", {}, "Cancel")}
            </Button>
            <Button
              onClick={handlePublish}
              className="flex-1"
              disabled={
                !slug ||
                !isValidSlug(slug) ||
                isPending ||
                isCheckingSlug ||
                (!isEditMode && slugAvailable === false)
              }
            >
              {isPending && <Spinner size="sm" className="mr-2" />}
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
