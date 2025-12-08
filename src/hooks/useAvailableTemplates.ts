import { useQuery } from "@tanstack/react-query";

export interface AvailableTemplate {
  id: string;
  name: string;
  slug: string;
  description?: string;
  previewImage: string;
  thumbnailImage: string;
  supportedSections: string[];
  layoutType: string;
  isFeatured: boolean;
  displayOrder: number;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface SubscriptionInfo {
  status: "ACTIVE" | "EXPIRED" | "GRACE_PERIOD" | "INACTIVE";
  expiresAt?: string;
  inGracePeriod: boolean;
  planName?: string;
}

export interface AvailableTemplatesResponse {
  templates: AvailableTemplate[];
  subscription: SubscriptionInfo;
}

export const useAvailableTemplates = () => {
  return useQuery({
    queryKey: ["available-templates"],
    queryFn: async (): Promise<AvailableTemplatesResponse> => {
      const response = await fetch("/api/user/subscription/available-templates");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch available templates");
      }
      const data = await response.json();
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};
