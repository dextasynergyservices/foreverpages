import { getTranslationValue, SupportedLocale } from "@/lib/i18n";

interface CollaboratorInvitationEmailData {
  recipientName?: string;
  recipientEmail: string;
  inviterName: string;
  memorialName: string;
  memorialId: string;
  role: string;
  token: string;
  expiresAt: string;
  message?: string;
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

export function generateCollaboratorInvitationEmailHTML(
  data: CollaboratorInvitationEmailData
): string {
  const {
    recipientName,
    recipientEmail,
    inviterName,
    memorialName,
    role,
    token,
    expiresAt,
    message,
    locale = "en",
  } = data;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://foreverpages.online";
  const acceptUrl = `${baseUrl}/accept-invitation/${token}`;

  const formattedExpiry = new Date(expiresAt).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Get role information from translations
  const roleName = t(locale, `collaborators.roles.${role}.name`);
  const roleDescription = t(locale, `collaborators.roles.${role}.longDescription`);

  // Get permissions list from translations
  const permissionsKey = `collaborators.roles.${role}.permissions.list`;
  const permissionsText = getTranslationValue(locale, permissionsKey, "");
  const permissions = Array.isArray(permissionsText)
    ? permissionsText
    : roleDescription.split(". ").filter(Boolean);

  const roleInfo = {
    title: roleName,
    description: roleDescription,
    permissions,
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Collaborator Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                🤝 ${t(locale, "collaborators.title")}
              </h1>
              <p style="margin: 10px 0 0 0; color: #dbeafe; font-size: 16px;">
                ${t(locale, "collaborators.subtitle")}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px; line-height: 1.6;">
                ${t(locale, "collaborators.email.greeting", { recipientName: recipientName || recipientEmail })}
              </p>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${t(locale, "collaborators.email.invitation", { inviterName, role: roleName, deceasedName: memorialName })}
              </p>

              ${
                message
                  ? `
              <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af; font-size: 15px; line-height: 1.6; font-style: italic;">
                  ${t(locale, "collaborators.email.customMessage", { inviterName })}<br/>
                  "${message}"
                </p>
              </div>
              `
                  : ""
              }

              <!-- Role Information -->
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h2 style="color: #2563eb; font-size: 20px; font-weight: 600; margin: 0 0 12px 0;">
                  ${t(locale, "collaborators.email.role", { role: roleInfo.title })}
                </h2>
                <p style="color: #6b7280; font-size: 15px; margin: 0 0 16px 0;">
                  ${roleInfo.description}
                </p>
                <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
                  <p style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">
                    ✨ ${t(locale, "collaborators.email.permissions")}
                  </p>
                  <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                    ${roleInfo.permissions.map((permission) => `<li>${permission}</li>`).join("")}
                  </ul>
                </div>
              </div>

              <!-- Accept Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${acceptUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">
                  ${t(locale, "collaborators.email.accept")}
                </a>
                <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 13px;">
                  Or copy and paste this link: <br />
                  <span style="color: #2563eb; word-break: break-all;">${acceptUrl}</span>
                </p>
              </div>

              <!-- Important Notes -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">
                  📌 Important:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 1.6;">
                  <li>This invitation will expire on <strong>${formattedExpiry}</strong></li>
                  <li>You'll need to sign in or create a ForeverPages account to accept</li>
                  <li>After accepting, you'll have immediate access to the memorial page</li>
                </ul>
              </div>

              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                ${t(locale, "collaborators.toast.invitationSent")}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                ${t(locale, "collaborators.email.footer")}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                © ${new Date().getFullYear()} ForeverPages. All rights reserved.
              </p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                <a href="${baseUrl}" style="color: #2563eb; text-decoration: none;">Visit ForeverPages</a> •
                <a href="${baseUrl}/help" style="color: #2563eb; text-decoration: none;">Help Center</a>
              </p>
            </td>
          </tr>
        </table>

        <!-- Security Notice -->
        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                🔒 This is a secure invitation link. For your security, do not share this email with others.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function generateCollaboratorInvitationEmailSubject(
  inviterName: string,
  memorialName: string,
  role: string,
  locale: SupportedLocale = "en"
): string {
  return t(locale, "collaborators.email.subject", { memorialName });
}
