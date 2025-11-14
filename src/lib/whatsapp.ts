import { generateRSVPUrl } from "./rsvpTokens";

interface WhatsAppMessageOptions {
  to: string; // Phone number in international format (e.g., "2348012345678")
  message: string;
}

interface WhatsAppInvitationData {
  recipientName: string;
  recipientPhone: string;
  inviterName: string;
  memorialName: string;
  role: string;
  token: string;
  rsvpToken?: string; // Token for RSVP page
  expiresAt: string;
}

interface GreenAPIResponse {
  idMessage: string;
  status?: string;
  error?: string;
}

/**
 * Send WhatsApp message using Green API
 * Requires GREEN_API_INSTANCE_ID and GREEN_API_TOKEN environment variables
 */
export async function sendWhatsAppMessage({
  to,
  message,
}: WhatsAppMessageOptions): Promise<boolean> {
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const token = process.env.GREEN_API_TOKEN;

  if (!instanceId || !token) {
    console.error(
      "Green API credentials not configured. Set GREEN_API_INSTANCE_ID and GREEN_API_TOKEN environment variables."
    );
    return false;
  }

  try {
    // Format phone number (remove any non-digit characters except +)
    const formattedPhone = to.replace(/[^\d+]/g, "");

    // Green API expects format: countrycode + phone number without + symbol
    const phoneNumber = formattedPhone.startsWith("+")
      ? formattedPhone.substring(1)
      : formattedPhone;

    const apiUrl = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId: `${phoneNumber}@c.us`,
        message: message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Green API error:", errorData);
      return false;
    }

    const data: GreenAPIResponse = await response.json();
    console.log("WhatsApp message sent successfully:", data.idMessage);
    return true;
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    return false;
  }
}

/**
 * Generate WhatsApp invitation message
 */
export function generateInvitationWhatsAppMessage(data: WhatsAppInvitationData): string {
  const { recipientName, inviterName, memorialName, rsvpToken } = data;

  // Generate RSVP URL if token is provided
  let rsvpUrl: string | undefined = undefined;
  if (rsvpToken) {
    rsvpUrl = generateRSVPUrl(
      rsvpToken,
      process.env.NEXT_PUBLIC_BASE_URL || "https://foreverpages.online"
    );
  }

  return `*Memorial Service Invitation*

Hello ${recipientName || "there"}! 👋

*${inviterName}* has invited you to attend the memorial service for *${memorialName}*.

${rsvpUrl ? `📋 *Please RSVP:*\n${rsvpUrl}\n\n✨ *What you can do:*\n✓ Confirm your attendance\n✓ Let us know about dietary requirements\n✓ Add guests (plus ones)\n✓ Leave a message for the family\n\n` : ""}This invitation expires in 7 days.

---
ForeverPages - Honoring memories, celebrating lives 💜`;
}

/**
 * Send invitation via WhatsApp
 */
export async function sendInvitationWhatsApp(data: WhatsAppInvitationData): Promise<boolean> {
  const message = generateInvitationWhatsAppMessage(data);

  return await sendWhatsAppMessage({
    to: data.recipientPhone,
    message,
  });
}
