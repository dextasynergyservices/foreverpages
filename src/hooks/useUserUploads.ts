import { useQuery } from "@tanstack/react-query";

export interface UserUpload {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  url: string;
  publicId: string;
  thumbnailUrl: string | null;
  type: "IMAGE" | "VIDEO";
  width: number | null;
  height: number | null;
  duration: number | null;
  title: string | null;
  description: string | null;
  album: string | null;
  uploaderId: string;
  memorialId: string | null;
  createdAt: string;
  updatedAt: string;
  memorial?: {
    id: string;
    name: string;
  } | null;
}

export interface UserUploadsResponse {
  success: boolean;
  data: {
    uploads: UserUpload[];
    plan: {
      name: string;
      limits: {
        images: {
          used: number;
          max: number;
          remaining: number;
        };
        videos: {
          used: number;
          max: number;
          remaining: number;
        };
      };
    };
    albums: string[];
  };
}

export interface UseUserUploadsOptions {
  type?: "IMAGE" | "VIDEO" | null;
  search?: string;
  album?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch user's media uploads with filtering and pagination
 */
export function useUserUploads(options: UseUserUploadsOptions = {}) {
  const { type, search, album, page = 1, limit = 20, enabled = true } = options;

  return useQuery<UserUploadsResponse>({
    queryKey: ["user-uploads", { type, search, album, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.append("type", type);
      if (search) params.append("search", search);
      if (album) params.append("album", album);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await fetch(`/api/user/media?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch uploads");
      }

      return response.json();
    },
    enabled,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch only images from user's uploads
 */
export function useUserImages(options: Omit<UseUserUploadsOptions, "type"> = {}) {
  return useUserUploads({ ...options, type: "IMAGE" });
}

/**
 * Hook to fetch only videos from user's uploads
 */
export function useUserVideos(options: Omit<UseUserUploadsOptions, "type"> = {}) {
  return useUserUploads({ ...options, type: "VIDEO" });
}
