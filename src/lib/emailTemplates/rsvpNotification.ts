interface RSVPNotificationData {
  organizerName: string;
  organizerEmail: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  rsvpStatus: "ATTENDING" | "NOT_ATTENDING" | "MAYBE";
  rsvpMessage?: string;
  plusOnes?: number;
  dietaryRestrictions?: string;
  accessibilityNeeds?: string;
  memorialName: string;
  memorialId: string;
  dashboardUrl?: string;
}

export function generateRSVPNotificationEmail(data: RSVPNotificationData): string {
  const {
    organizerName,
    guestName,
    guestEmail,
    guestPhone,
    rsvpStatus,
    rsvpMessage,
    plusOnes,
    dietaryRestrictions,
    accessibilityNeeds,
    memorialName,
    dashboardUrl,
  } = data;

  const statusInfo = {
    ATTENDING: {
      icon: "✓",
      color: "#10b981",
      text: "will be attending",
      emoji: "✨",
    },
    NOT_ATTENDING: {
      icon: "✗",
      color: "#ef4444",
      text: "will not be attending",
      emoji: "💐",
    },
    MAYBE: {
      icon: "?",
      color: "#f59e0b",
      text: "might be attending",
      emoji: "🤔",
    },
  };

  const status = statusInfo[rsvpStatus];
  const viewDashboardUrl =
    dashboardUrl ||
    `${process.env.NEXT_PUBLIC_BASE_URL || "https://foreverpages.online"}/user-dashboard/invitations`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New RSVP Response</title>
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
                ${status.emoji} New RSVP Response
              </h1>
              <p style="margin: 10px 0 0 0; color: #e9d5ff; font-size: 16px;">
                Someone responded to your invitation
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #111827; font-size: 16px; line-height: 1.6;">
                Hello <strong>${organizerName}</strong>,
              </p>

              <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                <strong>${guestName}</strong> has responded to your invitation for <strong>${memorialName}'s memorial service</strong>.
              </p>

              <!-- RSVP Status Box -->
              <div style="background-color: ${status.color}15; border-left: 4px solid ${status.color}; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <div style="display: flex; align-items: center;">
                  <div style="font-size: 32px; margin-right: 15px;">${status.icon}</div>
                  <div>
                    <p style="margin: 0; color: #111827; font-size: 18px; font-weight: 600;">
                      ${guestName} ${status.text}
                    </p>
                    <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">
                      Response received on ${new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Guest Details -->
              <div style="background-color: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 16px; font-weight: 600;">Guest Details</h3>

                ${
                  guestEmail
                    ? `
                <p style="margin: 8px 0; color: #4b5563; font-size: 14px;">
                  <strong>Email:</strong> ${guestEmail}
                </p>
                `
                    : ""
                }

                ${
                  guestPhone
                    ? `
                <p style="margin: 8px 0; color: #4b5563; font-size: 14px;">
                  <strong>Phone:</strong> ${guestPhone}
                </p>
                `
                    : ""
                }

                ${
                  plusOnes && plusOnes > 0
                    ? `
                <p style="margin: 8px 0; color: #4b5563; font-size: 14px;">
                  <strong>Additional Guests:</strong> ${plusOnes} person${plusOnes > 1 ? "s" : ""}
                </p>
                `
                    : ""
                }

                ${
                  dietaryRestrictions
                    ? `
                <p style="margin: 8px 0; color: #4b5563; font-size: 14px;">
                  <strong>Dietary Restrictions:</strong> ${dietaryRestrictions}
                </p>
                `
                    : ""
                }

                ${
                  accessibilityNeeds
                    ? `
                <p style="margin: 8px 0; color: #4b5563; font-size: 14px;">
                  <strong>Accessibility Needs:</strong> ${accessibilityNeeds}
                </p>
                `
                    : ""
                }
              </div>

              ${
                rsvpMessage
                  ? `
              <!-- Guest Message -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">
                  💬 Personal Message:
                </p>
                <p style="margin: 0; color: #78350f; font-size: 15px; line-height: 1.6; font-style: italic;">
                  "${rsvpMessage}"
                </p>
              </div>
              `
                  : ""
              }

              <!-- View Dashboard Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${viewDashboardUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      View All Responses
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6; text-align: center;">
                You can view all RSVP responses and manage your guest list in your dashboard
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                This is an automated notification from ForeverPages
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
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function generateRSVPNotificationSubject(guestName: string, memorialName: string): string {
  return `New RSVP: ${guestName} responded to ${memorialName}'s memorial invitation`;
}
