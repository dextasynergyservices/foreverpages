import { useQuery } from "@tanstack/react-query";
import { TemplateConfiguration } from "@/types/formConfig";

export interface UseTemplateConfigOptions {
  templateId?: string;
  enabled?: boolean;
}

export const useTemplateConfig = (options: UseTemplateConfigOptions = {}) => {
  const { templateId, enabled = true } = options;

  return useQuery({
    queryKey: ["template-config", templateId],
    queryFn: async (): Promise<TemplateConfiguration> => {
      if (!templateId) {
        throw new Error("Template ID is required");
      }

      const response = await fetch(`/api/templates/${templateId}/config`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch template configuration");
      }

      const data = await response.json();
      return data.data;
    },
    enabled: enabled && !!templateId,
    staleTime: 10 * 60 * 1000, // 10 minutes - template config rarely changes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};
