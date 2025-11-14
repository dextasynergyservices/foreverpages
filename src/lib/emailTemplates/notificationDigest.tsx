import React from "react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  createdAt: string;
}

interface NotificationDigestEmailProps {
  userName: string;
  notifications: Notification[];
  period: "daily" | "weekly";
  unreadCount: number;
}

export function NotificationDigestEmail({
  userName,
  notifications,
  period,
  unreadCount,
}: NotificationDigestEmailProps) {
  const periodText = period === "daily" ? "Daily" : "Weekly";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://foreverpages.online";

  // Group notifications by type
  const groupedNotifications = notifications.reduce(
    (acc, notification) => {
      if (!acc[notification.type]) {
        acc[notification.type] = [];
      }
      acc[notification.type].push(notification);
      return acc;
    },
    {} as Record<string, Notification[]>
  );

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      NEW_TRIBUTE: "New Tributes",
      NEW_COMMENT: "New Comments",
      NEW_PHOTO: "New Photos",
      NEW_CANDLE: "Candles Lit",
      NEW_FLOWER: "Flowers Sent",
      INVITATION: "Invitations",
      MEMORIAL_ANNIVERSARY: "Memorial Anniversaries",
      BIRTHDAY_ANNIVERSARY: "Birthday Anniversaries",
      EXPIRING_SOON: "Expiring Soon",
      SYSTEM: "System Notifications",
    };
    return labels[type] || type;
  };

  return (
    <html>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{periodText} Notification Digest</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#f3f4f6",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <table
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          style={{
            backgroundColor: "#f3f4f6",
            padding: "40px 20px",
          }}
        >
          <tr>
            <td align="center">
              <table
                width="600"
                cellPadding="0"
                cellSpacing="0"
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                {/* Header */}
                <tr>
                  <td
                    style={{
                      backgroundColor: "#7c3aed",
                      padding: "32px 24px",
                      textAlign: "center",
                    }}
                  >
                    <h1
                      style={{
                        margin: 0,
                        color: "#ffffff",
                        fontSize: "28px",
                        fontWeight: "bold",
                      }}
                    >
                      Your {periodText} Digest
                    </h1>
                    <p
                      style={{
                        margin: "8px 0 0",
                        color: "#e9d5ff",
                        fontSize: "16px",
                      }}
                    >
                      {unreadCount} new notification{unreadCount !== 1 ? "s" : ""}
                    </p>
                  </td>
                </tr>

                {/* Greeting */}
                <tr>
                  <td style={{ padding: "32px 24px 24px" }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        color: "#374151",
                        lineHeight: "1.6",
                      }}
                    >
                      Hello {userName},
                    </p>
                    <p
                      style={{
                        margin: "16px 0 0",
                        fontSize: "16px",
                        color: "#374151",
                        lineHeight: "1.6",
                      }}
                    >
                      Here&apos;s a summary of your memorial page activity from the past{" "}
                      {period === "daily" ? "24 hours" : "week"}.
                    </p>
                  </td>
                </tr>

                {/* Notifications by Type */}
                {Object.entries(groupedNotifications).map(([type, items]) => (
                  <tr key={type}>
                    <td style={{ padding: "0 24px 24px" }}>
                      <h2
                        style={{
                          margin: "0 0 16px",
                          fontSize: "18px",
                          fontWeight: "600",
                          color: "#111827",
                        }}
                      >
                        {getTypeLabel(type)} ({items.length})
                      </h2>
                      <table width="100%" cellPadding="0" cellSpacing="0">
                        {items.map((notification, index) => (
                          <tr key={notification.id}>
                            <td
                              style={{
                                padding: "12px",
                                backgroundColor: index % 2 === 0 ? "#f9fafb" : "#ffffff",
                                borderRadius: "6px",
                              }}
                            >
                              <p
                                style={{
                                  margin: "0 0 4px",
                                  fontSize: "14px",
                                  fontWeight: "600",
                                  color: "#111827",
                                }}
                              >
                                {notification.title}
                              </p>
                              <p
                                style={{
                                  margin: "0 0 8px",
                                  fontSize: "14px",
                                  color: "#6b7280",
                                }}
                              >
                                {notification.message}
                              </p>
                              {notification.link && (
                                <a
                                  href={`${baseUrl}${notification.link}`}
                                  style={{
                                    display: "inline-block",
                                    fontSize: "14px",
                                    color: "#7c3aed",
                                    textDecoration: "none",
                                    fontWeight: "500",
                                  }}
                                >
                                  View Details →
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </table>
                    </td>
                  </tr>
                ))}

                {/* Call to Action */}
                <tr>
                  <td style={{ padding: "24px", textAlign: "center" }}>
                    <a
                      href={`${baseUrl}/user-dashboard`}
                      style={{
                        display: "inline-block",
                        padding: "14px 32px",
                        backgroundColor: "#7c3aed",
                        color: "#ffffff",
                        textDecoration: "none",
                        borderRadius: "6px",
                        fontSize: "16px",
                        fontWeight: "600",
                      }}
                    >
                      View All Notifications
                    </a>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td
                    style={{
                      padding: "24px",
                      backgroundColor: "#f9fafb",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        color: "#6b7280",
                        textAlign: "center",
                        lineHeight: "1.6",
                      }}
                    >
                      You&apos;re receiving this email because you have notifications enabled for
                      your ForeverPages memorial.
                      <br />
                      <a
                        href={`${baseUrl}/user-dashboard?section=settings`}
                        style={{ color: "#7c3aed", textDecoration: "none" }}
                      >
                        Manage notification preferences
                      </a>
                    </p>
                    <p
                      style={{
                        margin: "16px 0 0",
                        fontSize: "12px",
                        color: "#9ca3af",
                        textAlign: "center",
                      }}
                    >
                      © {new Date().getFullYear()} ForeverPages. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}
// This function is used in API routes only (server-side)
export async function renderNotificationDigestEmail(
  props: NotificationDigestEmailProps
): Promise<string> {
  // Dynamic import to avoid client-side bundling issues
  const ReactDOMServer = await import("react-dom/server");
  const emailHtml = React.createElement(NotificationDigestEmail, props);
  return `<!DOCTYPE html>${ReactDOMServer.renderToStaticMarkup(emailHtml)}`;
}
