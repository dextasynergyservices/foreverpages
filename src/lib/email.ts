import * as brevo from "@getbrevo/brevo";

interface EmailAttachment {
  name: string;
  content: string; // Base64 encoded content
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  attachments?: EmailAttachment[];
}

// Email sender configuration (from existing email-service.ts pattern)
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "noreply@foreverpages.online";
const SENDER_NAME = process.env.BREVO_SENDER_NAME || "ForeverPages";

// Initialize Brevo API client (same pattern as email-service.ts)
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

export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, subject, html, attachments } = options;

  try {
    const apiClient = getBrevoClient();

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      sendSmtpEmail.attachment = attachments.map((att) => ({
        name: att.name,
        content: att.content,
      }));
    }

    const response = await apiClient.sendTransacEmail(sendSmtpEmail);

    console.log(`✅ Email sent to ${to}`, response.body.messageId);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`❌ Failed to send email to ${to}:`, errorMsg);
    throw new Error(`Email sending failed: ${errorMsg}`);
  }
}

/**
 * Send verification code email
 */
export async function sendVerificationCode(email: string, code: string, name?: string) {
  await sendEmail({
    to: email,
    subject: "Your ForeverPages 2FA Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">2FA Verification</h2>
        <p>Hello ${name || "there"},</p>
        <p>Your verification code is:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #666; font-size: 14px;">
          This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">
          ForeverPages - Preserve memories, forever.
        </p>
      </div>
    `,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string, resetLink: string, name?: string) {
  await sendEmail({
    to: email,
    subject: "Reset Your Password - ForeverPages",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${name || "there"},</p>
        <p>You requested to reset your password for your ForeverPages account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
        <p style="color: #666; font-size: 12px;">
          Or copy and paste this link: ${resetLink}
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">
          ForeverPages - Preserve memories, forever.
        </p>
      </div>
    `,
  });
}

/**
 * Send subscription expiration reminder (7 days)
 */
export async function sendSubscriptionReminder7Days(
  email: string,
  name: string,
  planName: string,
  expiresAt: Date,
  renewalLink: string
) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(expiresAt);

  await sendEmail({
    to: email,
    subject: `Reminder: Your ${planName} subscription expires in 7 days`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 28px;">ForeverPages</h1>
        </div>

        <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e; font-weight: 600;">
              ⏰ Your <strong>${planName}</strong> subscription expires in <strong>7 days</strong>
            </p>
          </div>

          <p style="color: #666; line-height: 1.6;">
            Your subscription will expire on <strong>${formattedDate}</strong>.
            To continue enjoying uninterrupted access to all features, please renew your subscription.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${renewalLink}" style="background: #667eea; color: #fff; padding: 14px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
              Renew Now
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">
            Benefits of staying subscribed:
          </p>
          <ul style="color: #666; line-height: 1.8;">
            <li>Unlimited memorial pages</li>
            <li>High-quality photo and video uploads</li>
            <li>Custom templates and themes</li>
            <li>Priority customer support</li>
          </ul>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />

          <p style="color: #999; font-size: 12px; text-align: center;">
            ForeverPages - Preserve memories, forever.<br/>
            If you have questions, reply to this email or visit our support center.
          </p>
        </div>
      </div>
    `,
  });
}

/**
 * Send critical subscription expiration alert (3 days and daily thereafter)
 */
export async function sendSubscriptionCriticalAlert(
  email: string,
  name: string,
  planName: string,
  daysRemaining: number,
  renewalLink: string
) {
  const urgency =
    daysRemaining === 0 ? "today" : `in ${daysRemaining} ${daysRemaining === 1 ? "day" : "days"}`;
  const subject =
    daysRemaining === 0
      ? `⚠️ URGENT: Your ${planName} subscription expires today!`
      : `⚠️ CRITICAL: ${daysRemaining} ${daysRemaining === 1 ? "day" : "days"} until your subscription expires`;

  await sendEmail({
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 28px;">⚠️ Urgent Action Required</h1>
        </div>

        <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>

          <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #991b1b; font-weight: 700; font-size: 16px;">
              🚨 Your <strong>${planName}</strong> subscription expires ${urgency}!
            </p>
          </div>

          <p style="color: #666; line-height: 1.6; font-size: 15px;">
            <strong>This is a critical reminder.</strong> Your access to ForeverPages features will be suspended once your subscription expires.
          </p>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #333; font-weight: 600;">What happens if you don't renew:</p>
            <ul style="margin: 0; color: #666; padding-left: 20px;">
              <li>Access to your memorial pages will be limited</li>
              <li>You won't be able to upload new content</li>
              <li>Advanced features will be disabled</li>
              <li>Your data will remain safe for 30 days</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${renewalLink}" style="background: #dc2626; color: #fff; padding: 16px 50px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 700; font-size: 18px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3); animation: pulse 2s infinite;">
              Renew Now - Don't Lose Access
            </a>
          </div>

          <p style="color: #666; font-size: 13px; text-align: center; margin-top: 20px;">
            Need help? Contact our support team - we're here for you.
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />

          <p style="color: #999; font-size: 12px; text-align: center;">
            ForeverPages - Preserve memories, forever.<br/>
            If you have questions, reply to this email immediately.
          </p>
        </div>
      </div>
    `,
  });
}

/**
 * Send admin notification when user subscription expires without renewal
 */
export async function sendAdminSubscriptionExpiredNotification(
  adminEmail: string,
  userName: string,
  userEmail: string,
  planName: string,
  userId: string
) {
  await sendEmail({
    to: adminEmail,
    subject: `[Admin Alert] User subscription expired: ${userEmail}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Subscription Expiration Alert</h2>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #92400e; font-weight: 600;">
            A user's subscription has expired without renewal
          </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #666;">User:</td>
            <td style="padding: 10px 0;">${userName} (${userEmail})</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #666;">User ID:</td>
            <td style="padding: 10px 0;">${userId}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #666;">Plan:</td>
            <td style="padding: 10px 0;">${planName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #666;">Date:</td>
            <td style="padding: 10px 0;">${new Date().toLocaleDateString()}</td>
          </tr>
        </table>

        <p style="color: #666; line-height: 1.6;">
          <strong>Recommended Action:</strong> Consider reaching out to this user to offer support or discuss renewal options.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/users/${userId}" style="background: #667eea; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
            View User Profile
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">
          ForeverPages Admin - Automated Notification
        </p>
      </div>
    `,
  });
}
