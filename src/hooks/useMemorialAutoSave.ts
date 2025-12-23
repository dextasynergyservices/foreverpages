import { useCallback, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "@/hooks/useTranslations";
import toast from "react-hot-toast";

export interface MemorialUpdateData {
  sections?: unknown;
  customization?: unknown;
  memorialData?: {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    deathDate?: string;
    biography?: string;
    profilePhoto?: string;
  };
}

export interface UseMemorialAutoSaveOptions {
  userTemplateId?: string;
  memorialSlug?: string; // Add memorial slug for saving memorial data
  enabled?: boolean;
  debounceMs?: number;
  isEditMode?: boolean;
  isPublished?: boolean;
}

export interface UseMemorialAutoSaveReturn {
  autoSave: (data: MemorialUpdateData) => void;
  isAutoSaving: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  lastSavedAt: Date | null;
}

/**
 * Hook for auto-saving memorial template data in edit mode
 * Only saves when the memorial is already published and in edit mode
 */
export const useMemorialAutoSave = (
  options: UseMemorialAutoSaveOptions = {}
): UseMemorialAutoSaveReturn => {
  const {
    userTemplateId,
    memorialSlug,
    enabled = true,
    debounceMs = 2000,
    isEditMode = false,
    isPublished = false,
  } = options;

  const { t } = useTranslations();
  const queryClient = useQueryClient();
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedAtRef = useRef<Date | null>(null);
  const lastDataRef = useRef<string | null>(null);

  // Only auto-save if in edit mode and memorial is published
  // Need at least one of userTemplateId (for template data) or memorialSlug (for memorial data)
  const shouldAutoSave = enabled && isEditMode && isPublished && (userTemplateId || memorialSlug);

  const updateMutation = useMutation({
    mutationFn: async (data: MemorialUpdateData) => {
      const { memorialData, customization, sections } = data;
      const updates: Array<Promise<Response>> = [];

      // Save memorial data to Memorial table if provided
      if (memorialData && memorialSlug) {
        const memorialUpdatePromise = fetch(`/api/memorial/${memorialSlug}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(memorialData),
        });
        updates.push(memorialUpdatePromise);
      }

      // Save template customization and sections to UserTemplate table if provided
      if ((customization || sections) && userTemplateId) {
        const templateUpdateData: Record<string, unknown> = {};
        if (customization !== undefined) templateUpdateData.customization = customization;
        if (sections !== undefined) templateUpdateData.sections = sections;

        const templateUpdatePromise = fetch(`/api/user/templates/${userTemplateId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templateUpdateData),
        });
        updates.push(templateUpdatePromise);
      }

      if (updates.length === 0) {
        throw new Error("No valid updates provided");
      }

      // Execute all updates in parallel
      const responses = await Promise.all(updates);

      // Check if all responses are OK
      for (const response of responses) {
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to save changes");
        }
      }

      return { success: true };
    },
    onSuccess: (_data) => {
      lastSavedAtRef.current = new Date();

      // Update relevant queries
      if (userTemplateId) {
        queryClient.invalidateQueries({ queryKey: ["user-template", userTemplateId] });
        queryClient.invalidateQueries({ queryKey: ["user-templates"] });
      }

      if (memorialSlug) {
        queryClient.invalidateQueries({ queryKey: ["memorial", memorialSlug] });
        queryClient.invalidateQueries({ queryKey: ["user-published-status"] });
      }

      // Show subtle success indicator
      toast.success(t("dashboard.pageBuilder.autoSave.saved", {}, "Changes saved"), {
        duration: 1500,
        position: "bottom-right",
        style: {
          fontSize: "13px",
          padding: "8px 12px",
        },
      });
    },
    onError: (error: Error) => {
      console.error("Auto-save error:", error);

      toast.error(t("dashboard.pageBuilder.autoSave.error", {}, "Failed to save changes"), {
        duration: 3000,
        position: "bottom-right",
      });
    },
  });

  const autoSave = useCallback(
    (data: MemorialUpdateData) => {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Only save if conditions are met
      if (!shouldAutoSave) {
        return;
      }

      // Check if data actually changed
      const dataString = JSON.stringify(data);
      if (dataString === lastDataRef.current) {
        return;
      }
      lastDataRef.current = dataString;

      // Set debounced timeout
      debounceTimeoutRef.current = setTimeout(() => {
        updateMutation.mutate(data);
      }, debounceMs);
    },
    [shouldAutoSave, debounceMs, updateMutation]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    autoSave,
    isAutoSaving: updateMutation.isPending,
    saveStatus: updateMutation.isPending
      ? "saving"
      : updateMutation.isError
        ? "error"
        : updateMutation.isSuccess
          ? "saved"
          : "idle",
    lastSavedAt: lastSavedAtRef.current,
  };
};
