import { useQuery } from "@tanstack/react-query";

interface Memorial {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  deathDate: string;
  profileImage: string | null;
  createdAt: string;
}

interface MemorialsResponse {
  message: string;
  data: {
    memorials: Memorial[];
  };
}

export function useMemorials() {
  return useQuery<MemorialsResponse, Error>({
    queryKey: ["user-memorials"],
    queryFn: async () => {
      const response = await fetch("/api/user/memorials");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch memorials");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

export type { Memorial };
