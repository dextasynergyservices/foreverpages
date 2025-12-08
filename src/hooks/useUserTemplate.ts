import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface UserTemplate {
  id: string;
  userId: string;
  baseTemplateId: string;
  baseTemplate: {
    id: string;
    name: string;
    slug: string;
    previewImage: string;
    supportedSections: string[];
  };
  config: Record<string, unknown> | null;
  sections: Record<string, unknown> | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  memorials: Array<{
    id: string;
    slug: string;
    firstName: string;
    lastName: string;
  }>;
}

export interface CreateUserTemplateData {
  baseTemplateId: string;
  name?: string;
}

export interface UpdateUserTemplateData {
  config?: Record<string, unknown>;
  sections?: Record<string, unknown>;
  name?: string;
}

/**
 * Hook to fetch the user's active UserTemplate
 */
export const useActiveUserTemplate = () => {
  return useQuery({
    queryKey: ["user-template", "active"],
    queryFn: async (): Promise<UserTemplate | null> => {
      const response = await fetch("/api/user/templates/active");
      if (response.status === 404) {
        return null; // No active template
      }
      if (!response.ok) {
        throw new Error("Failed to fetch active template");
      }
      const data = await response.json();
      return data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to create a new UserTemplate
 */
export const useCreateUserTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserTemplateData): Promise<UserTemplate> => {
      const response = await fetch("/api/user/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create template");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-template"] });
    },
  });
};

/**
 * Hook to update UserTemplate (config, sections)
 */
export const useUpdateUserTemplate = (templateId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateUserTemplateData): Promise<UserTemplate> => {
      const response = await fetch(`/api/user/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update template");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-template"] });
    },
  });
};

/**
 * Hook to delete UserTemplate
 */
export const useDeleteUserTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string): Promise<void> => {
      const response = await fetch(`/api/user/templates/${templateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete template");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-template"] });
      queryClient.invalidateQueries({ queryKey: ["available-templates"] });
    },
  });
};

/**
 * Hook to fetch specific UserTemplate by ID
 */
export const useUserTemplate = (templateId: string | null) => {
  return useQuery({
    queryKey: ["user-template", templateId],
    queryFn: async (): Promise<UserTemplate> => {
      const response = await fetch(`/api/user/templates/${templateId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch template");
      }
      const data = await response.json();
      return data.data;
    },
    enabled: !!templateId,
    staleTime: 1000 * 60 * 5,
  });
};
