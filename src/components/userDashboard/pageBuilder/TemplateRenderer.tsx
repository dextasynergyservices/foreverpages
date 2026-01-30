"use client";

import React, { useMemo } from "react";
import { DesignTokens } from "./TemplateCustomizer";
import { SectionData } from "./DynamicSectionRenderer";
import { UserTemplate } from "@/hooks/useUserTemplate";

// Import the real template renderer
import { TemplateRenderer as RealTemplateRenderer } from "@/components/templates/base/TemplateRenderer";

interface TemplateRendererProps {
  templateId?: string;
  designTokens: DesignTokens;
  sectionData?: SectionData;
  memorialData?: {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    deathDate?: string;
    birthYear?: number;
    deathYear?: number;
    biography?: string;
    profilePhoto?: string;
  };
  supportedSections?: string[];
  isLoading?: boolean;
  userTemplate?: UserTemplate;
}

// Type-safe interfaces that match the real TemplateRenderer expectations
interface TemplateForRenderer {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  version: string;
  componentPath: string;
  previewImage: string;
  thumbnailImage: string;
  supportedSections: string[];
  layoutType: string;
  designTokens: Record<string, unknown>;
  defaultConfig: Record<string, unknown>;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  plans: unknown[];
  userTemplates: unknown[];
  createdAt: Date;
  updatedAt: Date;
  changelog?: string | null;
  support?: string | null;
  usageCount: number;
}

interface UserTemplateForRenderer {
  id: string;
  name: string;
  description?: string | null;
  userId: string;
  baseTemplateId: string;
  customization: Record<string, unknown> | unknown;
  sections: Record<string, unknown> | unknown;
  isActive: boolean;
  isPublished: boolean;
  customPreviewImage?: string | null;
  customThumbnailImage?: string | null;
  createdAt: Date;
  updatedAt: Date;
  baseTemplate: TemplateForRenderer;
}

interface MemorialForRenderer {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  maidenName?: string | null;
  nicknames: string[];
  prefix?: string | null;
  suffix?: string | null;
  birthDate: Date;
  deathDate: Date;
  birthPlace?: string | null;
  deathPlace?: string | null;
  biography?: string | null;
  children: unknown[];
  parents?: unknown | null;
  siblings?: unknown | null;
  education?: string | null;
  militaryService?: string | null;
  profession?: string | null;
  achievements?: string | null;
  hobbies?: string | null;
  personalityTraits?: string | null;
  favoriteQuote?: string | null;
  lifePhilosophy?: string | null;
  musicPreferences?: string | null;
  favoriteBooks?: string | null;
  favoriteMovies?: string | null;
  favoriteFood?: string | null;
  travelDestinations?: string | null;
  charitableWork?: string | null;
  legacyMessage?: string | null;
  finalWishes?: string | null;
  profilePhoto?: string | null;
  coverPhoto?: string | null;
  config: Record<string, unknown>;
  status: string;
  visibility: string;
  isPublished: boolean;
  isSearchable: boolean;
  userId: string;
  userTemplateId: string;
  categoryId?: string | null;
  templateId?: string | null;
  template?: unknown | null;
  pdfUrl?: string | null;
  qrCodeData?: string | null;
  theme?: string | null;
  customCss?: string | null;
  createdAt: Date;
  updatedAt: Date;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  owner?: unknown | null;
  userTemplate?: unknown | null;
  posts: unknown[];
  reactions: unknown[];
  comments: unknown[];
  mediaItems: unknown[];
  tributes: unknown[];
  timelineEvents: unknown[];
  familyMembers: unknown[];
  viewCount: number;
  shareCount: number;
  candleCount: number;
  flowerCount: number;
  lastViewedAt?: Date | null;
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  templateId: _templateId,
  designTokens,
  sectionData = {},
  memorialData = {},
  supportedSections: _supportedSections = [],
  isLoading = false,
  userTemplate,
}) => {
  // Memoized conversion to avoid recreating objects on each render
  const templateData = useMemo(() => {
    if (!userTemplate) return null;

    // Create a simplified object that matches the real TemplateRenderer expectations
    const prismaUserTemplate: UserTemplateForRenderer = {
      id: userTemplate.id,
      name: userTemplate.baseTemplate?.name || "Untitled Template",
      description: null,
      userId: userTemplate.userId,
      baseTemplateId: userTemplate.baseTemplateId,
      customization: userTemplate.customization || {},
      sections: sectionData || {}, // Use current sectionData, not stored userTemplate.sections
      isActive: true,
      isPublished: userTemplate.isPublished,
      customPreviewImage: null,
      customThumbnailImage: null,
      createdAt: new Date(userTemplate.createdAt),
      updatedAt: new Date(userTemplate.updatedAt),
      baseTemplate: {
        id: userTemplate.baseTemplate?.id || "",
        name: userTemplate.baseTemplate?.name || "Unknown Template",
        slug: userTemplate.baseTemplate?.slug || "unknown",
        description: null,
        category: null,
        version: "1.0.0",
        componentPath: `templates/${userTemplate.baseTemplate?.slug || "unknown"}/MemorialTemplate`,
        previewImage: userTemplate.baseTemplate?.previewImage || "",
        thumbnailImage: userTemplate.baseTemplate?.previewImage || "",
        supportedSections: userTemplate.baseTemplate?.supportedSections || [],
        layoutType: "FLEXIBLE",
        designTokens: (designTokens as unknown as Record<string, unknown>) || {},
        defaultConfig: {},
        isActive: true,
        isFeatured: false,
        displayOrder: 0,
        plans: [],
        userTemplates: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        changelog: null,
        support: null,
        usageCount: 0,
      },
    };

    // Create memorial object for preview
    const memorial: MemorialForRenderer = {
      id: "preview",
      slug: "preview",
      firstName: memorialData?.firstName || "John",
      lastName: memorialData?.lastName || "Doe",
      middleName: null,
      maidenName: null,
      nicknames: [],
      prefix: null,
      suffix: null,
      birthDate: new Date(memorialData?.birthDate || "1950-01-01"),
      deathDate: new Date(memorialData?.deathDate || "2023-12-31"),
      birthPlace: null,
      deathPlace: null,
      biography: memorialData?.biography || "A wonderful person who will be remembered.",
      children: [],
      parents: null,
      siblings: null,
      education: null,
      militaryService: null,
      profession: null,
      achievements: null,
      hobbies: null,
      personalityTraits: null,
      favoriteQuote: null,
      lifePhilosophy: null,
      musicPreferences: null,
      favoriteBooks: null,
      favoriteMovies: null,
      favoriteFood: null,
      travelDestinations: null,
      charitableWork: null,
      legacyMessage: null,
      finalWishes: null,
      // Pass profilePhoto from memorialData or HERO section
      profilePhoto:
        memorialData?.profilePhoto ||
        ((sectionData?.HERO as Record<string, unknown>)?.mainImage as string) ||
        null,
      coverPhoto: null,
      config: {
        sections: sectionData || {},
        customization: designTokens || {},
      },
      status: "PUBLISHED",
      visibility: "PUBLIC",
      isPublished: true,
      isSearchable: true,
      userId: userTemplate.userId,
      userTemplateId: userTemplate.id,
      categoryId: null,
      templateId: null,
      template: null,
      pdfUrl: null,
      qrCodeData: null,
      theme: null,
      customCss: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      seoTitle: null,
      seoDescription: null,
      seoKeywords: null,
      owner: null,
      userTemplate: null,
      posts: [],
      reactions: [],
      comments: [],
      mediaItems: [],
      tributes: [],
      timelineEvents: [],
      familyMembers: [],
      viewCount: 0,
      shareCount: 0,
      candleCount: 0,
      flowerCount: 0,
      lastViewedAt: null,
    };

    return { prismaUserTemplate, memorial };
  }, [userTemplate, memorialData, designTokens, sectionData]);

  // Always use the real template renderer if we have a userTemplate
  if (!userTemplate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No template selected</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  if (!templateData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold text-red-600 mb-2">Preview Error</div>
          <p className="text-gray-500">Unable to generate template preview.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-50">
        <div className="bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-medium shadow-md">
          {userTemplate.baseTemplate?.name || "Template"} Preview
        </div>
      </div>
      <RealTemplateRenderer
        userTemplate={
          templateData.prismaUserTemplate as unknown as Parameters<
            typeof RealTemplateRenderer
          >[0]["userTemplate"]
        }
        memorial={
          templateData.memorial as unknown as Parameters<typeof RealTemplateRenderer>[0]["memorial"]
        }
      />
    </div>
  );
};
