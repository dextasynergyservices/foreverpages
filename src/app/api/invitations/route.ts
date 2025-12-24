import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import {
  generateInvitationEmailHTML,
  generateInvitationEmailSubject,
} from "@/lib/emailTemplates/invitationEmail";
import {
  generateCollaboratorInvitationEmailHTML,
  generateCollaboratorInvitationEmailSubject,
} from "@/lib/emailTemplates/collaboratorInvitationEmail";
import { sendInvitationWhatsApp } from "@/lib/whatsapp";
import { sendCollaboratorInvitationWhatsApp } from "@/lib/whatsapp-collaborator";
import { generateRSVPToken } from "@/lib/rsvpTokens";
import {
  generateMemorialCalendarInvite,
  generateCalendarInviteFilename,
} from "@/lib/calendarInvite";
import { generateInvitationRSVPQRCode } from "@/lib/qrCode";

export async function GET() {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in to access invitations" },
        { status: 401 }
      );
    }

    // Get user's owned memorials
    const userMemorials = await prisma.memorial.findMany({
      where: { ownerId: session.user.id },
      select: { id: true, ownerId: true },
    });

    // Get memorials where user is an ADMIN collaborator (can manage invitations)
    // Note: Collaborator invitations have invitedUserId set and rsvpToken is null
    const adminCollaborations = await prisma.invitation.findMany({
      where: {
        invitedUserId: session.user.id,
        status: "ACCEPTED",
        role: "ADMIN",
        expiresAt: { gte: new Date() }, // Not expired yet
      },
      select: {
        memorialId: true,
        memorial: {
          select: { ownerId: true },
        },
      },
    });

    // Combine owned and admin collaborator memorial IDs
    const memorialIds = [
      ...userMemorials.map((m: { id: string }) => m.id),
      ...adminCollaborations.map((collab) => collab.memorialId),
    ];

    // Check subscription - user's own subscription OR memorial owner's subscription (for collaborators)
    // Always include the current user's ID so users with subscription but no memorials can access
    const memorialOwnerIds = [
      session.user.id, // Current user (most important!)
      ...new Set([
        ...userMemorials.map((m) => m.ownerId),
        ...adminCollaborations.map((collab) => collab.memorial.ownerId),
      ]),
    ];

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: { in: memorialOwnerIds },
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      return NextResponse.json({ message: "No active subscription found" }, { status: 403 });
    }

    // Get GUEST/RSVP invitations for user's memorials (exclude collaborator invitations)
    // Guest invitations have rsvpToken, collaborator invitations have role for system access
    const invitations = await prisma.invitation.findMany({
      where: {
        memorialId: { in: memorialIds },
        rsvpToken: { not: null }, // Only guest/RSVP invitations (not collaborator invitations)
      },
      orderBy: { sentAt: "desc" },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        status: true,
        message: true,
        sentAt: true,
        acceptedAt: true,
        declinedAt: true,
        rsvpStatus: true,
        rsvpMessage: true,
        rsvpAt: true,
        plusOnes: true,
        dietaryRestrictions: true,
        accessibilityNeeds: true,
        sentViaEmail: true,
        sentViaWhatsApp: true,
        invitedUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Invitations retrieved successfully",
      data: {
        invitations: invitations.map((inv) => ({
          id: inv.id,
          email: inv.email,
          phone: inv.phone,
          name: inv.name || inv.invitedUser?.name || "Pending",
          // Map invitation status (PENDING/ACCEPTED/DECLINED) to display format
          status: inv.status.toLowerCase() as
            | "pending"
            | "accepted"
            | "declined"
            | "expired"
            | "revoked",
          // Map RSVP status for backward compatibility
          rsvp:
            inv.rsvpStatus === "ATTENDING"
              ? "yes"
              : inv.rsvpStatus === "NOT_ATTENDING"
                ? "no"
                : inv.rsvpStatus === "MAYBE"
                  ? "maybe"
                  : null,
          rsvpStatus: inv.rsvpStatus,
          rsvpMessage: inv.rsvpMessage,
          rsvpAt: inv.rsvpAt?.toISOString(),
          plusOnes: inv.plusOnes,
          dietaryRestrictions: inv.dietaryRestrictions,
          accessibilityNeeds: inv.accessibilityNeeds,
          message: inv.message,
          sentViaEmail: inv.sentViaEmail,
          sentViaWhatsApp: inv.sentViaWhatsApp,
          createdAt: inv.sentAt.toISOString(),
          updatedAt: (inv.rsvpAt || inv.acceptedAt || inv.declinedAt || inv.sentAt).toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Invitations fetch error:", error);
    return NextResponse.json(
      { message: "Internal server error - Please try again later" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in to create invitations" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      email,
      phone,
      name,
      memorialId,
      role = "VIEWER",
      message,
      invitationCard,
      customSubject,
      sendViaEmail = true,
      sendViaWhatsApp = false,
    } = body;

    // Validate at least one contact method
    if (!email && !phone) {
      return NextResponse.json(
        { message: "At least one contact method (email or phone) is required" },
        { status: 400 }
      );
    }

    if (!memorialId) {
      return NextResponse.json({ message: "Missing required field: memorialId" }, { status: 400 });
    }

    // Verify the memorial belongs to the user
    const memorial = await prisma.memorial.findFirst({
      where: {
        id: memorialId,
        ownerId: session.user.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        funeralDate: true,
        funeralLocation: true,
        funeralDetails: true,
        biography: true,
      },
    });

    if (!memorial) {
      return NextResponse.json({ message: "Memorial not found or access denied" }, { status: 404 });
    }

    // Get inviter info
    const inviter = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    if (!inviter) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Generate a unique token (for invitation acceptance)
    const token = `inv_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Determine if this is a collaborator invitation (management roles) or guest invitation
    const isCollaboratorInvitation = ["ADMIN", "EDITOR", "CONTRIBUTOR"].includes(role);

    // Generate RSVP token ONLY for guest invitations (not for collaborators)
    const rsvpToken = isCollaboratorInvitation ? null : generateRSVPToken();

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Track delivery status
    let sentViaEmail = false;
    let sentViaWhatsApp = false;
    const deliveryErrors: string[] = [];

    // Send email invitation if requested
    if (sendViaEmail && email) {
      try {
        const memorialName = `${memorial.firstName} ${memorial.lastName}`;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://foreverpages.online";

        let emailHTML: string;
        let emailSubject: string;
        const attachments = [];

        if (isCollaboratorInvitation) {
          // Use collaborator invitation template (no RSVP, no calendar)
          emailHTML = generateCollaboratorInvitationEmailHTML({
            recipientName: name || undefined,
            recipientEmail: email,
            inviterName: inviter.name || inviter.email || "Someone",
            memorialName,
            memorialId: memorial.id,
            role,
            token,
            expiresAt: expiresAt.toISOString(),
            message,
          });

          emailSubject = generateCollaboratorInvitationEmailSubject(
            inviter.name || inviter.email || "Someone",
            memorialName,
            role
          );
        } else {
          // Use guest invitation template (with RSVP, calendar, QR code)
          // Generate QR code for RSVP if rsvpToken exists
          let qrCodeDataUrl: string | undefined;
          if (rsvpToken) {
            try {
              qrCodeDataUrl = await generateInvitationRSVPQRCode(rsvpToken, baseUrl, {
                width: 300,
              });
            } catch (qrError) {
              console.error("Failed to generate QR code:", qrError);
              // Continue without QR code if generation fails
            }
          }

          emailHTML = generateInvitationEmailHTML({
            recipientName: name || "",
            recipientEmail: email,
            inviterName: inviter.name || inviter.email || "Someone",
            memorialName,
            memorialId: memorial.id,
            role,
            token,
            rsvpToken: rsvpToken || undefined, // Pass RSVP token for RSVP link (guest invitations only)
            expiresAt: expiresAt.toISOString(),
            message,
            invitationCard: invitationCard || undefined,
            customSubject: customSubject || undefined,
            qrCodeDataUrl,
          });

          emailSubject = generateInvitationEmailSubject(
            inviter.name || inviter.email || "Someone",
            memorialName,
            customSubject
          );

          // Generate calendar invite if memorial has funeral date (guest invitations only)
          if (memorial.funeralDate) {
            const calendarResult = generateMemorialCalendarInvite(
              {
                id: memorial.id,
                firstName: memorial.firstName,
                lastName: memorial.lastName,
                funeralDate: memorial.funeralDate,
                funeralLocation: memorial.funeralLocation,
                funeralDetails: memorial.funeralDetails,
                biography: memorial.biography,
              },
              {
                email: email,
                name: name || "",
              }
            );

            if (calendarResult.success && calendarResult.icsContent) {
              // Convert ICS content to base64
              const icsBase64 = Buffer.from(calendarResult.icsContent).toString("base64");
              attachments.push({
                name: generateCalendarInviteFilename(memorial),
                content: icsBase64,
              });
            }
          }
        }

        await sendEmail({
          to: email,
          subject: emailSubject,
          html: emailHTML,
          attachments: attachments.length > 0 ? attachments : undefined,
        });

        sentViaEmail = true;
      } catch (error) {
        console.error("Failed to send invitation email:", error);
        deliveryErrors.push("email");
      }
    }

    // Send WhatsApp invitation if requested
    if (sendViaWhatsApp && phone) {
      try {
        const memorialName = `${memorial.firstName} ${memorial.lastName}`;
        let success: boolean;

        if (isCollaboratorInvitation) {
          // Use collaborator WhatsApp template
          success = await sendCollaboratorInvitationWhatsApp({
            recipientName: name || undefined,
            recipientPhone: phone,
            inviterName: inviter.name || inviter.email || "Someone",
            memorialName,
            role,
            token,
            expiresAt: expiresAt.toISOString(),
          });
        } else {
          // Use guest WhatsApp template (with RSVP)
          success = await sendInvitationWhatsApp({
            recipientName: name || "there",
            recipientPhone: phone,
            inviterName: inviter.name || inviter.email || "Someone",
            memorialName,
            role,
            token,
            rsvpToken: rsvpToken || undefined, // Pass RSVP token for RSVP link (guest invitations only)
            expiresAt: expiresAt.toISOString(),
          });
        }

        if (success) {
          sentViaWhatsApp = true;
        } else {
          deliveryErrors.push("whatsapp");
        }
      } catch (error) {
        console.error("Failed to send invitation WhatsApp:", error);
        deliveryErrors.push("whatsapp");
      }
    }

    // If both delivery methods failed, return error
    if (sendViaEmail && !sentViaEmail && sendViaWhatsApp && !sentViaWhatsApp) {
      return NextResponse.json(
        {
          message: "Failed to send invitation via any channel",
          deliveryErrors,
        },
        { status: 500 }
      );
    }

    // Create the invitation in database
    const invitation = await prisma.invitation.create({
      data: {
        email: email || null,
        phone: phone || null,
        name: name || null,
        role: role as "OWNER" | "ADMIN" | "EDITOR" | "CONTRIBUTOR" | "VIEWER",
        token,
        rsvpToken, // RSVP token for guest responses
        status: "PENDING",
        message: message || null,
        invitationCard: invitationCard || null,
        customSubject: customSubject || null,
        memorial: {
          connect: { id: memorialId },
        },
        invitedBy: {
          connect: { id: session.user.id },
        },
        expiresAt,
        sentViaEmail,
        sentViaWhatsApp,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        status: true,
        sentAt: true,
        acceptedAt: true,
        sentViaEmail: true,
        sentViaWhatsApp: true,
        invitedUser: {
          select: {
            name: true,
          },
        },
      },
    });

    // Build success message
    const channels: string[] = [];
    if (sentViaEmail) channels.push("email");
    if (sentViaWhatsApp) channels.push("WhatsApp");

    const successMessage =
      channels.length > 0
        ? `Invitation sent successfully via ${channels.join(" and ")}`
        : "Invitation created";

    return NextResponse.json({
      message: successMessage,
      deliveryErrors: deliveryErrors.length > 0 ? deliveryErrors : undefined,
      data: {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          phone: invitation.phone,
          name: invitation.name || invitation.invitedUser?.name || "Pending",
          status: invitation.status.toLowerCase() as "sent" | "pending" | "delivered",
          rsvp: invitation.acceptedAt ? "yes" : null,
          createdAt: invitation.sentAt.toISOString(),
          updatedAt: invitation.sentAt.toISOString(),
          sentViaEmail: invitation.sentViaEmail,
          sentViaWhatsApp: invitation.sentViaWhatsApp,
        },
      },
    });
  } catch (error) {
    console.error("Invitation creation error:", error);
    return NextResponse.json(
      { message: "Internal server error - Please try again later" },
      { status: 500 }
    );
  }
}
