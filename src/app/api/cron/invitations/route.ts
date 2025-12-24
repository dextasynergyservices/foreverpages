import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as Brevo from "@getbrevo/brevo";

// Initialize Brevo client
const brevoApiInstance = new Brevo.TransactionalEmailsApi();
brevoApiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY || ""
);

// Cron job secret for security (set in environment variables)
const CRON_SECRET = process.env.CRON_SECRET || "your-secret-key";

/**
 * Combined cron job endpoint for:
 * 1. Sending scheduled invitations
 * 2. Sending automatic reminders
 *
 * This endpoint should be called by Vercel Cron or external scheduler
 * Configuration: Run every hour or as needed
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const results = {
      scheduledSent: 0,
      remindersSent: 0,
      errors: [] as string[],
    };

    // ============================================
    // PART 1: Process Scheduled Invitations
    // ============================================
    const scheduledInvitations = await prisma.invitation.findMany({
      where: {
        isScheduled: true,
        wasSentScheduled: false,
        scheduledFor: {
          lte: now, // Due to be sent
        },
        status: "PENDING",
      },
      include: {
        memorial: true,
        invitedBy: true,
      },
    });

    for (const invitation of scheduledInvitations) {
      try {
        // Send email via Brevo
        if (invitation.sentViaEmail && invitation.email) {
          const emailContent = buildEmailContent(invitation as unknown as InvitationWithRelations);
          const sendSmtpEmail = new Brevo.SendSmtpEmail();
          sendSmtpEmail.to = [{ email: invitation.email, name: invitation.name || undefined }];
          sendSmtpEmail.sender = {
            email: process.env.BREVO_SENDER_EMAIL || "noreply@foreverpages.online",
            name: invitation.invitedBy.name || "ForeverPages",
          };
          sendSmtpEmail.subject = invitation.customSubject || emailContent.subject;
          sendSmtpEmail.htmlContent = emailContent.html;

          await brevoApiInstance.sendTransacEmail(sendSmtpEmail);
        }

        // Send WhatsApp via Green API (if configured)
        if (invitation.sentViaWhatsApp && invitation.phone) {
          await sendWhatsAppMessage(invitation);
        }

        // Mark as sent
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: {
            wasSentScheduled: true,
            sentAt: now,
          },
        });

        results.scheduledSent++;
      } catch (error) {
        console.error(`Failed to send scheduled invitation ${invitation.id}:`, error);
        results.errors.push(`Scheduled invitation ${invitation.id}: ${error}`);
      }
    }

    // ============================================
    // PART 2: Process Automatic Reminders
    // ============================================
    const invitationsWithReminders = await prisma.invitation.findMany({
      where: {
        sendReminders: true,
        status: "ACCEPTED", // Only send reminders to accepted invitations
      },
      include: {
        memorial: true,
        invitedBy: true,
      },
    });

    for (const invitation of invitationsWithReminders) {
      try {
        // Check if memorial has a funeral date
        if (!invitation.memorial.funeralDate) {
          continue;
        }

        const funeralDate = new Date(invitation.memorial.funeralDate);
        const daysUntilFuneral = Math.ceil(
          (funeralDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Get reminders already sent
        const remindersSent = (invitation.remindersSent as Record<string, string>) || {};
        const reminderDays = invitation.reminderDaysBefore || [7, 3, 1];

        // Check if we should send a reminder
        for (const daysBefore of reminderDays) {
          if (daysUntilFuneral === daysBefore && !remindersSent[daysBefore.toString()]) {
            // Send reminder email
            if (invitation.sentViaEmail && invitation.email) {
              const reminderContent = buildReminderEmail(
                invitation as unknown as InvitationWithRelations,
                daysBefore
              );
              const sendSmtpEmail = new Brevo.SendSmtpEmail();
              sendSmtpEmail.to = [{ email: invitation.email, name: invitation.name || undefined }];
              sendSmtpEmail.sender = {
                email: process.env.BREVO_SENDER_EMAIL || "noreply@foreverpages.online",
                name: invitation.invitedBy.name || "ForeverPages",
              };
              sendSmtpEmail.subject = reminderContent.subject;
              sendSmtpEmail.htmlContent = reminderContent.html;

              await brevoApiInstance.sendTransacEmail(sendSmtpEmail);
            }

            // Send reminder via WhatsApp
            if (invitation.sentViaWhatsApp && invitation.phone) {
              await sendWhatsAppReminder(invitation, daysBefore);
            }

            // Update reminder tracking
            remindersSent[daysBefore.toString()] = now.toISOString();
            await prisma.invitation.update({
              where: { id: invitation.id },
              data: {
                remindersSent: remindersSent,
                lastReminderSentAt: now,
              },
            });

            results.remindersSent++;
          }
        }
      } catch (error) {
        console.error(`Failed to send reminder for invitation ${invitation.id}:`, error);
        results.errors.push(`Reminder ${invitation.id}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// Type for invitation with relations
type InvitationWithRelations = {
  id: string;
  message: string | null;
  customSubject: string | null;
  invitationCard: string | null;
  templateVariables: unknown;
  name: string | null;
  phone: string | null;
  sentViaEmail: boolean;
  sentViaWhatsApp: boolean;
  memorial: {
    firstName: string;
    lastName: string;
    funeralDate: Date | null;
    funeralLocation: string | null;
  };
  invitedBy: {
    name: string | null;
  };
  plusOnes: number | null;
};

// Helper function to build email content from template
function buildEmailContent(invitation: InvitationWithRelations) {
  const memorialName = `${invitation.memorial.firstName} ${invitation.memorial.lastName}`;
  const serviceDateStr = invitation.memorial.funeralDate
    ? new Date(invitation.memorial.funeralDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Date TBD";

  // Parse template variables if available
  let body = invitation.message || "";

  if (invitation.templateVariables) {
    const variables = invitation.templateVariables as Record<string, string>;
    body = body
      .replace(/\{\{memorial_name\}\}/g, memorialName)
      .replace(/\{\{service_date\}\}/g, serviceDateStr)
      .replace(/\{\{service_location\}\}/g, invitation.memorial.funeralLocation || "Location TBD")
      .replace(/\{\{recipient_name\}\}/g, invitation.name || "")
      .replace(/\{\{sender_name\}\}/g, invitation.invitedBy.name || "")
      .replace(/\{\{custom_message\}\}/g, variables.customMessage || "");
  }

  return {
    subject: invitation.customSubject || `Invitation to ${memorialName}'s Memorial Service`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { white-space: pre-wrap; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            ${invitation.invitationCard ? `<div class="header"><img src="${invitation.invitationCard}" alt="Invitation" style="max-width: 100%; height: auto;"></div>` : ""}
            <div class="content">
              ${body}
            </div>
            <div class="footer">
              <p>This invitation was sent via ForeverPages</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// Helper function to build reminder email
function buildReminderEmail(invitation: InvitationWithRelations, daysBefore: number) {
  const memorialName = `${invitation.memorial.firstName} ${invitation.memorial.lastName}`;
  const serviceDateStr = invitation.memorial.funeralDate
    ? new Date(invitation.memorial.funeralDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Date TBD";

  return {
    subject: `Reminder: ${memorialName}'s Memorial Service in ${daysBefore} ${daysBefore === 1 ? "Day" : "Days"}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .reminder-badge { background-color: #4F46E5; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 20px; }
            .content { margin: 20px 0; }
            .details { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="reminder-badge">REMINDER: ${daysBefore} ${daysBefore === 1 ? "Day" : "Days"} Away</div>
            <h2>Memorial Service for ${memorialName}</h2>
            <div class="content">
              <p>Hi ${invitation.name || "there"},</p>
              <p>This is a friendly reminder that the memorial service for ${memorialName} is coming up in ${daysBefore} ${daysBefore === 1 ? "day" : "days"}.</p>
            </div>
            <div class="details">
              <p><strong>Date & Time:</strong> ${serviceDateStr}</p>
              ${invitation.memorial.funeralLocation ? `<p><strong>Location:</strong> ${invitation.memorial.funeralLocation}</p>` : ""}
              ${invitation.plusOnes ? `<p><strong>Plus Ones:</strong> ${invitation.plusOnes}</p>` : ""}
            </div>
            <p>We look forward to seeing you there.</p>
            <div class="footer">
              <p>This reminder was sent via ForeverPages</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

// Helper function to send WhatsApp message
async function sendWhatsAppMessage(invitation: InvitationWithRelations) {
  const GREEN_API_INSTANCE_ID = process.env.GREEN_API_INSTANCE_ID;
  const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN;

  if (!GREEN_API_INSTANCE_ID || !GREEN_API_TOKEN) {
    console.warn("Green API credentials not configured");
    return;
  }

  const memorialName = `${invitation.memorial.firstName} ${invitation.memorial.lastName}`;
  const message = `You're invited to ${memorialName}'s memorial service. ${invitation.message || ""}`;

  const response = await fetch(
    `https://api.green-api.com/waInstance${GREEN_API_INSTANCE_ID}/sendMessage/${GREEN_API_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: `${invitation.phone}@c.us`,
        message: message,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`WhatsApp send failed: ${response.statusText}`);
  }
}

// Helper function to send WhatsApp reminder
async function sendWhatsAppReminder(invitation: InvitationWithRelations, daysBefore: number) {
  const GREEN_API_INSTANCE_ID = process.env.GREEN_API_INSTANCE_ID;
  const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN;

  if (!GREEN_API_INSTANCE_ID || !GREEN_API_TOKEN) {
    console.warn("Green API credentials not configured");
    return;
  }

  const memorialName = `${invitation.memorial.firstName} ${invitation.memorial.lastName}`;
  const serviceDateStr = invitation.memorial.funeralDate
    ? new Date(invitation.memorial.funeralDate).toLocaleDateString()
    : "Date TBD";

  const message = `🔔 REMINDER: ${memorialName}'s memorial service is in ${daysBefore} ${daysBefore === 1 ? "day" : "days"} on ${serviceDateStr}. ${invitation.memorial.funeralLocation ? `Location: ${invitation.memorial.funeralLocation}` : ""}`;

  const response = await fetch(
    `https://api.green-api.com/waInstance${GREEN_API_INSTANCE_ID}/sendMessage/${GREEN_API_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: `${invitation.phone}@c.us`,
        message: message,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`WhatsApp reminder send failed: ${response.statusText}`);
  }
}
