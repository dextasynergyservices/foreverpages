"use client";

import { useState, useEffect } from "react";
import { MemorialRole } from "@/generated/prisma";
import { getTranslation, getCurrentLocale } from "@/lib/i18n";

interface UserMemorialAccess {
  memorialId: string;
  role: MemorialRole;
  isOwner: boolean;
}

export function useMemorialAccess(memorialId?: string) {
  const [access, setAccess] = useState<UserMemorialAccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAccess() {
      if (!memorialId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/memorials/${memorialId}/access`);
        if (response.ok) {
          const data = await response.json();
          setAccess(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch memorial access:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAccess();
  }, [memorialId]);

  return { access, loading };
}

/**
 * Check if user has permission for a specific dashboard section
 */
export function canAccessDashboardSection(role: MemorialRole | null, section: string): boolean {
  if (!role) return false;

  const permissions: Record<string, MemorialRole[]> = {
    analytics: ["OWNER", "ADMIN", "EDITOR", "CONTRIBUTOR", "VIEWER"],
    gallery: ["OWNER", "ADMIN", "EDITOR", "CONTRIBUTOR"],
    templates: ["OWNER", "ADMIN", "EDITOR"],
    "funeral-builder": ["OWNER", "ADMIN", "EDITOR"],
    invitations: ["OWNER", "ADMIN"],
    tributes: ["OWNER", "ADMIN", "EDITOR", "CONTRIBUTOR"],
    support: ["OWNER", "ADMIN", "EDITOR", "CONTRIBUTOR", "VIEWER"],
    livestreams: ["OWNER", "ADMIN"], // Only OWNER and ADMIN can manage livestreams
    settings: ["OWNER", "ADMIN"],
  };

  return permissions[section]?.includes(role) || false;
}

/**
 * Get allowed dashboard sections for a role
 */
export function getAllowedDashboardSections(role: MemorialRole | null): string[] {
  if (!role) return [];

  const rolePermissions: Record<MemorialRole, string[]> = {
    OWNER: [
      "analytics",
      "gallery",
      "templates",
      "funeral-builder",
      "invitations",
      "tributes",
      "support",
      "livestreams",
      "settings",
    ],
    ADMIN: [
      "analytics",
      "gallery",
      "templates",
      "funeral-builder",
      "invitations",
      "tributes",
      "support",
      "livestreams",
      "settings",
    ],
    EDITOR: ["analytics", "gallery", "templates", "funeral-builder", "tributes", "support"],
    CONTRIBUTOR: ["analytics", "gallery", "tributes", "support"],
    VIEWER: ["analytics", "support"],
  };

  return rolePermissions[role] || [];
}

/**
 * Get section display config based on role
 */
export function getDashboardSectionConfig(role: MemorialRole | null) {
  const allowedSections = getAllowedDashboardSections(role);

  return {
    canViewAnalytics: allowedSections.includes("analytics"),
    canManageGallery: allowedSections.includes("gallery"),
    canEditMemorial: allowedSections.includes("funeral-builder"),
    canSendInvitations: allowedSections.includes("invitations"),
    canManageTributes: allowedSections.includes("tributes"),
    canAccessSettings: allowedSections.includes("settings"),
    canManageBilling: role === "OWNER", // Only owner can manage billing
    canInviteCollaborators: role === "OWNER" || role === "ADMIN",
    canEditContent: role === "OWNER" || role === "ADMIN" || role === "EDITOR",
    canAddContent: role !== "VIEWER",
    isReadOnly: role === "VIEWER",
  };
}

/**
 * Get role-specific welcome message
 */
export function getRoleWelcomeMessage(role: MemorialRole | null, memorialName?: string): string {
  if (!role) return "Welcome to your dashboard";

  const messages: Record<MemorialRole, string> = {
    OWNER: `Managing ${memorialName || "your memorial"}`,
    ADMIN: `Managing ${memorialName || "memorial"} as Administrator`,
    EDITOR: `Editing ${memorialName || "memorial"} content`,
    CONTRIBUTOR: `Contributing to ${memorialName || "memorial"}`,
    VIEWER: `Viewing ${memorialName || "memorial"}`,
  };

  return messages[role];
}

/**
 * Get role-specific restrictions notice
 * @deprecated Use useCollaboratorTranslations().getRoleRestrictionNotice() instead for proper i18n support
 */
export function getRoleRestrictionsNotice(role: MemorialRole | null): string | null {
  if (!role || role === "OWNER") return null;

  const locale = getCurrentLocale();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = getTranslation(locale) as any;

  const notices: Record<string, string> = {
    ADMIN:
      t.collaborators?.roleRestrictions?.ADMIN || "Only administrators can manage collaborators",
    EDITOR:
      t.collaborators?.roleRestrictions?.EDITOR ||
      "Editors cannot manage collaborators. Contact the page owner for additional permissions.",
    CONTRIBUTOR:
      t.collaborators?.roleRestrictions?.CONTRIBUTOR ||
      "Contributors cannot manage collaborators. Contact the page owner for additional permissions.",
    VIEWER:
      t.collaborators?.roleRestrictions?.VIEWER ||
      "Viewers cannot manage collaborators. Contact the page owner for additional permissions.",
  };

  return notices[role] || null;
}
