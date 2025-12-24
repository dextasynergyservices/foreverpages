import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 });
    }

    const body = await request.json();
    const { supporterIds, subject, message, sendViaEmail, sendViaWhatsApp } = body;

    if (!supporterIds || !Array.isArray(supporterIds) || supporterIds.length === 0) {
      return NextResponse.json({ error: "Please select at least one supporter" }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!sendViaEmail && !sendViaWhatsApp) {
      return NextResponse.json(
        { error: "Please select at least one delivery method" },
        { status: 400 }
      );
    }

    // Get the supports and validate ownership
    const supports = await prisma.memorialSupport.findMany({
      where: {
        id: { in: supporterIds },
        memorialOwnerId: session.user.id, // Only allow messaging supporters of user's own memorials
      },
      include: {
        memorialOwner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        donor: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (supports.length === 0) {
      return NextResponse.json({ error: "No valid supporters found" }, { status: 404 });
    }

    // Get user's memorial information for context
    const userMemorial = await prisma.memorial.findFirst({
      where: { ownerId: session.user.id },
      select: {
        firstName: true,
        lastName: true,
      },
    });

    // Get sender information
    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    if (!sender) {
      return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    }

    let successCount = 0;
    const errors: string[] = [];

    // Send messages to each supporter
    for (const support of supports) {
      const recipientName = support.donorName || support.donor?.name || "Dear Supporter";
      const recipientEmail = support.donorEmail || support.donor?.email;
      const memorialName = userMemorial
        ? `${userMemorial.firstName} ${userMemorial.lastName}`
        : "our memorial";

      // Send via Email
      if (sendViaEmail && recipientEmail) {
        try {
          const emailSubject = subject?.trim() || `Thank you for supporting ${memorialName}`;

          const emailHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
              <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-bottom: 20px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                  ${emailSubject}
                </h2>

                <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  Dear ${recipientName},
                </p>

                <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
                  <div style="color: #333; font-size: 16px; line-height: 1.8; margin: 0; white-space: pre-wrap;">
                    ${message}
                  </div>
                </div>

                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  With heartfelt gratitude,<br>
                  <strong>${sender.name || sender.email}</strong><br>
                  <em>On behalf of the ${memorialName} memorial</em>
                </p>

                <hr style="border: none; height: 1px; background-color: #e0e0e0; margin: 30px 0;">

                <p style="color: #999; font-size: 12px; text-align: center;">
                  This thank you message was sent from ForeverPages memorial platform.
                </p>
              </div>
            </div>
          `;

          await sendEmail({
            to: recipientEmail,
            subject: emailSubject,
            html: emailHTML,
          });

          successCount++;
        } catch (error) {
          console.error(`Failed to send email to ${recipientEmail}:`, error);
          errors.push(`Email to ${recipientName} failed`);
        }
      }

      // Send via WhatsApp
      if (sendViaWhatsApp) {
        // Check if phone number is available from donor data
        const phoneNumber = support.donorPhone || support.donor?.phone;

        if (phoneNumber) {
          try {
            // Format WhatsApp message with custom content
            const whatsappMessage =
              `Hello ${recipientName},\n\n${message}\n\nThank you for your support of ${memorialName}.\n\nWith gratitude,\n${sender.name || sender.email}\n\n---\nSent via ForeverPages Memorial Platform`.trim();

            const success = await sendWhatsAppMessage({
              to: phoneNumber,
              message: whatsappMessage,
            });

            if (success) {
              successCount++;
            } else {
              errors.push(`WhatsApp to ${recipientName} failed - delivery error`);
            }
          } catch (error) {
            console.error(`Failed to send WhatsApp to ${phoneNumber}:`, error);
            errors.push(
              `WhatsApp to ${recipientName} failed - ${error instanceof Error ? error.message : "unknown error"}`
            );
          }
        } else {
          // Phone number not available
          errors.push(`WhatsApp to ${recipientName} failed - no phone number available`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${successCount} message${successCount !== 1 ? "s" : ""}`,
      details: {
        sent: successCount,
        total: supports.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error("Error sending messages to supporters:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
