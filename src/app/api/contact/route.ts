/**
 * Contact Form API
 * POST /api/contact
 *
 * Handles contact form submissions from the homepage
 * Sends email notification to admin/support
 */

import { NextRequest, NextResponse } from "next/server";
import * as brevo from "@getbrevo/brevo";
import { z } from "zod";

// Validation schema for contact form
const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  subject: z
    .string()
    .min(5, "Subject must be at least 5 characters")
    .max(200, "Subject is too long"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message is too long"),
});

// Email configuration
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "noreply@foreverpages.online";
const SENDER_NAME = process.env.BREVO_SENDER_NAME || "ForeverPages";
const ADMIN_EMAIL = process.env.BREVO_ADMIN_EMAIL || "admin@foreverpages.online";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@foreverpages.online";

// Initialize Brevo API client
let apiInstance: brevo.TransactionalEmailsApi | null = null;

function getBrevoClient(): brevo.TransactionalEmailsApi {
  if (!apiInstance) {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not configured");
    }

    apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
  }

  return apiInstance;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ============================================
    // 1. VALIDATE INPUT
    // ============================================
    const validation = contactFormSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || "Invalid input";
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = validation.data;

    // ============================================
    // 2. SEND EMAIL TO ADMIN/SUPPORT
    // ============================================
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📬 New Contact Form Submission</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd; border-top: none;">
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #667eea; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Contact Details</h3>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; font-weight: bold; color: #555; width: 100px;">Name:</td>
          <td style="padding: 10px 0;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: bold; color: #555;">Email:</td>
          <td style="padding: 10px 0;">
            <a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: bold; color: #555;">Subject:</td>
          <td style="padding: 10px 0;">${subject}</td>
        </tr>
      </table>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px;">
      <h3 style="color: #667eea; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Message</h3>
      <p style="white-space: pre-wrap; margin: 0; color: #444;">${message}</p>
    </div>

    <div style="margin-top: 20px; text-align: center;">
      <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}"
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Reply to ${name}
      </a>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px;">
      <p>This message was sent from the ForeverPages contact form.</p>
      <p>Submitted on: ${new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}</p>
    </div>
  </div>
</body>
</html>
    `;

    try {
      const apiClient = getBrevoClient();

      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
      sendSmtpEmail.to = [
        { email: ADMIN_EMAIL, name: "ForeverPages Admin" },
        { email: SUPPORT_EMAIL, name: "ForeverPages Support" },
      ];
      sendSmtpEmail.replyTo = { email: email, name: name };
      sendSmtpEmail.subject = `[Contact Form] ${subject}`;
      sendSmtpEmail.htmlContent = htmlContent;

      await apiClient.sendTransacEmail(sendSmtpEmail);

      console.log(`✅ Contact form submission sent to admin from: ${email}`);
    } catch (emailError) {
      console.error("❌ Failed to send contact form email:", emailError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send your message. Please try again or email us directly.",
        },
        { status: 500 }
      );
    }

    // ============================================
    // 3. SEND CONFIRMATION EMAIL TO USER
    // ============================================
    try {
      const apiClient = getBrevoClient();

      const confirmationEmail = new brevo.SendSmtpEmail();
      confirmationEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
      confirmationEmail.to = [{ email: email, name: name }];
      confirmationEmail.subject = "We received your message - ForeverPages";
      confirmationEmail.htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Message Received</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Thank You for Contacting Us!</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Hello ${name},</h2>

    <p>Thank you for reaching out to ForeverPages. We have received your message and will get back to you as soon as possible.</p>

    <div style="background: #fff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
      <p style="margin: 0; color: #666;"><strong>Your message:</strong></p>
      <p style="margin: 10px 0 0 0; color: #444;">"${subject}"</p>
    </div>

    <p>Our team typically responds within 24-48 hours during business days.</p>

    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      Best regards,<br>
      <strong>The ForeverPages Team</strong>
    </p>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px;">
      <p>&copy; ${new Date().getFullYear()} ForeverPages. Preserving memories, honoring lives.</p>
    </div>
  </div>
</body>
</html>
      `;

      await apiClient.sendTransacEmail(confirmationEmail);
      console.log(`✅ Confirmation email sent to: ${email}`);
    } catch (confirmError) {
      // Don't fail the request if confirmation email fails
      console.error("⚠️ Failed to send confirmation email:", confirmError);
    }

    // ============================================
    // 4. RETURN SUCCESS RESPONSE
    // ============================================
    return NextResponse.json(
      {
        success: true,
        message: "Your message has been sent successfully. We'll get back to you soon!",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Contact form error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}
