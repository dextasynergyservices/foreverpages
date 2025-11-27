import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface UserTemplate {
  id: string;
  name: string;
  description?: string;
  baseTemplate: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    previewImage: string;
    thumbnailImage: string;
    supportedSections: string[];
    layoutType: string;
  };
  config?: Record<string, unknown>;
  sections?: Record<string, unknown>;
  isPublished: boolean;
  customPreviewImage?: string;
  customThumbnailImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserTemplateData {
  baseTemplateId: string;
  name: string;
  description?: string;
  config?: Record<string, unknown>;
  sections?: Record<string, unknown>;
}

export interface UpdateUserTemplateData {
  name?: string;
  description?: string;
  config?: Record<string, unknown>;
  sections?: Record<string, unknown>;
  isPublished?: boolean;
}

export const useUserTemplates = () => {
  return useQuery({
    queryKey: ["user-templates"],
    queryFn: async (): Promise<UserTemplate[]> => {
      const response = await fetch("/api/user/templates");
      if (!response.ok) {
        throw new Error("Failed to fetch user templates");
      }
      const data = await response.json();
      return data.data.templates;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useUserTemplate = (templateId: string) => {
  return useQuery({
    queryKey: ["user-template", templateId],
    queryFn: async (): Promise<UserTemplate> => {
      const response = await fetch(`/api/user/templates/${templateId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user template");
      }
      const data = await response.json();
      return data.data.template;
    },
    enabled: !!templateId,
  });
};

export const useCreateUserTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserTemplateData): Promise<UserTemplate> => {
      const response = await fetch("/api/user/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create user template");
      }

      const result = await response.json();
      return result.data.template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-templates"] });
    },
  });
};

export const useUpdateUserTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      data,
    }: {
      templateId: string;
      data: UpdateUserTemplateData;
    }): Promise<UserTemplate> => {
      const response = await fetch(`/api/user/templates/${templateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update user template");
      }

      const result = await response.json();
      return result.data.template;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-templates"] });
      queryClient.invalidateQueries({ queryKey: ["user-template", data.id] });
    },
  });
};

export const useDeleteUserTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string): Promise<void> => {
      const response = await fetch(`/api/user/templates/${templateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user template");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-templates"] });
    },
  });
};
