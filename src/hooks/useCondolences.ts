"use client";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import type { Post, Comment } from "@/generated/prisma";

export interface CondolenceAuthor {
  id: string;
  name: string | null;
  image: string | null;
}

export interface CondolenceComment extends Comment {
  author: CondolenceAuthor;
}

export interface Condolence extends Post {
  author: CondolenceAuthor;
  comments: CondolenceComment[];
  _count: {
    comments: number;
  };
}

export interface CondolenceInput {
  content: string;
  isAnonymous?: boolean;
}

interface CondolencesResponse {
  success: boolean;
  data: Condolence[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
  error?: string;
}

interface CondolenceResponse {
  success: boolean;
  data: Condolence;
  error?: string;
}

/**
 * Fetch condolences for a memorial with pagination
 */
async function fetchCondolences(
  memorialId: string,
  page: number = 1,
  limit: number = 20
): Promise<CondolencesResponse> {
  const response = await fetch(
    `/api/memorial/${memorialId}/condolences?page=${page}&limit=${limit}`
  );
  const result: CondolencesResponse = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to fetch condolences");
  }

  return result;
}

/**
 * Create a new condolence
 */
async function createCondolence(memorialId: string, data: CondolenceInput): Promise<Condolence> {
  const response = await fetch(`/api/memorial/${memorialId}/condolences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result: CondolenceResponse = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to create condolence");
  }

  return result.data;
}

/**
 * Delete a condolence
 */
async function deleteCondolence(memorialId: string, postId: string): Promise<void> {
  const response = await fetch(`/api/memorial/${memorialId}/condolences?postId=${postId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || "Failed to delete condolence");
  }
}

/**
 * Hook to fetch condolences with pagination
 */
export function useCondolences(
  memorialId: string | null | undefined,
  options?: { limit?: number }
) {
  const limit = options?.limit || 20;

  return useQuery({
    queryKey: ["condolences", memorialId, { limit }],
    queryFn: () => fetchCondolences(memorialId!, 1, limit),
    enabled: !!memorialId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch condolences with infinite scroll
 */
export function useInfiniteCondolences(
  memorialId: string | null | undefined,
  options?: { limit?: number }
) {
  const limit = options?.limit || 10;

  return useInfiniteQuery({
    queryKey: ["condolences", "infinite", memorialId],
    queryFn: ({ pageParam = 1 }) => fetchCondolences(memorialId!, pageParam, limit),
    enabled: !!memorialId,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to create a new condolence
 */
export function useCreateCondolence(memorialId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CondolenceInput) => createCondolence(memorialId, data),
    onSuccess: () => {
      // Invalidate all condolences queries for this memorial
      queryClient.invalidateQueries({ queryKey: ["condolences", memorialId] });
      queryClient.invalidateQueries({
        queryKey: ["condolences", "infinite", memorialId],
      });
    },
  });
}

/**
 * Hook to delete a condolence
 */
export function useDeleteCondolence(memorialId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => deleteCondolence(memorialId, postId),
    onSuccess: () => {
      // Invalidate all condolences queries for this memorial
      queryClient.invalidateQueries({ queryKey: ["condolences", memorialId] });
      queryClient.invalidateQueries({
        queryKey: ["condolences", "infinite", memorialId],
      });
    },
  });
}

/**
 * Format date for display
 */
export function formatCondolenceDate(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return "Just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  } else {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}
