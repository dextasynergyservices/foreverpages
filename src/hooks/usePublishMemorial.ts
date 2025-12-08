import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface PublishMemorialData {
  userTemplateId: string;
  slug: string;
  firstName: string;
  lastName: string;
}

export interface PublishMemorialResponse {
  memorialId: string;
  slug: string;
  publishedUrl: string;
  isPublished: boolean;
}

export const usePublishMemorial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PublishMemorialData): Promise<PublishMemorialResponse> => {
      const response = await fetch("/api/memorials/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to publish memorial");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-templates"] });
      queryClient.invalidateQueries({ queryKey: ["memorials"] });
      queryClient.invalidateQueries({ queryKey: ["available-templates"] });
    },
  });
};
