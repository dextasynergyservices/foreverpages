import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface Memorial {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate: string;
  deathDate: string;
  biography?: string;
  profilePhoto?: string;
  coverPhoto?: string;
  isPublished: boolean;
  ownerId: string;
  owner: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  userTemplate?: {
    id: string;
    customization: unknown;
    sections: unknown;
    baseTemplate: {
      id: string;
      name: string;
      supportedSections: string[];
    };
  };
  posts?: unknown[];
  comments?: unknown[];
  timeline?: unknown[];
  family?: unknown[];
  candles?: unknown[];
  flowers?: unknown[];
  guestbook?: unknown[];
  viewCount: number;
  shareCount: number;
}

interface MemorialResponse {
  success: boolean;
  data?: {
    memorial: Memorial;
    isOwner: boolean;
  };
  error?: string;
}

export function useMemorial(slug: string | undefined) {
  return useQuery<MemorialResponse>({
    queryKey: ["memorial", slug],
    queryFn: async () => {
      if (!slug) {
        throw new Error("Slug is required");
      }

      const response = await fetch(`/api/memorial/${slug}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch memorial");
      }

      return data;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

interface UpdateMemorialData {
  isPublished?: boolean;
  [key: string]: unknown;
}

export function useUpdateMemorial(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateMemorialData) => {
      const response = await fetch(`/api/memorial/${slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update memorial");
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memorial", slug] });
      toast.success("Memorial updated successfully");
    },
    onError: (error: Error) => {
      console.error("Failed to update memorial:", error);
      toast.error(error.message || "Failed to update memorial");
    },
  });
}
