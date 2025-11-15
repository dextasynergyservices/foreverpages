/**
 * Email Service using Brevo (formerly SendinBlue)
 *
 * Handles all email communications:
 * - Email verification (link & code)
 * - Welcome emails
 * - Password reset
 * - Admin notifications
 */

import * as brevo from "@getbrevo/brevo";
import { logEmailSent } from "@/lib/email-logger";

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
const ADMIN_EMAIL = process.env.BREVO_ADMIN_EMAIL || "admin@foreverpages.online";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Log email sending attempts to database (wrapper for new logger)
 */
async function logEmail(
  recipientEmail: string,
  subject: string,
  template: "EMAIL_VERIFICATION" | "WELCOME" | "PASSWORD_RESET" | "SUBSCRIPTION_CONFIRMATION",
  success: boolean,
  messageId?: string,
  errorMsg?: string
): Promise<void> {
  await logEmailSent({
    to: recipientEmail,
    from: SENDER_EMAIL,
    subject,
    template,
    messageId: messageId || undefined,
    providerId: messageId || undefined,
    metadata: success ? { success: true } : { success: false, error: errorMsg },
  });
}

/**
 * Send email verification email with both link and code
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationCode: string,
  verificationToken: string
): Promise<EmailResult> {
  const subject = "Verify Your Email - ForeverPages";
  const verificationLink = `${APP_URL}/email-verification-token?token=${verificationToken}`;

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
    <h1 style="color: white; margin: 0; font-size: 28px;">ForeverPages</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Welcome, ${name}! 🎉</h2>

    <p>Thank you for choosing ForeverPages to honor and preserve precious memories. We're honored to be part of your journey.</p>

    <p><strong>Please verify your email address to complete your registration.</strong></p>

    <div style="margin: 30px 0;">
      <h3 style="color: #667eea; margin-bottom: 10px;">Option 1: Click the Link</h3>
      <a href="${verificationLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0;">Verify Email Address</a>
    </div>

    <div style="margin: 30px 0; padding: 20px; background: white; border-left: 4px solid #667eea; border-radius: 5px;">
      <h3 style="color: #667eea; margin-top: 0;">Option 2: Enter Verification Code</h3>
      <p>Visit <a href="${APP_URL}/email-verification-code" style="color: #667eea;">Email Verification</a> and enter this code:</p>
      <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; border-radius: 5px; margin: 10px 0;">
        ${verificationCode}
      </div>
      <p style="font-size: 12px; color: #666;">This code expires in 24 hours.</p>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
      <p style="font-size: 14px; color: #666;">
        If you didn't create an account with ForeverPages, please ignore this email.
      </p>
      <p style="font-size: 14px; color: #666;">
        Need help? Contact us at <a href="mailto:${SENDER_EMAIL}" style="color: #667eea;">${SENDER_EMAIL}</a>
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} ForeverPages. Preserving memories, honoring lives.</p>
  </div>
</body>
</html>
  `;

  try {
    const apiClient = getBrevoClient();

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
    sendSmtpEmail.to = [{ email, name }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    const response = await apiClient.sendTransacEmail(sendSmtpEmail);

    await logEmail(email, subject, "EMAIL_VERIFICATION", true, response.body.messageId);

    console.log(`✅ Verification email sent to ${email}`);
    return { success: true, messageId: response.body.messageId };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`❌ Failed to send verification email to ${email}:`, errorMsg);

    await logEmail(email, subject, "EMAIL_VERIFICATION", false, undefined, errorMsg);

    return { success: false, error: errorMsg };
  }
}

/**
 * Send welcome email after successful verification
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<EmailResult> {
  const subject = "Welcome to ForeverPages! 🌟";

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
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ForeverPages! 🌟</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Hello ${name},</h2>

    <p>Your email has been verified successfully! You're now ready to create beautiful memorial pages that honor and celebrate the lives of your loved ones.</p>

    <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #667eea; margin-top: 0;">Getting Started</h3>
      <ul style="color: #666;">
        <li>Create your first memorial page</li>
        <li>Upload photos and videos</li>
        <li>Share tributes and memories</li>
        <li>Invite family and friends</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/user-dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
      <p style="font-size: 14px; color: #666;">
        Need help? Contact us at <a href="mailto:${SENDER_EMAIL}" style="color: #667eea;">${SENDER_EMAIL}</a>
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} ForeverPages. Preserving memories, honoring lives.</p>
  </div>
</body>
</html>
  `;

  try {
    const apiClient = getBrevoClient();

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
    sendSmtpEmail.to = [{ email, name }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    const response = await apiClient.sendTransacEmail(sendSmtpEmail);

    await logEmail(email, subject, "WELCOME", true, response.body.messageId);

    console.log(`✅ Welcome email sent to ${email}`);
    return { success: true, messageId: response.body.messageId };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`❌ Failed to send welcome email to ${email}:`, errorMsg);

    await logEmail(email, subject, "WELCOME", false, undefined, errorMsg);

    return { success: false, error: errorMsg };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<EmailResult> {
  const subject = "Reset Your Password - ForeverPages";
  const resetLink = `${APP_URL}/reset-password?token=${resetToken}`;

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
    <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Hello ${name},</h2>

    <p>We received a request to reset your password for your ForeverPages account.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
    </div>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; color: #856404;">
        <strong>⚠️ Security Notice:</strong> This link expires in 1 hour.
      </p>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
      <p style="font-size: 14px; color: #666;">
        If you didn't request a password reset, please ignore this email and your password will remain unchanged.
      </p>
      <p style="font-size: 14px; color: #666;">
        Need help? Contact us at <a href="mailto:${SENDER_EMAIL}" style="color: #667eea;">${SENDER_EMAIL}</a>
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} ForeverPages. Preserving memories, honoring lives.</p>
  </div>
</body>
</html>
  `;

  try {
    const apiClient = getBrevoClient();

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
    sendSmtpEmail.to = [{ email, name }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    const response = await apiClient.sendTransacEmail(sendSmtpEmail);

    await logEmail(email, subject, "PASSWORD_RESET", true, response.body.messageId);

    console.log(`✅ Password reset email sent to ${email}`);
    return { success: true, messageId: response.body.messageId };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`❌ Failed to send password reset email to ${email}:`, errorMsg);

    await logEmail(email, subject, "PASSWORD_RESET", false, undefined, errorMsg);

    return { success: false, error: errorMsg };
  }
}

/**
 * Send admin notification when a new user signs up
 */
export async function notifyAdminNewSignup(
  userEmail: string,
  userName: string,
  planName: string,
  amountPaid: string
): Promise<EmailResult> {
  const subject = `🎉 New Signup: ${userName}`;

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
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 New User Signup!</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">New Registration Details</h2>

    <table style="width: 100%; background: white; border-radius: 5px; padding: 20px;">
      <tr>
        <td style="padding: 10px; font-weight: bold; color: #667eea;">Name:</td>
        <td style="padding: 10px;">${userName}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="padding: 10px; font-weight: bold; color: #667eea;">Email:</td>
        <td style="padding: 10px;">${userEmail}</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; color: #667eea;">Plan:</td>
        <td style="padding: 10px;">${planName}</td>
      </tr>
      <tr style="background: #f9f9f9;">
        <td style="padding: 10px; font-weight: bold; color: #667eea;">Amount Paid:</td>
        <td style="padding: 10px;">${amountPaid}</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; color: #667eea;">Signup Time:</td>
        <td style="padding: 10px;">${new Date().toLocaleString()}</td>
      </tr>
    </table>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/admin/users" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View in Admin Dashboard</a>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} ForeverPages Admin Notifications</p>
  </div>
</body>
</html>
  `;

  try {
    const apiClient = getBrevoClient();

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
    sendSmtpEmail.to = [{ email: ADMIN_EMAIL, name: "Admin" }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    const response = await apiClient.sendTransacEmail(sendSmtpEmail);

    await logEmail(
      ADMIN_EMAIL,
      subject,
      "SUBSCRIPTION_CONFIRMATION",
      true,
      response.body.messageId
    );

    console.log(`✅ Admin notification sent`);
    return { success: true, messageId: response.body.messageId };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`❌ Failed to send admin notification:`, errorMsg);

    await logEmail(ADMIN_EMAIL, subject, "SUBSCRIPTION_CONFIRMATION", false, undefined, errorMsg);

    return { success: false, error: errorMsg };
  }
}
