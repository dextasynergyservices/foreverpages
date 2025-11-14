import { useTranslations } from "@/hooks/useTranslations";

/**
 * Helper functions for collaborator-related translations
 */

export function useCollaboratorTranslations() {
  const { t } = useTranslations();

  return {
    // Role names
    getRoleName: (role: string): string => {
      const key = `collaborators.roles.${role}.name` as string;
      return t(key) || role;
    },

    // Role descriptions (short)
    getRoleDescription: (role: string): string => {
      const key = `collaborators.roles.${role}.description` as string;
      return t(key) || "";
    },

    // Role descriptions (long)
    getRoleLongDescription: (role: string): string => {
      const key = `collaborators.roles.${role}.longDescription` as string;
      return t(key) || "";
    },

    // Role permissions
    getRolePermissions: (role: string): string[] => {
      const key = `collaborators.roles.${role}.permissions.list` as string;
      const permissions = t(key);
      return Array.isArray(permissions) ? permissions : [];
    },

    // Role restrictions notice
    getRoleRestrictionNotice: (role: string | null): string | null => {
      if (!role || role === "OWNER") return null;
      const key = `collaborators.roleRestrictions.${role}` as string;
      return t(key) || null;
    },

    // Status badge text
    getStatusText: (status: string): string => {
      const key = `collaborators.status.${status}` as string;
      return t(key) || status;
    },

    // Email subject
    getEmailSubject: (inviterName: string, memorialName: string, role: string): string => {
      const roleKey = `collaborators.roles.${role}.short` as string;
      const roleName = t(roleKey) || role;
      return t("collaborators.email.subject", {
        inviterName,
        memorialName,
        role: roleName,
      });
    },

    // WhatsApp role emoji
    getWhatsAppRoleEmoji: (role: string): string => {
      const key = `collaborators.whatsapp.roleEmojis.${role}` as string;
      return t(key) || "👤";
    },
  };
}
