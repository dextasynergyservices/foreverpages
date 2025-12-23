import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export interface DeleteMemorialData {
  memorialId: string;
  confirmationName: string;
}

export interface DeleteMemorialResponse {
  success: boolean;
  message: string;
}

/**
 * Hook for deleting a memorial and its associated user template
 * Requires user to type their name for confirmation
 */
export const useDeleteMemorial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DeleteMemorialData): Promise<DeleteMemorialResponse> => {
      const response = await fetch(`/api/user/memorials/${data.memorialId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmationName: data.confirmationName,
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
