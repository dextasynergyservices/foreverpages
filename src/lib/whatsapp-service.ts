/**
 * WhatsApp Service using Green API
 *
 * Sends verification codes via WhatsApp
 *
 * Green API Setup:
 * 1. Sign up at https://green-api.com/
 * 2. Create instance and get your Instance ID and API Token
 * 3. Scan QR code with your WhatsApp (takes 2 minutes)
 * 4. Add credentials to .env
 *
 * Free Tier: 1,000 messages/month
 */

interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Green API Configuration
const GREEN_API_INSTANCE_ID = process.env.GREEN_API_INSTANCE_ID || "";
const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN || "";
const GREEN_API_URL = `https://api.green-api.com/waInstance${GREEN_API_INSTANCE_ID}`;

/**
 * Send WhatsApp verification code
 *
 * Uses Green API to send WhatsApp messages
 * Message format: "Your ForeverPages verification code is: 123456"
 */
export async function sendWhatsAppVerification(
  phoneNumber: string,
  name: string,
  verificationCode: string
): Promise<WhatsAppResult> {
  // Check if Green API is configured
  if (!GREEN_API_INSTANCE_ID || !GREEN_API_TOKEN) {
    console.log("⚠️ Green API not configured - skipping WhatsApp verification");
    return {
      success: false,
      error: "WhatsApp service not configured",
    };
  }

  // Ensure phone number is in international format without +
  // Green API expects: 2348012345678 (not +2348012345678)
  const formattedPhone = formatPhoneNumberForGreenAPI(phoneNumber);

  if (!isValidPhoneNumber(formattedPhone)) {
    return {
      success: false,
      error: "Invalid phone number format",
    };
  }

  const message = `Hello ${name}! 👋\n\nYour ForeverPages verification code is:\n\n*${verificationCode}*\n\nThis code expires in 24 hours.\n\nIf you didn't request this code, please ignore this message.`;

  try {
    const response = await fetch(`${GREEN_API_URL}/sendMessage/${GREEN_API_TOKEN}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId: `${formattedPhone}@c.us`, // Green API format
        message: message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Green API error: ${response.status}`);
    }

    const data = await response.json();

    console.log(`✅ WhatsApp verification sent to ${formattedPhone}`);
    return {
      success: true,
      messageId: data.idMessage || "sent",
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`❌ Failed to send WhatsApp to ${formattedPhone}:`, errorMsg);

    // Don't throw error - WhatsApp is optional, email is primary
    return { success: false, error: errorMsg };
  }
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Basic E.164 format validation: +[country code][number]
  // Should be between 10-15 digits
  const e164Regex = /^\+[1-9]\d{9,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Format phone number to E.164 format
 * Assumes Nigerian numbers if no country code provided
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, "");

  // If starts with 0, remove it (Nigerian format)
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  // If doesn't have country code, assume Nigeria (+234)
  if (!phoneNumber.startsWith("+")) {
    if (cleaned.length === 10) {
      cleaned = `234${cleaned}`;
    }
  }

  // Add + prefix
  return `+${cleaned}`;
}

/**
 * Format phone number for Green API (without + prefix)
 * Green API expects: 2348012345678 (not +2348012345678)
 */
function formatPhoneNumberForGreenAPI(phoneNumber: string): string {
  // First format to E.164
  const e164 = formatPhoneNumber(phoneNumber);
  // Remove the + prefix for Green API
  return e164.replace(/^\+/, "");
}

/**
 * Send WhatsApp notification (optional, for future use)
 */
export async function sendWhatsAppNotification(
  phoneNumber: string,
  name: string,
  message: string
): Promise<WhatsAppResult> {
  // Check if Green API is configured
  if (!GREEN_API_INSTANCE_ID || !GREEN_API_TOKEN) {
    return {
      success: false,
      error: "WhatsApp service not configured",
    };
  }

  const formattedPhone = formatPhoneNumberForGreenAPI(phoneNumber);

  if (!isValidPhoneNumber(formattedPhone)) {
    return {
      success: false,
      error: "Invalid phone number format",
    };
  }

  const fullMessage = `Hello ${name}! 👋\n\n${message}\n\n_From ForeverPages_`;

  try {
    const response = await fetch(`${GREEN_API_URL}/sendMessage/${GREEN_API_TOKEN}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId: `${formattedPhone}@c.us`,
        message: fullMessage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Green API error: ${response.status}`);
    }

    const data = await response.json();

    console.log(`✅ WhatsApp notification sent to ${formattedPhone}`);
    return {
      success: true,
      messageId: data.idMessage || "sent",
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`❌ Failed to send WhatsApp notification:`, errorMsg);

    return { success: false, error: errorMsg };
  }
}

/**
 * ==============================================
 * LIVESTREAM NOTIFICATIONS
 * ==============================================
 */

interface StreamScheduledWhatsAppParams {
  phoneNumber: string;
  recipientName: string;
  memorialName: string;
  streamTitle: string;
  scheduledFor: Date;
  streamUrl: string;
}

interface StreamLiveWhatsAppParams {
  phoneNumber: string;
  recipientName: string;
  memorialName: string;
  streamTitle: string;
  streamUrl: string;
}

interface StreamEndedWhatsAppParams {
  phoneNumber: string;
  recipientName: string;
  memorialName: string;
  streamTitle: string;
  duration: string;
  peakViewers: number;
}

interface RecordingReadyWhatsAppParams {
  phoneNumber: string;
  recipientName: string;
  memorialName: string;
  streamTitle: string;
  recordingUrl: string;
  expiresAt: Date;
}

interface RecordingExpiringWhatsAppParams {
  phoneNumber: string;
  recipientName: string;
  memorialName: string;
  streamTitle: string;
  daysRemaining: number;
}

interface RecordingDeletedWhatsAppParams {
  phoneNumber: string;
  recipientName: string;
  memorialName: string;
  streamTitle: string;
  deletedAt: Date;
}

/**
 * Format date for WhatsApp message
 */
function formatDateForWhatsApp(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Send stream scheduled WhatsApp notification
 */
export async function sendStreamScheduledWhatsApp(
  params: StreamScheduledWhatsAppParams
): Promise<WhatsAppResult> {
  const { phoneNumber, recipientName, memorialName, streamTitle, scheduledFor, streamUrl } = params;

  const formattedDate = formatDateForWhatsApp(scheduledFor);

  const message = `📺 *Livestream Scheduled*

Hello ${recipientName},

A memorial livestream has been scheduled for *${memorialName}*.

*${streamTitle}*

📅 When: ${formattedDate}

You'll receive another message when the stream goes live.

Watch: ${streamUrl}`;

  return sendWhatsAppNotification(phoneNumber, recipientName, message);
}

/**
 * Send stream live WhatsApp notification (URGENT)
 */
export async function sendStreamLiveWhatsApp(
  params: StreamLiveWhatsAppParams
): Promise<WhatsAppResult> {
  const { phoneNumber, recipientName, memorialName, streamTitle, streamUrl } = params;

  const message = `🔴 *LIVE NOW: ${memorialName}*

${recipientName}, the livestream is starting now!

*${streamTitle}*

⚡ *Join now to watch and share your memories*

Watch: ${streamUrl}

🔴 Don't miss it - the stream is happening right now!`;

  return sendWhatsAppNotification(phoneNumber, recipientName, message);
}

/**
 * Send stream ended WhatsApp notification
 */
export async function sendStreamEndedWhatsApp(
  params: StreamEndedWhatsAppParams
): Promise<WhatsAppResult> {
  const { phoneNumber, recipientName, memorialName, streamTitle, duration, peakViewers } = params;

  const message = `✅ *Stream Ended*

Thank you for joining us, ${recipientName}.

The memorial livestream for *${memorialName}* has ended.

*${streamTitle}*

📊 Stream Stats:
⏱️ Duration: ${duration}
👥 Peak Viewers: ${peakViewers}

The recording is being processed and will be available soon. You'll receive a message when it's ready to watch.

📹 The recording will be available for 6 months.`;

  return sendWhatsAppNotification(phoneNumber, recipientName, message);
}

/**
 * Send recording ready WhatsApp notification
 */
export async function sendRecordingReadyWhatsApp(
  params: RecordingReadyWhatsAppParams
): Promise<WhatsAppResult> {
  const { phoneNumber, recipientName, memorialName, streamTitle, recordingUrl, expiresAt } = params;

  const expiryDate = expiresAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const message = `🎥 *Recording Ready*

Good news, ${recipientName}!

The recording of the memorial livestream for *${memorialName}* is now available.

*${streamTitle}*

📅 Available until: ${expiryDate}

Watch or download: ${recordingUrl}

⚠️ *Important:* This recording will be automatically deleted on ${expiryDate}. Download it if you want to keep it permanently.`;

  return sendWhatsAppNotification(phoneNumber, recipientName, message);
}

/**
 * Send recording expiring WhatsApp warning
 */
export async function sendRecordingExpiringWhatsApp(
  params: RecordingExpiringWhatsAppParams
): Promise<WhatsAppResult> {
  const { phoneNumber, recipientName, memorialName, streamTitle, daysRemaining } = params;

  const message = `⚠️ *Recording Expiring Soon*

${recipientName}, *action required!*

The memorial livestream recording for *${memorialName}* will be deleted in *${daysRemaining} days*.

*${streamTitle}*

❗ *Important:* Once deleted, this recording cannot be recovered. Download it now to preserve these precious memories forever.

Please download your recording as soon as possible.`;

  return sendWhatsAppNotification(phoneNumber, recipientName, message);
}

/**
 * Send recording deleted WhatsApp confirmation
 */
export async function sendRecordingDeletedWhatsApp(
  params: RecordingDeletedWhatsAppParams
): Promise<WhatsAppResult> {
  const { phoneNumber, recipientName, memorialName, streamTitle, deletedAt } = params;

  const deletionDate = formatDateForWhatsApp(deletedAt);

  const message = `🗑️ *Recording Deleted*

Hello ${recipientName},

The memorial livestream recording for *${memorialName}* has been automatically deleted as scheduled.

*${streamTitle}*

Deleted on: ${deletionDate}

ℹ️ This was part of our standard 6-month retention policy. We hope you had the opportunity to download the recording if needed.

The memorial page remains active with all other content (photos, tributes, and memories) preserved.`;

  return sendWhatsAppNotification(phoneNumber, recipientName, message);
}
