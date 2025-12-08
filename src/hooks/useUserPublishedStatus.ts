import { useQuery } from "@tanstack/react-query";

export interface UserPublishedStatus {
  hasPublished: boolean;
  publishedMemorial?: {
    id: string;
    slug: string;
    firstName: string;
    lastName: string;
  };
}

export const useUserPublishedStatus = () => {
  return useQuery({
    queryKey: ["user-published-status"],
    queryFn: async (): Promise<UserPublishedStatus> => {
      const response = await fetch("/api/user/published-status");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch published status");
      }
      const data = await response.json();
      return data.data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};
