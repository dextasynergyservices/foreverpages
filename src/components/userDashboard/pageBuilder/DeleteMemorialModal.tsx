"use client";

import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { useDeleteMemorial } from "@/hooks/useDeleteMemorial";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/skeleton-loader";

interface DeleteMemorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  memorialId: string;
  memorialName: string;
  memorialUrl?: string;
  memorialSlug: string;
}

/**
 * Modal for deleting a memorial with confirmation
 * Requires user to type the deceased person's full name to confirm deletion
 */
export const DeleteMemorialModal: React.FC<DeleteMemorialModalProps> = ({
  isOpen,
  onClose,
  memorialId,
  memorialName,
  memorialUrl,
  memorialSlug,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const router = useRouter();
  const [confirmationInput, setConfirmationInput] = useState("");

  const { mutate: deleteMemorial, isPending } = useDeleteMemorial();

  // Only run validation logic when modal is open
  const expectedConfirmation = isOpen ? memorialSlug : "";
  const hasInput = isOpen ? confirmationInput.trim().length > 0 : false;
  const hasExpected = isOpen ? expectedConfirmation.length > 0 : false;
  const isExactMatch = isOpen ? confirmationInput.trim() === expectedConfirmation : false;
  const isConfirmationValid = isOpen ? hasInput && hasExpected && isExactMatch : false;

  // Only log validation details when modal is open
  if (isOpen) {
    console.log("DEBUG: Delete Modal Props:", {
      memorialSlug,
      expectedConfirmation: memorialSlug,
      confirmationInput,
    });

    console.log("DEBUG: Validation Details:", {
      confirmationInput: `'${confirmationInput}'`,
      trimmedInput: `'${confirmationInput.trim()}'`,
      expectedConfirmation: `'${expectedConfirmation}'`,
      hasInput,
      hasExpected,
      isExactMatch,
      isConfirmationValid,
    });
  }

  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";
  const bgMuted = theme === "dark" ? "bg-white/5" : "bg-gray-50";
  const borderMuted = theme === "dark" ? "border-white/10" : "border-gray-200";
  const warningBg = theme === "dark" ? "bg-yellow-900/20" : "bg-yellow-50";
  const warningBorder = theme === "dark" ? "border-yellow-700" : "border-yellow-200";
  const warningText = theme === "dark" ? "text-yellow-400" : "text-yellow-700";

  const handleDelete = useCallback(() => {
    if (!isConfirmationValid) return;

    deleteMemorial(
      {
        memorialId,
        confirmationName: confirmationInput.trim(),
      },
      {
        onSuccess: () => {
          setConfirmationInput("");
          onClose();
          // Redirect to dashboard after successful deletion
          router.push("/dashboard");
        },
      }
    );
  }, [memorialId, confirmationInput, isConfirmationValid, deleteMemorial, onClose, router]);

  const handleClose = useCallback(() => {
    if (!isPending) {
      setConfirmationInput("");
      onClose();
    }
  }, [isPending, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t("dashboard.pageBuilder.deleteMemorial.title", {}, "Delete Memorial")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "dashboard.pageBuilder.deleteMemorial.description",
              {},
              "This action cannot be undone. This will permanently delete the memorial."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Box */}
          <div className={`p-4 rounded-lg border ${warningBg} ${warningBorder}`}>
            <div className="flex gap-3">
              <AlertTriangle className={`h-5 w-5 ${warningText} flex-shrink-0 mt-0.5`} />
              <div className="space-y-2">
                <p className={`text-sm font-medium ${warningText}`}>
                  {t(
                    "dashboard.pageBuilder.deleteMemorial.warning",
                    {},
                    "Warning: Permanent Deletion"
                  )}
                </p>
                <ul className={`text-sm ${warningText} space-y-1 list-disc list-inside`}>
                  <li>
                    {t(
                      "dashboard.pageBuilder.deleteMemorial.consequence1",
                      {},
                      "The memorial page will be permanently removed"
                    )}
                  </li>
                  <li>
                    {t(
                      "dashboard.pageBuilder.deleteMemorial.consequence2",
                      {},
                      "All customization and content will be lost"
                    )}
                  </li>
                  <li>
                    {t(
                      "dashboard.pageBuilder.deleteMemorial.consequence3",
                      {},
                      "The memorial URL will become unavailable"
                    )}
                  </li>
                  <li>
                    {t(
                      "dashboard.pageBuilder.deleteMemorial.consequence4",
                      {},
                      "This action cannot be undone"
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Memorial Info */}
          <div className={`p-3 rounded-lg ${bgMuted} border ${borderMuted}`}>
            <div className="space-y-2">
              <div>
                <p className={`text-xs ${textMuted}`}>
                  {t("dashboard.pageBuilder.deleteMemorial.memorialName", {}, "Memorial Name:")}
                </p>
                <p className="font-semibold">{memorialName}</p>
              </div>
              {memorialUrl && (
                <div>
                  <p className={`text-xs ${textMuted}`}>
                    {t("dashboard.pageBuilder.deleteMemorial.memorialUrl", {}, "Memorial URL:")}
                  </p>
                  <p className="text-sm font-mono truncate">{memorialUrl}</p>
                </div>
              )}
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmation-input">
              {t(
                "dashboard.pageBuilder.deleteMemorial.confirmationLabel",
                {},
                "Type the memorial slug to confirm deletion"
              )}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="confirmation-input"
              placeholder={expectedConfirmation}
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              disabled={isPending}
              autoComplete="off"
            />
            <p className={`text-xs ${textMuted}`}>
              {t(
                "dashboard.pageBuilder.deleteMemorial.confirmationHint",
                { name: expectedConfirmation },
                `Type "${expectedConfirmation}" to confirm`
              )}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            onClick={handleClose}
            variant="outline"
            className="w-full sm:w-auto"
            disabled={isPending}
          >
            {t("common.cancel", {}, "Cancel")}
          </Button>
          <Button
            onClick={handleDelete}
            variant="destructive"
            className="w-full sm:w-auto"
            disabled={!isConfirmationValid}
          >
            {isPending ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                {t("dashboard.pageBuilder.deleteMemorial.deleting", {}, "Deleting...")}
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                {t("dashboard.pageBuilder.deleteMemorial.deleteButton", {}, "Delete Memorial")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
