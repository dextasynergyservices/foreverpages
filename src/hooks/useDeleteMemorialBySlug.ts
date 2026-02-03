import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export interface DeleteMemorialBySlugData {
  memorialId: string;
  confirmationSlug: string;
}

export interface DeleteMemorialBySlugResponse {
  success: boolean;
  message: string;
  data?: {
    memorialId: string;
    slug: string;
  };
}

/**
 * Hook for deleting a memorial from page builder
 * Requires user to type the memorial slug for confirmation
 */
export const useDeleteMemorialBySlug = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DeleteMemorialBySlugData): Promise<DeleteMemorialBySlugResponse> => {
      const response = await fetch(`/api/memorials/${data.memorialId}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmationSlug: data.confirmationSlug,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || "Failed to delete memorial");
      }

      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["user-templates"] });
      queryClient.invalidateQueries({ queryKey: ["memorials"] });
      queryClient.invalidateQueries({ queryKey: ["available-templates"] });

      // Show success toast
      toast.success(data.message || "Memorial deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete memorial");
    },
  });
};
