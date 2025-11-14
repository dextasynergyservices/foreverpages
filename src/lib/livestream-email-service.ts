import * as brevo from "@getbrevo/brevo";
import { logEmailSent } from "@/lib/email-logger";
import { format } from "date-fns";

// Initialize Brevo API client
let apiInstance: brevo.TransactionalEmailsApi | null = null;

function getBrevoClient(): brevo.TransactionalEmailsApi {
  if (!apiInstance) {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not configured in environment variables");
    }

    apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
  }

  return apiInstance;
}

// Email sender configuration
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "noreply@foreverpages.online";
const SENDER_NAME = process.env.BREVO_SENDER_NAME || "ForeverPages";

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface StreamScheduledEmailParams {
  recipientEmail: string;
  recipientName: string;
  memorialName: string;
  streamTitle: string;
  scheduledFor: Date;
  streamUrl: string;
}

interface StreamLiveEmailParams {
  recipientEmail: string;
  recipientName: string;
  memorialName: string;
  streamTitle: string;
  streamUrl: string;
}

interface StreamEndedEmailParams {
  recipientEmail: string;
  recipientName: string;
  memorialName: string;
  streamTitle: string;
  duration: string;
  peakViewers: number;
  totalComments: number;
}

interface RecordingReadyEmailParams {
  recipientEmail: string;
  recipientName: string;
  memorialName: string;
  streamTitle: string;
  recordingUrl: string;
  expiresAt: Date;
}

interface RecordingExpiringEmailParams {
  recipientEmail: string;
  recipientName: string;
  memorialName: string;
  streamTitle: string;
  recordingUrl: string;
  expiresAt: Date;
  daysRemaining: number;
}

interface RecordingDeletedEmailParams {
  recipientEmail: string;
  recipientName: string;
  memorialName: string;
  streamTitle: string;
  deletedAt: Date;
}

/**
 * Send stream scheduled notification
 */
export async function sendStreamScheduledEmail(
  params: StreamScheduledEmailParams
): Promise<EmailResult> {
  const { recipientEmail, recipientName, memorialName, streamTitle, scheduledFor, streamUrl } =
    params;

  const subject = `Livestream Scheduled: ${memorialName}`;
  const formattedDate = format(scheduledFor, "EEEE, MMMM d, yyyy 'at' h:mm a");

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📺 Livestream Scheduled</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Hello ${recipientName},</h2>

    <p>A memorial livestream has been scheduled for <strong>${memorialName}</strong>.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0; color: #667eea;">${streamTitle}</h3>
      <p style="margin: 10px 0;">
        <strong>📅 When:</strong> ${formattedDate}
      </p>
      <p style="margin: 10px 0;">
        <strong>🏠 Memorial:</strong> ${memorialName}
      </p>
    </div>

    <p>The livestream will begin at the scheduled time. You'll receive another email when the stream goes live.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${streamUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Add to Calendar</a>
    </div>

    <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;">
        <strong>💡 Tip:</strong> Make sure you have a stable internet connection for the best viewing experience.
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>You're receiving this because you're connected to ${memorialName} memorial page.</p>
    <p>&copy; ${new Date().getFullYear()} ForeverPages. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  try {
    const apiClient = getBrevoClient();

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
    sendSmtpEmail.to = [{ email: recipientEmail, name: recipientName }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    const response = await apiClient.sendTransacEmail(sendSmtpEmail);

    await logEmailSent({
      to: recipientEmail,
      from: SENDER_EMAIL,
      subject,
      template: "EMAIL_VERIFICATION", // TODO: Add STREAM_SCHEDULED template type
      messageId: response.body.messageId,
      providerId: response.body.messageId,
      metadata: { memorialName, streamTitle, scheduledFor: scheduledFor.toISOString() },
    });

    console.log(`✅ Stream scheduled email sent to ${recipientEmail}`);
    return { success: true, messageId: response.body.messageId };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`❌ Failed to send stream scheduled email:`, errorMsg);

    await logEmailSent({
      to: recipientEmail,
      from: SENDER_EMAIL,
      subject,
      template: "EMAIL_VERIFICATION",
      metadata: { success: false, error: errorMsg },
    });

    return { success: false, error: errorMsg };
  }
}

/**
 * Send stream live notification (URGENT)
 */
export async function sendStreamLiveEmail(params: StreamLiveEmailParams): Promise<EmailResult> {
  const { recipientEmail, recipientName, memorialName, streamTitle, streamUrl } = params;

  const subject = `🔴 LIVE NOW: ${memorialName}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 32px;">
      <span style="display: inline-block; width: 12px; height: 12px; background: #fff; border-radius: 50%; margin-right: 10px; animation: pulse 1.5s infinite;"></span>
      LIVE NOW
    </h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">The livestream is starting now!</h2>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
      <h3 style="margin-top: 0; color: #dc2626;">${streamTitle}</h3>
      <p style="margin: 10px 0;">
        <strong>🏠 Memorial:</strong> ${memorialName}
      </p>
    </div>

    <p style="font-size: 18px; text-align: center; margin: 20px 0;">
      <strong>Join now to watch and share your memories</strong>
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${streamUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;">
        🔴 Watch Live Stream
      </a>
    </div>

    <div style="background: #fef2f2; border: 1px solid #dc2626; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; font-size: 14px; color: #dc2626;">
        <strong>⚡ Don't miss it!</strong> The stream is happening right now.
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} ForeverPages. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  try {
    const apiClient = getBrevoClient();

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
    sendSmtpEmail.to = [{ email: recipientEmail, name: recipientName }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    const response = await apiClient.sendTransacEmail(sendSmtpEmail);

    await logEmailSent({
      to: recipientEmail,
      from: SENDER_EMAIL,
      subject,
      template: "EMAIL_VERIFICATION",
      messageId: response.body.messageId,
      providerId: response.body.messageId,
      metadata: { memorialName, streamTitle },
    });

    console.log(`✅ Stream live email sent to ${recipientEmail}`);
    return { success: true, messageId: response.body.messageId };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`❌ Failed to send stream live email:`, errorMsg);

    await logEmailSent({
      to: recipientEmail,
      from: SENDER_EMAIL,
      subject,
      template: "EMAIL_VERIFICATION",
      metadata: { success: false, error: errorMsg },
    });

    return { success: false, error: errorMsg };
  }
}

/**
 * Send stream ended notification
 */
export async function sendStreamEndedEmail(params: StreamEndedEmailParams): Promise<EmailResult> {
  const {
    recipientEmail,
    recipientName,
    memorialName,
    streamTitle,
    duration,
    peakViewers,
    totalComments,
  } = params;

  const subject = `Stream Ended: ${memorialName}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Stream Ended</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Thank you for joining us</h2>

    <p>The memorial livestream for <strong>${memorialName}</strong> has ended.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #667eea;">${streamTitle}</h3>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px;">
        <div style="text-align: center; padding: 10px; background: #f3f4f6; border-radius: 5px;">
          <div style="font-size: 24px; font-weight: bold; color: #667eea;">${duration}</div>
          <div style="font-size: 12px; color: #666;">Duration</div>
        </div>
        <div style="text-align: center; padding: 10px; background: #f3f4f6; border-radius: 5px;">
          <div style="font-size: 24px; font-weight: bold; color: #667eea;">${peakViewers}</div>
          <div style="font-size: 12px; color: #666;">Peak Viewers</div>
        </div>
        <div style="text-align: center; padding: 10px; background: #f3f4f6; border-radius: 5px;">
          <div style="font-size: 24px; font-weight: bold; color: #667eea;">${totalComments}</div>
          <div style="font-size: 12px; color: #666;">Comments</div>
        </div>
      </div>
    </div>

    <p>The recording is being processed and will be available soon. You'll receive an email when it's ready to watch.</p>

    <div style="background: #dbeafe; border: 1px solid #3b82f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;">
        <strong>📹 Recording:</strong> The recording will be available for 6 months and can be downloaded anytime.
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} ForeverPages. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  try {
    const apiClient = getBrevoClient();

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
    sendSmtpEmail.to = [{ email: recipientEmail, name: recipientName }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    const response = await apiClient.sendTransacEmail(sendSmtpEmail);

    await logEmailSent({
      to: recipientEmail,
      from: SENDER_EMAIL,
      subject,
      template: "EMAIL_VERIFICATION",
      messageId: response.body.messageId,
      providerId: response.body.messageId,
      metadata: { memorialName, streamTitle, duration, peakViewers, totalComments },
    });

    console.log(`✅ Stream ended email sent to ${recipientEmail}`);
    return { success: true, messageId: response.body.messageId };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`❌ Failed to send stream ended email:`, errorMsg);

    await logEmailSent({
      to: recipientEmail,
      from: SENDER_EMAIL,
      subject,
      template: "EMAIL_VERIFICATION",
      metadata: { success: false, error: errorMsg },
    });

    return { success: false, error: errorMsg };
  }
}

/**
 * Send recording ready notification
 */
export async function sendRecordingReadyEmail(
  params: RecordingReadyEmailParams
): Promise<EmailResult> {
  const { recipientEmail, recipientName, memorialName, streamTitle, recordingUrl, expiresAt } =
    params;

  const subject = `Recording Ready: ${memorialName}`;
  const expiryDate = format(expiresAt, "MMMM d, yyyy");

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎥 Recording Ready</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Your recording is ready to watch!</h2>

    <p>The recording of the memorial livestream for <strong>${memorialName}</strong> has been processed and is now available.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h3 style="margin-top: 0; color: #10b981;">${streamTitle}</h3>
      <p style="margin: 10px 0;">
        <strong>📅 Available until:</strong> ${expiryDate}
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${recordingUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-bottom: 10px;">
        ▶️ Watch Recording
      </a>
      <br>
      <a href="${recordingUrl}" style="display: inline-block; background: #6b7280; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">
        ⬇️ Download Recording
      </a>
    </div>

    <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;">
        <strong>⏰ Important:</strong> This recording will be automatically deleted on ${expiryDate}. Download it if you want to keep it permanently.
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} ForeverPages. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  try {
    const apiClient = getBrevoClient();

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
    sendSmtpEmail.to = [{ email: recipientEmail, name: recipientName }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    const response = await apiClient.sendTransacEmail(sendSmtpEmail);

    await logEmailSent({
      to: recipientEmail,
      from: SENDER_EMAIL,
      subject,
      template: "EMAIL_VERIFICATION",
      messageId: response.body.messageId,
      providerId: response.body.messageId,
      metadata: { memorialName, streamTitle, expiresAt: expiresAt.toISOString() },
    });

    console.log(`✅ Recording ready email sent to ${recipientEmail}`);
    return { success: true, messageId: response.body.messageId };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`❌ Failed to send recording ready email:`, errorMsg);

    await logEmailSent({
      to: recipientEmail,
      from: SENDER_EMAIL,
      subject,
      template: "EMAIL_VERIFICATION",
      metadata: { success: false, error: errorMsg },
    });

    return { success: false, error: errorMsg };
  }
}

/**
 * Send recording expiring warning (7 days before deletion)
 */
export async function sendRecordingExpiringEmail(
  params: RecordingExpiringEmailParams
): Promise<EmailResult> {
  const {
    recipientEmail,
    recipientName,
    memorialName,
    streamTitle,
    recordingUrl,
    expiresAt,
    daysRemaining,
  } = params;

  const subject = `⚠️ Recording Expiring Soon: ${memorialName}`;
  const expiryDate = format(expiresAt, "MMMM d, yyyy");

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Recording Expiring Soon</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Action Required: Download Your Recording</h2>

    <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="font-size: 20px; font-weight: bold; color: #d97706; margin: 10px 0;">
        ${daysRemaining} Days Remaining
      </p>
      <p style="margin: 10px 0;">The recording will be deleted on <strong>${expiryDate}</strong></p>
    </div>

    <p>The memorial livestream recording for <strong>${memorialName}</strong> will be automatically deleted in ${daysRemaining} days.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #f59e0b;">${streamTitle}</h3>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${recordingUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
        ⬇️ Download Now (Don't Lose This!)
      </a>
    </div>

    <div style="background: #fef2f2; border: 1px solid #dc2626; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #dc2626;">
        <strong>❗ Important:</strong> Once deleted, this recording cannot be recovered. Download it now to preserve these precious memories forever.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">
      If you need more time, please contact us or extend your recording retention in your dashboard.
    </p>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} ForeverPages. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  try {
    const apiClient = getBrevoClient();

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
    sendSmtpEmail.to = [{ email: recipientEmail, name: recipientName }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    const response = await apiClient.sendTransacEmail(sendSmtpEmail);

    await logEmailSent({
      to: recipientEmail,
      from: SENDER_EMAIL,
      subject,
      template: "EMAIL_VERIFICATION",
      messageId: response.body.messageId,
      providerId: response.body.messageId,
      metadata: { memorialName, streamTitle, expiresAt: expiresAt.toISOString(), daysRemaining },
    });

    console.log(`✅ Recording expiring email sent to ${recipientEmail}`);
    return { success: true, messageId: response.body.messageId };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`❌ Failed to send recording expiring email:`, errorMsg);

    await logEmailSent({
      to: recipientEmail,
      from: SENDER_EMAIL,
      subject,
      template: "EMAIL_VERIFICATION",
      metadata: { success: false, error: errorMsg },
    });

    return { success: false, error: errorMsg };
  }
}

/**
 * Send recording deleted confirmation
 */
export async function sendRecordingDeletedEmail(
  params: RecordingDeletedEmailParams
): Promise<EmailResult> {
  const { recipientEmail, recipientName, memorialName, streamTitle, deletedAt } = params;

  const subject = `Recording Deleted: ${memorialName}`;
  const deletionDate = format(deletedAt, "MMMM d, yyyy 'at' h:mm a");

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6b7280 0%, #374151 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Recording Deleted</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Recording Retention Period Ended</h2>

    <p>The memorial livestream recording for <strong>${memorialName}</strong> has been automatically deleted as scheduled.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #6b7280;">${streamTitle}</h3>
      <p style="margin: 10px 0; color: #666;">
        <strong>Deleted on:</strong> ${deletionDate}
      </p>
    </div>

    <div style="background: #f3f4f6; border: 1px solid #d1d5db; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;">
        <strong>ℹ️ Note:</strong> This was part of our standard 6-month retention policy. We hope you had the opportunity to download the recording if needed.
      </p>
    </div>

    <p>The memorial page remains active with all other content (photos, tributes, and memories) preserved.</p>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} ForeverPages. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  try {
    const apiClient = getBrevoClient();

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
    sendSmtpEmail.to = [{ email: recipientEmail, name: recipientName }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    const response = await apiClient.sendTransacEmail(sendSmtpEmail);

    await logEmailSent({
      to: recipientEmail,
      from: SENDER_EMAIL,
      subject,
      template: "EMAIL_VERIFICATION",
      messageId: response.body.messageId,
      providerId: response.body.messageId,
      metadata: { memorialName, streamTitle, deletedAt: deletedAt.toISOString() },
    });

    console.log(`✅ Recording deleted email sent to ${recipientEmail}`);
    return { success: true, messageId: response.body.messageId };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`❌ Failed to send recording deleted email:`, errorMsg);

    await logEmailSent({
      to: recipientEmail,
      from: SENDER_EMAIL,
      subject,
      template: "EMAIL_VERIFICATION",
      metadata: { success: false, error: errorMsg },
    });

    return { success: false, error: errorMsg };
  }
}
