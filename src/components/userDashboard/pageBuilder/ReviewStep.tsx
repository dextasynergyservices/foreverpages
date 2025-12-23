import React, { useState, useMemo } from "react";
import { CheckCircle, AlertCircle, Copy, ExternalLink, Trash2, Link, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { PublishModal } from "./PublishModal";
import { DeleteMemorialModal } from "./DeleteMemorialModal";
import { SectionData } from "./DynamicSectionRenderer";
import toast from "react-hot-toast";

interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  features: string[];
}

interface ReviewStepProps {
  selectedTemplate: string;
  templates: Template[];
  userTemplateId?: string;
  firstName?: string;
  lastName?: string;
  onPublishSuccess?: (url: string) => void;
  isEditMode?: boolean;
  existingSlug?: string;
  memorialData?: {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    deathDate?: string;
    biography?: string;
  };
  sectionData?: SectionData;
  isInGracePeriod?: boolean;
  isSubscriptionExpired?: boolean;
  daysRemaining?: number;
  publishedMemorialUrl?: string;
  memorialId?: string;
  isPublished?: boolean;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  selectedTemplate,
  templates,
  userTemplateId,
  firstName = "",
  lastName = "",
  onPublishSuccess,
  isEditMode = false,
  existingSlug = "",
  memorialData,
  sectionData = {},
  isInGracePeriod = false,
  isSubscriptionExpired = false,
  daysRemaining,
  publishedMemorialUrl,
  memorialId,
  isPublished = false,
}) => {
  console.log("DEBUG: ReviewStep ALL props:", {
    isPublished,
    publishedMemorialUrl,
    memorialId,
    isEditMode,
    existingSlug,
    selectedTemplate,
    userTemplateId,
    firstName,
    lastName,
    memorialData,
  });

  const { theme } = useTheme();
  const { t } = useTranslations();
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [newSlug, setNewSlug] = useState("");

  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";
  const bgMuted = theme === "dark" ? "bg-white/5" : "bg-gray-50";
  const borderMuted = theme === "dark" ? "border-white/10" : "border-gray-200";

  // Validation checks
  const validationResults = useMemo(() => {
    const checks = {
      hasTemplate: isEditMode ? !!userTemplateId : !!selectedTemplate, // For new memorials, check selectedTemplate
      hasFirstName: !!(firstName || memorialData?.firstName),
      hasLastName: !!(lastName || memorialData?.lastName),
      hasSections: Object.keys(sectionData).length > 0,
      hasActiveSubscription: !isSubscriptionExpired,
    };

    const isValid = Object.values(checks).every(Boolean);
    return { checks, isValid };
  }, [
    userTemplateId,
    selectedTemplate,
    isEditMode,
    firstName,
    lastName,
    memorialData,
    sectionData,
    isSubscriptionExpired,
  ]);

  // Count configured sections
  const configuredSections = useMemo(() => {
    return Object.entries(sectionData).filter(([_, data]) => {
      if (!data || typeof data !== "object") return false;
      // Check if section has meaningful data
      const values = Object.values(data as Record<string, unknown>);
      return values.some(
        (v) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
      );
    }).length;
  }, [sectionData]);

  // Check if subscription is expiring soon (within 7 days)
  const isExpiringSoon = daysRemaining !== undefined && daysRemaining <= 7 && daysRemaining > 0;

  const handlePublishClick = () => {
    console.log("Debug: handlePublishClick called");
    console.log("Debug: validationResults", validationResults);
    console.log("Debug: userTemplateId", userTemplateId);
    console.log("Debug: firstName", firstName);
    console.log("Debug: lastName", lastName);
    console.log("Debug: memorialData", memorialData);

    if (!validationResults.isValid) {
      console.log("Debug: Validation failed, not opening modal");
      return;
    }

    console.log("Debug: Opening publish modal");
    setIsPublishModalOpen(true);
  };

  const handlePublishSuccess = (url: string) => {
    setIsPublishModalOpen(false);
    onPublishSuccess?.(url);
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(
        t("dashboard.pageBuilder.review.urlCopied", {}, "Memorial URL copied to clipboard!")
      );
    } catch {
      toast.error(t("dashboard.pageBuilder.review.copyFailed", {}, "Failed to copy URL"));
    }
  };

  // Handle unpublish memorial
  const handleUnpublishConfirm = () => {
    setShowUnpublishConfirm(true);
  };

  const handleUnpublish = async () => {
    console.log("DEBUG: Unpublish called with:", {
      existingSlug,
      memorialId,
      publishedMemorialUrl,
    });

    if (!existingSlug) {
      toast.error("Memorial slug not found");
      return;
    }

    try {
      const response = await fetch(`/api/memorial/${existingSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: false }),
      });

      const responseData = await response.json();
      console.log("DEBUG: Unpublish response:", responseData);

      if (!response.ok) {
        throw new Error(
          responseData.error || responseData.message || "Failed to unpublish memorial"
        );
      }

      toast.success(
        t("dashboard.pageBuilder.review.unpublishSuccess", {}, "Memorial unpublished successfully")
      );
      setShowUnpublishConfirm(false);

      // Refresh the page to reflect the new state
      window.location.reload();
    } catch (error: unknown) {
      console.error("Error unpublishing memorial:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(
        t(
          "dashboard.pageBuilder.review.unpublishError",
          {},
          `Failed to unpublish memorial: ${errorMessage}`
        )
      );
    }
  };

  // Handle edit slug
  const handleEditSlug = () => {
    const currentSlug = existingSlug || "";
    setNewSlug(currentSlug);
    setIsEditingSlug(true);
  };

  const handleSlugUpdate = async () => {
    if (!newSlug.trim() || !existingSlug || !memorialId) return;

    try {
      // Check slug availability first
      const checkResponse = await fetch(
        `/api/memorials/check-slug?slug=${encodeURIComponent(newSlug)}`
      );
      const checkData = await checkResponse.json();

      if (!checkData.available && newSlug !== existingSlug) {
        toast.error(t("dashboard.pageBuilder.review.slugTaken", {}, "This URL is already taken"));
        return;
      }

      // Update slug in Memorial table
      const response = await fetch(`/api/memorial/${existingSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: newSlug }),
      });

      if (!response.ok) throw new Error("Failed to update slug");

      toast.success(
        t("dashboard.pageBuilder.review.slugUpdateSuccess", {}, "Memorial URL updated successfully")
      );
      setIsEditingSlug(false);

      // Refresh to reflect the new URL
      window.location.reload();
    } catch (error) {
      console.error("Error updating slug:", error);
      toast.error(
        t("dashboard.pageBuilder.review.slugUpdateError", {}, "Failed to update memorial URL")
      );
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Validation Status - Only show for NON-published memorials */}
      {!isPublished && !validationResults.isValid && (
        <div
          className={`p-4 rounded-lg border ${
            theme === "dark"
              ? "bg-yellow-900/20 border-yellow-700"
              : "bg-yellow-50 border-yellow-200"
          }`}
        >
          <div className="flex gap-3">
            <AlertCircle
              className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                theme === "dark" ? "text-yellow-400" : "text-yellow-700"
              }`}
            />
            <div>
              <p
                className={`text-sm font-medium ${
                  theme === "dark" ? "text-yellow-400" : "text-yellow-700"
                }`}
              >
                {t(
                  "dashboard.pageBuilder.review.validationRequired",
                  {},
                  "Please complete the following before publishing:"
                )}
              </p>
              <ul className={`text-sm mt-2 space-y-1 ${textMuted}`}>
                {!validationResults.checks.hasFirstName && (
                  <li>
                    •{" "}
                    {t(
                      "dashboard.pageBuilder.review.missingFirstName",
                      {},
                      "Add first name in Hero section"
                    )}
                  </li>
                )}
                {!validationResults.checks.hasLastName && (
                  <li>
                    •{" "}
                    {t(
                      "dashboard.pageBuilder.review.missingLastName",
                      {},
                      "Add last name in Hero section"
                    )}
                  </li>
                )}
                {!validationResults.checks.hasSections && (
                  <li>
                    •{" "}
                    {t(
                      "dashboard.pageBuilder.review.missingSections",
                      {},
                      "Configure at least one section"
                    )}
                  </li>
                )}
                {!validationResults.checks.hasActiveSubscription && (
                  <li>
                    •{" "}
                    {t(
                      "dashboard.pageBuilder.review.expiredSubscription",
                      {},
                      "Renew subscription to publish memorial"
                    )}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Warning */}
      {(isInGracePeriod || isExpiringSoon) && !isSubscriptionExpired && (
        <div
          className={`p-4 rounded-lg border ${
            theme === "dark"
              ? "bg-orange-900/20 border-orange-700"
              : "bg-orange-50 border-orange-200"
          }`}
        >
          <div className="flex gap-3">
            <AlertCircle
              className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                theme === "dark" ? "text-orange-400" : "text-orange-700"
              }`}
            />
            <div>
              <p
                className={`text-sm font-medium ${
                  theme === "dark" ? "text-orange-400" : "text-orange-700"
                }`}
              >
                {isInGracePeriod
                  ? t(
                      "dashboard.pageBuilder.review.gracePeriodWarning",
                      {},
                      "Subscription in Grace Period"
                    )
                  : t(
                      "dashboard.pageBuilder.review.expiringWarning",
                      {},
                      "Subscription Expiring Soon"
                    )}
              </p>
              <p className={`text-sm mt-1 ${textMuted}`}>
                {isInGracePeriod
                  ? t(
                      "dashboard.pageBuilder.review.gracePeriodMessage",
                      {},
                      "Your subscription has expired but you're still in the grace period. Please renew soon to avoid service interruption."
                    )
                  : t(
                      "dashboard.pageBuilder.review.expiringMessage",
                      { days: daysRemaining || 0 },
                      `Your subscription expires in ${daysRemaining || 0} day${(daysRemaining || 0) === 1 ? "" : "s"}. Consider renewing soon.`
                    )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Memorial URL for Published Memorials */}
      {(() => {
        console.log("DEBUG: Memorial URL conditions:", {
          isPublished,
          publishedMemorialUrl,
          shouldShow: isPublished && publishedMemorialUrl,
        });
        return null;
      })()}
      {isPublished && (memorialId || publishedMemorialUrl) && (
        <div className={`p-4 rounded-lg border ${borderMuted} ${bgMuted}`}>
          <div className="flex items-center gap-2 mb-3">
            <Link className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-green-600">
              {t("dashboard.pageBuilder.review.memorialPublished", {}, "Memorial is Live")}
            </h4>
          </div>

          <div className="space-y-3">
            <div className={`p-3 rounded border ${borderMuted} bg-background`}>
              <p className={`text-sm ${textMuted} mb-1`}>
                {t("dashboard.pageBuilder.review.memorialUrl", {}, "Memorial URL:")}
              </p>
              {!isEditingSlug ? (
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono truncate">{publishedMemorialUrl}</code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(publishedMemorialUrl || "")}
                    className="h-8"
                    title="Copy URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditSlug}
                    className="h-8"
                    title="Edit URL"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(publishedMemorialUrl, "_blank")}
                    className="h-8"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value)}
                      placeholder="Enter new URL slug"
                      className="flex-1"
                    />
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSlugUpdate}
                      disabled={!newSlug.trim() || newSlug === existingSlug}
                      className="h-8"
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingSlug(false)}
                      className="h-8"
                    >
                      Cancel
                    </Button>
                  </div>
                  <p className={`text-xs ${textMuted}`}>
                    {t(
                      "dashboard.pageBuilder.review.editSlugHint",
                      {},
                      "This will change your memorial's web address. Make sure to update any shared links."
                    )}
                  </p>
                </div>
              )}
            </div>

            <p className={`text-sm ${textMuted} text-center`}>
              {t(
                "dashboard.pageBuilder.review.autoSaveNote",
                {},
                "Changes are automatically saved and will be reflected immediately on your live memorial."
              )}
            </p>
          </div>
        </div>
      )}

      {/* Review Card */}
      <div className={`p-8 rounded-lg border ${borderMuted} ${bgMuted} text-center`}>
        <h3 className="text-2xl font-serif font-semibold mb-2">
          {isEditMode
            ? t("dashboard.pageBuilder.review.titleEdit", {}, "Ready to Update Memorial")
            : t("dashboard.pageBuilder.review.title", {}, "Ready to Publish Memorial")}
        </h3>
        <p className={`mb-6 ${textMuted}`}>
          {isEditMode
            ? t(
                "dashboard.pageBuilder.review.descriptionEdit",
                {},
                "Your memorial updates are ready to be published. The changes will be reflected immediately."
              )
            : t(
                "dashboard.pageBuilder.review.description",
                {},
                "Your beautiful memorial page is ready to be published. You can always edit and add more content later."
              )}
        </p>

        {/* Memorial Summary */}
        <div
          className={`space-y-3 text-left p-6 rounded-lg border ${borderMuted} bg-background/50`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-sm ${textMuted}`}>
              {t("dashboard.pageBuilder.review.memorialFor", {}, "Memorial for:")}
            </span>
            <span className="text-sm font-semibold">
              {firstName || memorialData?.firstName || ""}{" "}
              {lastName || memorialData?.lastName || ""}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${textMuted}`}>
              {t("dashboard.pageBuilder.review.templateLabel", {}, "Template:")}
            </span>
            <span className={`text-sm font-medium`}>
              {templates.find((t) => t.id === selectedTemplate)?.name}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${textMuted}`}>
              {t("dashboard.pageBuilder.review.sectionsConfigured", {}, "Sections Configured:")}
            </span>
            <span className="text-sm font-medium flex items-center gap-1">
              {configuredSections > 0 ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {configuredSections}
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />0
                </>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${textMuted}`}>
              {t("dashboard.pageBuilder.review.privacyLabel", {}, "Privacy:")}
            </span>
            <span className={`text-sm font-medium`}>
              {t("dashboard.pageBuilder.review.privacyValue", {}, "Public")}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {/* Dynamic Publish/Unpublish Button */}
        {isPublished ? (
          <Button variant="outline" onClick={handleUnpublishConfirm} className="w-full" size="lg">
            {t("dashboard.pageBuilder.review.unpublishButton", {}, "Unpublish Memorial")}
          </Button>
        ) : (
          <Button
            onClick={() => {
              console.log("DEBUG: Button clicked directly!");
              handlePublishClick();
            }}
            disabled={!validationResults.isValid}
            className="w-full"
            size="lg"
          >
            {isEditMode
              ? t("dashboard.pageBuilder.review.updateButton", {}, "Update Memorial")
              : t("dashboard.pageBuilder.review.publishButton", {}, "Publish Memorial")}
          </Button>
        )}

        {/* Delete Button for Published Memorials */}
        {isPublished && (memorialId || publishedMemorialUrl) && (
          <Button
            variant="destructive"
            size="lg"
            className="w-full"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("dashboard.pageBuilder.review.deleteMemorial", {}, "Delete Memorial")}
          </Button>
        )}
      </div>

      {/* Help Text */}
      {validationResults.isValid && (
        <p className={`text-center text-sm ${textMuted}`}>
          {isPublished
            ? t(
                "dashboard.pageBuilder.review.editModeHelpText",
                {},
                "Your memorial is live. Any updates will be reflected immediately."
              )
            : t(
                "dashboard.pageBuilder.review.helpText",
                {},
                "Once published, your memorial will be live and accessible to anyone with the link."
              )}
        </p>
      )}

      {/* Publish Modal */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onSuccess={handlePublishSuccess}
        userTemplateId={userTemplateId || ""} // Allow empty for new memorials
        firstName={firstName || memorialData?.firstName || ""}
        lastName={lastName || memorialData?.lastName || ""}
        isEditMode={isEditMode}
        existingSlug={existingSlug}
      />

      {/* Delete Memorial Modal */}
      {(memorialId || publishedMemorialUrl) && (
        <DeleteMemorialModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          memorialId={memorialId || ""}
          memorialName={`${firstName || memorialData?.firstName || ""} ${lastName || memorialData?.lastName || ""}`}
          memorialUrl={publishedMemorialUrl}
          memorialSlug={existingSlug || ""}
        />
      )}

      {/* Unpublish Confirmation Dialog */}
      <Dialog open={showUnpublishConfirm} onOpenChange={setShowUnpublishConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("dashboard.pageBuilder.review.unpublishConfirmTitle", {}, "Unpublish Memorial?")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "dashboard.pageBuilder.review.unpublishConfirmMessage",
                {},
                "Are you sure you want to unpublish this memorial? The memorial page will no longer be accessible to visitors until you publish it again."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnpublishConfirm(false)}>
              {t("common.cancel", {}, "Cancel")}
            </Button>
            <Button variant="destructive" onClick={handleUnpublish}>
              {t("dashboard.pageBuilder.review.confirmUnpublish", {}, "Unpublish Memorial")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
