import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import {
  generateInvitationEmailHTML,
  generateInvitationEmailSubject,
} from "@/lib/emailTemplates/invitationEmail";
import { sendInvitationWhatsApp } from "@/lib/whatsapp";
import {
  generateMemorialCalendarInvite,
  generateCalendarInviteFilename,
} from "@/lib/calendarInvite";
import { generateInvitationRSVPQRCode } from "@/lib/qrCode";

/**
 * DELETE: Revoke/Delete an invitation
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Find the invitation and verify ownership
    const invitation = await prisma.invitation.findUnique({
      where: { id },
      include: {
        memorial: {
          select: { ownerId: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Verify the user owns the memorial
    if (invitation.memorial.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if already accepted (can't delete accepted invitations)
    if (invitation.status === "ACCEPTED") {
      return NextResponse.json({ error: "Cannot delete an accepted invitation" }, { status: 400 });
    }

    // Update status to REVOKED instead of deleting (for audit trail)
    await prisma.invitation.update({
      where: { id },
      data: {
        status: "REVOKED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation revoked successfully",
    });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json({ error: "Failed to delete invitation" }, { status: 500 });
  }
}

/**
 * PATCH: Resend an invitation
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Find the invitation and verify ownership
    const invitation = await prisma.invitation.findUnique({
      where: { id },
      include: {
        memorial: {
          select: {
            ownerId: true,
            firstName: true,
            lastName: true,
            id: true,
            funeralDate: true,
            funeralLocation: true,
            funeralDetails: true,
            biography: true,
          },
        },
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Verify the user owns the memorial
    if (invitation.memorial.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if already accepted
    if (invitation.status === "ACCEPTED") {
      return NextResponse.json({ error: "Cannot resend an accepted invitation" }, { status: 400 });
    }

    // Check if expired and extend expiration
    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Track delivery status
    let sentViaEmail = false;
    let sentViaWhatsApp = false;
    const deliveryErrors: string[] = [];

    // Send email if invitation has email
    if (invitation.email) {
      try {
        const memorialName = `${invitation.memorial.firstName} ${invitation.memorial.lastName}`;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://foreverpages.online";

        // Generate QR code for RSVP if rsvpToken exists
        let qrCodeDataUrl: string | undefined;
        if (invitation.rsvpToken) {
          try {
            qrCodeDataUrl = await generateInvitationRSVPQRCode(invitation.rsvpToken, baseUrl, {
              width: 300,
            });
          } catch (qrError) {
            console.error("Failed to generate QR code:", qrError);
            // Continue without QR code if generation fails
          }
        }

        const emailHTML = generateInvitationEmailHTML({
          recipientName: invitation.name || "",
          recipientEmail: invitation.email,
          inviterName: invitation.invitedBy.name || invitation.invitedBy.email || "Someone",
          memorialName,
          memorialId: invitation.memorial.id,
          role: invitation.role,
          token: invitation.token,
          rsvpToken: invitation.rsvpToken || undefined,
          expiresAt: newExpiresAt.toISOString(),
          message: invitation.message || undefined,
          invitationCard: invitation.invitationCard || undefined,
          customSubject: invitation.customSubject || undefined,
          qrCodeDataUrl,
        });

        const emailSubject = generateInvitationEmailSubject(
          invitation.invitedBy.name || invitation.invitedBy.email || "Someone",
          memorialName,
          invitation.customSubject || undefined
        );

        // Generate calendar invite if memorial has funeral date
        const attachments = [];
        if (invitation.memorial.funeralDate) {
          const calendarResult = generateMemorialCalendarInvite(
            {
              id: invitation.memorial.id,
              firstName: invitation.memorial.firstName,
              lastName: invitation.memorial.lastName,
              funeralDate: invitation.memorial.funeralDate,
              funeralLocation: invitation.memorial.funeralLocation,
              funeralDetails: invitation.memorial.funeralDetails,
              biography: invitation.memorial.biography,
            },
            {
              email: invitation.email,
              name: invitation.name || "",
            }
          );

          if (calendarResult.success && calendarResult.icsContent) {
            // Convert ICS content to base64
            const icsBase64 = Buffer.from(calendarResult.icsContent).toString("base64");
            attachments.push({
              name: generateCalendarInviteFilename(invitation.memorial),
              content: icsBase64,
            });
          }
        }

        await sendEmail({
          to: invitation.email,
          subject: emailSubject,
          html: emailHTML,
          attachments: attachments.length > 0 ? attachments : undefined,
        });

        sentViaEmail = true;
      } catch (error) {
        console.error("Failed to resend invitation email:", error);
        deliveryErrors.push("email");
      }
    }

    // Send WhatsApp if invitation has phone
    if (invitation.phone) {
      try {
        const memorialName = `${invitation.memorial.firstName} ${invitation.memorial.lastName}`;
        const success = await sendInvitationWhatsApp({
          recipientName: invitation.name || "there",
          recipientPhone: invitation.phone,
          inviterName: invitation.invitedBy.name || invitation.invitedBy.email || "Someone",
          memorialName,
          role: invitation.role,
          token: invitation.token,
          expiresAt: newExpiresAt.toISOString(),
        });

        if (success) {
          sentViaWhatsApp = true;
        } else {
          deliveryErrors.push("whatsapp");
        }
      } catch (error) {
        console.error("Failed to resend invitation WhatsApp:", error);
        deliveryErrors.push("whatsapp");
      }
    }

    // If both methods failed, return error
    if (invitation.email && invitation.phone && !sentViaEmail && !sentViaWhatsApp) {
      return NextResponse.json(
        { error: "Failed to resend invitation via any channel", deliveryErrors },
        { status: 500 }
      );
    }

    // Update the invitation
    const updatedInvitation = await prisma.invitation.update({
      where: { id },
      data: {
        status: "PENDING",
        sentAt: now,
        expiresAt: newExpiresAt,
        sentViaEmail,
        sentViaWhatsApp,
      },
    });

    // Build success message
    const channels: string[] = [];
    if (sentViaEmail) channels.push("email");
    if (sentViaWhatsApp) channels.push("WhatsApp");

    const successMessage =
      channels.length > 0
        ? `Invitation resent successfully via ${channels.join(" and ")}`
        : "Invitation updated";

    return NextResponse.json({
      success: true,
      message: successMessage,
      deliveryErrors: deliveryErrors.length > 0 ? deliveryErrors : undefined,
      data: {
        invitation: {
          id: updatedInvitation.id,
          email: updatedInvitation.email,
          phone: updatedInvitation.phone,
          name: updatedInvitation.name,
          status: updatedInvitation.status.toLowerCase(),
          sentAt: updatedInvitation.sentAt.toISOString(),
          expiresAt: updatedInvitation.expiresAt.toISOString(),
          sentViaEmail: updatedInvitation.sentViaEmail,
          sentViaWhatsApp: updatedInvitation.sentViaWhatsApp,
        },
      },
    });
  } catch (error) {
    console.error("Error resending invitation:", error);
    return NextResponse.json({ error: "Failed to resend invitation" }, { status: 500 });
  }
}
