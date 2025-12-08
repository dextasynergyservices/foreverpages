import { useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "@/hooks/useTranslations";
import toast from "react-hot-toast";

export interface DraftData {
  [key: string]: unknown;
}

export interface UseAutoSaveOptions {
  memorialId?: string;
  enabled?: boolean;
  debounceMs?: number;
  onSuccess?: (data: DraftData) => void;
  onError?: (error: Error) => void;
}

export interface UseAutoSaveReturn {
  autoSave: (data: DraftData) => Promise<void>;
  isAutoSaving: boolean;
  autoSaveError: Error | null;
  saveStatus: "idle" | "saving" | "saved" | "error";
  lastSavedAt: Date | null;
}

/**
 * Hook for auto-saving memorial draft data
 * Handles debouncing, optimistic updates, and error recovery
 */
export const useAutoSave = (options: UseAutoSaveOptions = {}): UseAutoSaveReturn => {
  const { memorialId, enabled = true, debounceMs = 1000, onSuccess, onError } = options;

  const { t } = useTranslations();
  const queryClient = useQueryClient();
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSavedAtRef = useRef<Date | null>(null);

  const saveDraftMutation = useMutation({
    mutationFn: async (data: DraftData) => {
      if (!memorialId) {
        throw new Error("Memorial ID is required");
      }

      const response = await fetch(`/api/memorials/${memorialId}/draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save draft");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      lastSavedAtRef.current = new Date();

      // Update cache for draft query
      queryClient.setQueryData(["memorial-draft", memorialId], data);

      // Show brief success notification
      toast.success(t("dashboard.pageBuilder.form.draftSaved", {}, "Draft saved"), {
        duration: 1500,
        icon: "✓",
      });

      onSuccess?.(data);
    },
    onError: (error: Error) => {
      console.error("Auto-save error:", error);

      // Show error notification
      toast.error(t("dashboard.pageBuilder.form.draftSaveError", {}, "Failed to save draft"), {
        duration: 3000,
      });

      onError?.(error);
    },
  });

  // Debounced auto-save function
  const autoSave = useCallback(
    (data: DraftData) => {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Only save if enabled and memorial ID is available
      if (!enabled || !memorialId) {
        return Promise.resolve();
      }

      // Set new timeout
      return new Promise<void>((resolve) => {
        debounceTimeoutRef.current = setTimeout(() => {
          saveDraftMutation.mutate(data, {
            onSuccess: () => resolve(),
            onError: () => resolve(), // Resolve even on error to prevent blocking UI
          });
        }, debounceMs);
      });
    },
    [memorialId, enabled, debounceMs, saveDraftMutation]
  );

  // Determine save status
  let saveStatus: "idle" | "saving" | "saved" | "error" = "idle";
  if (saveDraftMutation.isPending) {
    saveStatus = "saving";
  } else if (saveDraftMutation.isError) {
    saveStatus = "error";
  } else if (lastSavedAtRef.current) {
    saveStatus = "saved";
  }

  return {
    autoSave,
    isAutoSaving: saveDraftMutation.isPending,
    autoSaveError: saveDraftMutation.error,
    saveStatus,
    lastSavedAt: lastSavedAtRef.current,
  };
};
