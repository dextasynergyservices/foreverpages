import { generateRSVPUrl } from "../rsvpTokens";
interface InvitationEmailData {
  recipientName: string;
  recipientEmail: string;
  inviterName: string;
  memorialName: string;
  memorialId: string;
  role: string;
  token: string;
  rsvpToken?: string; // Token for RSVP page
  expiresAt: string;
  message?: string;
  invitationCard?: string; // URL to invitation card image
  customSubject?: string; // Custom email subject
  qrCodeDataUrl?: string; // QR code image as data URL
}

export function generateInvitationEmailHTML(data: InvitationEmailData): string {
  const {
    recipientName,
    inviterName,
    memorialName,
    expiresAt,
    message,
    invitationCard,
    rsvpToken,
    qrCodeDataUrl,
  } = data;

  // RSVP URL (if token present)
  let rsvpUrl: string | undefined = undefined;
  if (rsvpToken) {
    rsvpUrl = generateRSVPUrl(
      rsvpToken,
      process.env.NEXT_PUBLIC_BASE_URL || "https://foreverpages.online"
    );
  }

  const formattedExpiry = new Date(expiresAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Memorial Page Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                Memorial Event Invitation
              </h1>
              <p style="margin: 10px 0 0 0; color: #e9d5ff; font-size: 16px;">
                You're invited to remember and celebrate a life
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px; line-height: 1.6;">
                Hello <strong>${recipientName || "there"}</strong>,
              </p>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to attend the memorial service for <strong>${memorialName}</strong>.
              </p>

              ${
                invitationCard
                  ? `
              <!-- Custom Invitation Card -->
              <div style="margin: 20px 0; text-align: center;">
                <img src="${invitationCard}" alt="Invitation Card" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);" />
              </div>
              `
                  : ""
              }

              ${
                message
                  ? `
              <div style="background-color: #f9fafb; border-left: 4px solid #7c3aed; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6; font-style: italic;">
                  "${message}"
                </p>
              </div>
              `
                  : ""
              }

              ${
                rsvpUrl
                  ? `
              <!-- RSVP Section -->
              <div style="margin: 30px 0; padding: 24px; background: #f3f4f6; border-radius: 8px; text-align: center;">
                <h2 style="color: #7c3aed; font-size: 20px; font-weight: 600; margin-bottom: 12px;">Please RSVP</h2>
                <p style="color: #4b5563; font-size: 15px; margin-bottom: 18px;">Let us know if you'll be attending the memorial service.</p>
                <a href="${rsvpUrl}" style="display: inline-block; background-color: #7c3aed; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">RSVP Now</a>
                <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 13px;">Or copy and paste this link: <br /><span style="color: #7c3aed; word-break: break-all;">${rsvpUrl}</span></p>

                <!-- Calendar Invite Info -->
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; margin: 8px 0 0 0;">
                    📅 <strong>Calendar invite attached</strong> - Add the memorial service to your calendar
                  </p>
                </div>

                ${
                  qrCodeDataUrl
                    ? `
                <!-- QR Code Section -->
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; margin-bottom: 12px;">
                    <strong>Scan to RSVP</strong>
                  </p>
                  <img src="${qrCodeDataUrl}" alt="RSVP QR Code" style="width: 150px; height: 150px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);" />
                  <p style="color: #9ca3af; font-size: 12px; margin-top: 8px;">
                    Scan with your phone camera to quickly RSVP
                  </p>
                </div>
                `
                    : ""
                }
              </div>
              `
                  : ""
              }

              <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6; text-align: center;">
                This invitation will expire on <strong>${formattedExpiry}</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                © ${new Date().getFullYear()} ForeverPages. All rights reserved.
              </p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://foreverpages.online"}" style="color: #7c3aed; text-decoration: none;">Visit ForeverPages</a> •
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://foreverpages.online"}/help" style="color: #7c3aed; text-decoration: none;">Help Center</a>
              </p>
            </td>
          </tr>
        </table>

        ${
          rsvpUrl
            ? `
        <!-- Copy Link Section -->
        <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
                Or copy and paste this RSVP link:
              </p>
              <p style="margin: 0; color: #7c3aed; font-size: 13px; word-break: break-all;">
                ${rsvpUrl}
              </p>
            </td>
          </tr>
        </table>
        `
            : ""
        }
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function generateInvitationEmailSubject(
  inviterName: string,
  memorialName: string,
  customSubject?: string
): string {
  if (customSubject && customSubject.trim()) {
    return customSubject.trim();
  }
  return `${inviterName} invited you to ${memorialName}'s memorial service`;
}
