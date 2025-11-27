import { useQuery } from "@tanstack/react-query";

export interface BaseTemplate {
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
  usageCount: number;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export const useBaseTemplates = () => {
  return useQuery({
    queryKey: ["base-templates"],
    queryFn: async (): Promise<BaseTemplate[]> => {
      const response = await fetch("/api/templates");
      if (!response.ok) {
        throw new Error("Failed to fetch base templates");
      }
      const data = await response.json();
      return data.data.templates;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};
