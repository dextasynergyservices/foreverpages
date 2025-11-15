import { getTranslationValue, SupportedLocale } from "@/lib/i18n";

interface CollaboratorWhatsAppInvitationData {
  recipientName?: string;
  recipientPhone: string;
  inviterName: string;
  memorialName: string;
  role: string;
  token: string;
  expiresAt: string;
  locale?: SupportedLocale;
}

// Helper to get translated text with fallback
function t(locale: SupportedLocale, key: string, params?: Record<string, string>): string {
  let text = getTranslationValue(locale, key, key);

  // Replace parameters
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(new RegExp(`\\{${param}\\}`, "g"), value);
    });
  }

  return text;
}

/**
 * Generate WhatsApp message for collaborator invitation
 */
export function generateCollaboratorInvitationWhatsAppMessage(
  data: CollaboratorWhatsAppInvitationData
): string {
  const { recipientName, inviterName, memorialName, role, token, locale = "en" } = data;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://foreverpages.online";
  const acceptUrl = `${baseUrl}/accept-invitation/${token}`;

  // Get role information from translations
  const roleName = t(locale, `collaborators.roles.${role}.name`);
  const roleEmoji = t(locale, `collaborators.whatsapp.roleEmoji.${role}`, { emoji: "🤝" });

  // Get permissions list from translations
  const permissionsKey = `collaborators.roles.${role}.permissions.list`;
  const permissionsText = getTranslationValue(locale, permissionsKey, "");
  const permissions = Array.isArray(permissionsText)
    ? permissionsText.map((p) => `✓ ${p}`).join("\n")
    : "";

  const greeting = t(locale, "collaborators.whatsapp.greeting", {
    recipientName: recipientName || "there",
  });
  const invitation = t(locale, "collaborators.whatsapp.invitation", {
    inviterName,
    role: roleName,
    deceasedName: memorialName,
  });
  const roleText = t(locale, "collaborators.whatsapp.role", { emoji: roleEmoji, role: roleName });
  const permissionsTitle = t(locale, "collaborators.whatsapp.permissions");
  const acceptText = t(locale, "collaborators.whatsapp.accept", { acceptLink: acceptUrl });
  const footer = t(locale, "collaborators.whatsapp.footer");

  return `*🤝 ${t(locale, "collaborators.title")}*

${greeting}

${invitation}

${roleText}

*${permissionsTitle}*
${permissions}

*📲 ${acceptText.split(":")[0]}:*
${acceptUrl}

⏰ ${t(locale, "collaborators.form.whatsapp.phones.hint")}

${footer}

---
ForeverPages - Honoring memories, celebrating lives 💜`;
}

/**
 * Send collaborator invitation via WhatsApp using the existing infrastructure
 */
export async function sendCollaboratorInvitationWhatsApp(
  data: CollaboratorWhatsAppInvitationData
): Promise<boolean> {
  // Use the existing WhatsApp service
  const { sendWhatsAppMessage } = await import("./whatsapp");

  const message = generateCollaboratorInvitationWhatsAppMessage(data);

  return await sendWhatsAppMessage({
    to: data.recipientPhone,
    message,
  });
}
