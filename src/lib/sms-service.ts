/**
 * SMS Service using Twilio
 *
 * Provides SMS notification functionality for:
 * - Invitation reminders
 * - Livestream notifications
 * - Memorial updates
 *
 * Features:
 * - Message templating
 * - International phone number support
 * - Error handling and logging
 * - Rate limiting awareness
 *
 * Setup:
 * 1. Create a Twilio account at https://www.twilio.com/
 * 2. Get your Account SID and Auth Token from the Twilio Console
 * 3. Get or purchase a Twilio phone number
 * 4. Add environment variables to .env:
 *    - TWILIO_ACCOUNT_SID
 *    - TWILIO_AUTH_TOKEN
 *    - TWILIO_PHONE_NUMBER
 */

// Twilio client will be imported dynamically to avoid issues if not installed
let twilioClient: TwilioClient | null = null;

// Type definition for Twilio client
interface TwilioClient {
  messages: {
    create: (options: { body: string; to: string; from: string }) => Promise<{
      sid: string;
      status: string;
      to: string;
      dateCreated: Date;
      errorCode?: number;
      errorMessage?: string;
    }>;
  };
}

/**
 * Initialize Twilio client
 */
async function getTwilioClient(): Promise<TwilioClient | null> {
  if (twilioClient) {
    return twilioClient;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.warn("Twilio credentials not configured. SMS notifications disabled.");
    return null;
  }

  try {
    // Dynamic import to avoid issues if twilio package is not installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const twilio = require("twilio");
    twilioClient = twilio(accountSid, authToken) as unknown as TwilioClient;
    return twilioClient;
  } catch (error) {
    console.error("Failed to initialize Twilio client (package may not be installed):", error);
    return null;
  }
}

/**
 * SMS Message Templates
 */
export interface SMSTemplateData {
  recipientName?: string;
  memorialName?: string;
  inviterName?: string;
  streamTitle?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  url?: string;
  code?: string;
  expiresAt?: string;
  custom?: Record<string, string>;
}

export type SMSTemplate =
  | "invitation"
  | "invitation-reminder"
  | "stream-scheduled"
  | "stream-live"
  | "stream-ended"
  | "recording-ready"
  | "verification-code"
  | "password-reset"
  | "custom";

/**
 * Get message text from template
 */
function getTemplateMessage(template: SMSTemplate, data: SMSTemplateData): string {
  const templates: Record<SMSTemplate, (data: SMSTemplateData) => string> = {
    invitation: (d) =>
      `${d.inviterName || "Someone"} has invited you to view ${d.memorialName || "a memorial"} on ForeverPages. Accept your invitation: ${d.url}`,

    "invitation-reminder": (d) =>
      `Reminder: You have a pending invitation to ${d.memorialName || "a memorial"}. The invitation expires ${d.expiresAt || "soon"}. Accept here: ${d.url}`,

    "stream-scheduled": (d) =>
      `${d.memorialName || "Memorial"} livestream "${d.streamTitle || "Service"}" is scheduled for ${d.scheduledDate || "soon"} at ${d.scheduledTime || ""}. Watch live: ${d.url}`,

    "stream-live": (d) =>
      `🔴 LIVE NOW: ${d.memorialName || "Memorial"} livestream "${d.streamTitle || "Service"}" has started. Watch now: ${d.url}`,

    "stream-ended": (d) =>
      `The ${d.memorialName || "memorial"} livestream "${d.streamTitle || "service"}" has ended. Thank you for participating.`,

    "recording-ready": (d) =>
      `The recording for ${d.memorialName || "the memorial"} service is now available. Watch here: ${d.url} (Available until ${d.expiresAt || "limited time"})`,

    "verification-code": (d) =>
      `Your ForeverPages verification code is: ${d.code}. This code expires in 10 minutes.`,

    "password-reset": (d) =>
      `Your ForeverPages password reset code is: ${d.code}. If you didn't request this, please ignore this message.`,

    custom: (d) => d.custom?.message || "You have a new notification from ForeverPages.",
  };

  return templates[template](data);
}

/**
 * Validate and format phone number
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, "");

  // Ensure it starts with +
  if (!cleaned.startsWith("+")) {
    // Assume it's a Nigerian number if no country code
    if (cleaned.length === 10) {
      cleaned = "+234" + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith("0")) {
      cleaned = "+234" + cleaned.substring(1);
    } else {
      cleaned = "+" + cleaned;
    }
  }

  return cleaned;
}

/**
 * SMS send result
 */
export interface SMSSendResult {
  success: boolean;
  messageId?: string;
  status?: string;
  to?: string;
  error?: string;
  errorCode?: number;
}

/**
 * Send an SMS message
 */
export async function sendSMS(
  to: string,
  template: SMSTemplate,
  data: SMSTemplateData
): Promise<SMSSendResult> {
  const result: SMSSendResult = {
    success: false,
  };

  try {
    // Check if SMS is enabled
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      console.warn("TWILIO_PHONE_NUMBER not configured. SMS not sent.");
      result.error = "SMS service not configured";
      return result;
    }

    // Get Twilio client
    const client = await getTwilioClient();
    if (!client) {
      result.error = "SMS service not available";
      return result;
    }

    // Format phone number
    const formattedTo = formatPhoneNumber(to);

    // Get message text
    const messageBody = getTemplateMessage(template, data);

    // Send the message
    console.log(`Sending SMS to ${formattedTo}: ${template}`);

    const message = await client.messages.create({
      body: messageBody,
      to: formattedTo,
      from: fromNumber,
    });

    result.success = true;
    result.messageId = message.sid;
    result.status = message.status;
    result.to = message.to;

    console.log(`SMS sent successfully: ${message.sid} (status: ${message.status})`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to send SMS to ${to}:`, errorMsg);

    result.error = errorMsg;

    // Extract Twilio error code if available
    if (error && typeof error === "object" && "code" in error) {
      result.errorCode = (error as { code: number }).code;
    }
  }

  return result;
}

/**
 * Send SMS with custom message
 */
export async function sendCustomSMS(to: string, message: string): Promise<SMSSendResult> {
  return sendSMS(to, "custom", { custom: { message } });
}

/**
 * Send invitation SMS
 */
export async function sendInvitationSMS(
  to: string,
  data: {
    recipientName?: string;
    memorialName: string;
    inviterName: string;
    inviteUrl: string;
  }
): Promise<SMSSendResult> {
  return sendSMS(to, "invitation", {
    recipientName: data.recipientName,
    memorialName: data.memorialName,
    inviterName: data.inviterName,
    url: data.inviteUrl,
  });
}

/**
 * Send invitation reminder SMS
 */
export async function sendInvitationReminderSMS(
  to: string,
  data: {
    memorialName: string;
    inviteUrl: string;
    expiresAt?: string;
  }
): Promise<SMSSendResult> {
  return sendSMS(to, "invitation-reminder", {
    memorialName: data.memorialName,
    url: data.inviteUrl,
    expiresAt: data.expiresAt,
  });
}

/**
 * Send stream scheduled SMS
 */
export async function sendStreamScheduledSMS(
  to: string,
  data: {
    memorialName: string;
    streamTitle: string;
    scheduledDate: string;
    scheduledTime: string;
    streamUrl: string;
  }
): Promise<SMSSendResult> {
  return sendSMS(to, "stream-scheduled", {
    memorialName: data.memorialName,
    streamTitle: data.streamTitle,
    scheduledDate: data.scheduledDate,
    scheduledTime: data.scheduledTime,
    url: data.streamUrl,
  });
}

/**
 * Send stream live SMS
 */
export async function sendStreamLiveSMS(
  to: string,
  data: {
    memorialName: string;
    streamTitle: string;
    streamUrl: string;
  }
): Promise<SMSSendResult> {
  return sendSMS(to, "stream-live", {
    memorialName: data.memorialName,
    streamTitle: data.streamTitle,
    url: data.streamUrl,
  });
}

/**
 * Send recording ready SMS
 */
export async function sendRecordingReadySMS(
  to: string,
  data: {
    memorialName: string;
    recordingUrl: string;
    expiresAt?: string;
  }
): Promise<SMSSendResult> {
  return sendSMS(to, "recording-ready", {
    memorialName: data.memorialName,
    url: data.recordingUrl,
    expiresAt: data.expiresAt,
  });
}

/**
 * Send verification code SMS
 */
export async function sendVerificationCodeSMS(to: string, code: string): Promise<SMSSendResult> {
  return sendSMS(to, "verification-code", { code });
}

/**
 * Send password reset code SMS
 */
export async function sendPasswordResetSMS(to: string, code: string): Promise<SMSSendResult> {
  return sendSMS(to, "password-reset", { code });
}

/**
 * Batch send SMS messages
 */
export async function sendBatchSMS(
  recipients: { phone: string; data: SMSTemplateData }[],
  template: SMSTemplate
): Promise<SMSSendResult[]> {
  const results: SMSSendResult[] = [];

  // Process in batches of 10 to avoid rate limiting
  const BATCH_SIZE = 10;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map(({ phone, data }) => sendSMS(phone, template, data))
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        results.push({
          success: false,
          error: result.reason?.message || "Unknown error",
        });
      }
    }

    // Add delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  const successful = results.filter((r) => r.success).length;
  console.log(`Batch SMS complete: ${successful}/${results.length} successful`);

  return results;
}

/**
 * Check if SMS service is configured and available
 */
export function isSMSConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );
}
