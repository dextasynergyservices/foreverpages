import { useCallback } from "react";
import { DesignTokens } from "@/components/userDashboard/pageBuilder/TemplateCustomizer";

/**
 * Hook for managing design token persistence
 * Handles loading and saving custom design tokens to the database
 */
export const useDesignTokens = (templateId: string | null) => {
  const saveDesignTokens = useCallback(
    async (tokens: DesignTokens) => {
      if (!templateId) {
        console.warn("Cannot save design tokens: templateId is null");
        return false;
      }

      try {
        const response = await fetch(`/api/user/templates/${templateId}/customization`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tokens),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("Failed to save design tokens:", error);
          return false;
        }

        const data = await response.json();
        console.log("Design tokens saved successfully:", data);
        return true;
      } catch (error) {
        console.error("Error saving design tokens:", error);
        return false;
      }
    },
    [templateId]
  );

  const loadDesignTokens = useCallback(async (): Promise<DesignTokens | null> => {
    if (!templateId) {
      console.warn("Cannot load design tokens: templateId is null");
      return null;
    }

    try {
      const response = await fetch(`/api/user/templates/${templateId}/customization`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to load design tokens:", error);
        return null;
      }

      const data = await response.json();
      return data.data.config as DesignTokens;
    } catch (error) {
      console.error("Error loading design tokens:", error);
      return null;
    }
  }, [templateId]);

  return {
    saveDesignTokens,
    loadDesignTokens,
  };
};
