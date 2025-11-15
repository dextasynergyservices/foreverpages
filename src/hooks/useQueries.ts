import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types for API responses
export interface Memorial {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Generic API fetch function
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Memorial queries
export function useMemorials(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["memorials", { page, limit }],
    queryFn: () =>
      apiFetch<{ memorials: Memorial[]; total: number; pages: number }>(
        `/api/memorials?page=${page}&limit=${limit}`
      ),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMemorial(id: string) {
  return useQuery({
    queryKey: ["memorial", id],
    queryFn: () => apiFetch<Memorial>(`/api/memorials/${id}`),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// User queries
export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await fetch("/api/user/profile");
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      return response.json() as Promise<{ message: string; user: User }>;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Mutations
export function useCreateMemorial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Memorial>) =>
      apiFetch<Memorial>("/api/memorials", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      // Invalidate and refetch memorials
      queryClient.invalidateQueries({ queryKey: ["memorials"] });
    },
  });
}

// Gallery/Media queries
export function useGallery() {
  return useQuery({
    queryKey: ["gallery"],
    queryFn: () =>
      apiFetch<{
        media: Array<{
          id: string;
          url: string;
          title: string;
          type: "image" | "video";
          createdAt: string;
        }>;
      }>("/api/gallery"),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Analytics queries
export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: () =>
      apiFetch<{
        stats: Array<{
          titleKey: string;
          value: string;
          change: string;
          trend: "up" | "down";
          icon: string;
          descriptionKey: string;
        }>;
        recentActivity: Array<{
          actionKey: string;
          actionParams: Record<string, string>;
          time: string;
          type: "tribute" | "memorial";
        }>;
        topPages: Array<{
          pageKey: string;
          views: number;
          percentage: number;
        }>;
      }>("/api/analytics"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Invitations queries
export interface Invitation {
  id: string;
  email: string;
  name: string;
  phone?: string;
  status: "pending" | "accepted" | "declined" | "expired" | "revoked";
  rsvp: "yes" | "no" | "maybe" | null;
  rsvpStatus?: "ATTENDING" | "NOT_ATTENDING" | "MAYBE" | null;
  rsvpMessage?: string | null;
  rsvpAt?: string | null;
  message?: string | null;
  expiresAt?: string;
  sentViaEmail?: boolean;
  sentViaWhatsApp?: boolean;
  createdAt?: string;
  updatedAt?: string;
  plusOnes?: number;
  dietaryRestrictions?: string;
  accessibilityNeeds?: string;
  specialRequests?: string;
}

export function useInvitations() {
  return useQuery({
    queryKey: ["invitations"],
    queryFn: () =>
      apiFetch<{
        invitations: Invitation[];
      }>("/api/invitations"),
    staleTime: 10 * 1000, // 10 seconds - refetch more frequently for RSVP updates
    refetchInterval: 15 * 1000, // Auto-refetch every 15 seconds
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Refetch when component mounts
  });
}

// Tributes queries
export interface Tribute {
  id: string;
  author: string;
  email: string;
  message: string;
  date: string;
  status: "pending" | "approved" | "rejected" | "flagged";
  createdAt: string;
  updatedAt: string;
}

export function useTributes() {
  return useQuery({
    queryKey: ["tributes"],
    queryFn: () =>
      apiFetch<{
        tributes: Tribute[];
      }>("/api/tributes"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
