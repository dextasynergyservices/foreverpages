import { useEffect, useRef, useCallback } from "react";

export interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean;
  message?: string;
  onBeforeUnload?: () => void;
}

/**
 * Hook to warn users before leaving with unsaved changes
 * Handles browser navigation (beforeunload) and provides programmatic warning helper
 */
export const useUnsavedChanges = (options: UseUnsavedChangesOptions) => {
  const { hasUnsavedChanges, message, onBeforeUnload } = options;
  const isNavigatingRef = useRef(false);

  const defaultMessage = message || "You have unsaved changes. Are you sure you want to leave?";

  // Handle browser beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isNavigatingRef.current) {
        // Call optional callback
        onBeforeUnload?.();

        // Standard way to show confirmation dialog
        e.preventDefault();
        e.returnValue = defaultMessage; // Chrome requires returnValue to be set
        return defaultMessage; // For older browsers
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, defaultMessage, onBeforeUnload]);

  // Create a warning function for programmatic navigation
  const warnBeforeNavigation = useCallback(
    (callback?: () => void): boolean => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(defaultMessage);
        if (confirmed) {
          isNavigatingRef.current = true;
          callback?.();
          return true;
        }
        return false;
      }
      isNavigatingRef.current = true;
      callback?.();
      return true;
    },
    [hasUnsavedChanges, defaultMessage]
  );

  return {
    warnBeforeNavigation,
    hasUnsavedChanges,
  };
};
