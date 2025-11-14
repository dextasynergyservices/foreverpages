import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { isValidRSVPTokenFormat, isRSVPTokenExpired } from "@/lib/rsvpTokens";
import { sendEmail } from "@/lib/email";
import {
  generateRSVPNotificationEmail,
  generateRSVPNotificationSubject,
} from "@/lib/emailTemplates/rsvpNotification";

const prisma = new PrismaClient();

/**
 * GET /api/invitations/rsvp?token=xxx
 * Fetch invitation and memorial details by RSVP token
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ message: "RSVP token is required" }, { status: 400 });
    }

    // Validate token format
    if (!isValidRSVPTokenFormat(token)) {
      return NextResponse.json({ message: "Invalid RSVP token format" }, { status: 400 });
    }

    // Find invitation by RSVP token
    const invitation = await prisma.invitation.findUnique({
      where: { rsvpToken: token },
      include: {
        memorial: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthDate: true,
            deathDate: true,
            biography: true,
            profilePhoto: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ message: "Invitation not found" }, { status: 404 });
    }

    // Check if token is expired
    if (invitation.expiresAt && isRSVPTokenExpired(invitation.expiresAt)) {
      return NextResponse.json({ message: "This RSVP link has expired" }, { status: 410 });
    }

    return NextResponse.json({
      message: "Invitation retrieved successfully",
      invitation: {
        id: invitation.id,
        name: invitation.name,
        email: invitation.email,
        phone: invitation.phone,
        rsvpStatus: invitation.rsvpStatus,
        rsvpMessage: invitation.rsvpMessage,
        rsvpAt: invitation.rsvpAt?.toISOString(),
        expiresAt: invitation.expiresAt?.toISOString(),
      },
      memorial: invitation.memorial,
    });
  } catch (error) {
    console.error("RSVP GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/invitations/rsvp
 * Submit or update RSVP response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, rsvpStatus, rsvpMessage, plusOnes, dietaryRestrictions, accessibilityNeeds } =
      body;

    // Validate required fields
    if (!token) {
      return NextResponse.json({ message: "RSVP token is required" }, { status: 400 });
    }

    if (!rsvpStatus) {
      return NextResponse.json({ message: "RSVP status is required" }, { status: 400 });
    }

    // Validate RSVP status
    const validStatuses = ["ATTENDING", "NOT_ATTENDING", "MAYBE"];
    if (!validStatuses.includes(rsvpStatus)) {
      return NextResponse.json({ message: "Invalid RSVP status" }, { status: 400 });
    }

    // Validate token format
    if (!isValidRSVPTokenFormat(token)) {
      return NextResponse.json({ message: "Invalid RSVP token format" }, { status: 400 });
    }

    // Find invitation by RSVP token
    const invitation = await prisma.invitation.findUnique({
      where: { rsvpToken: token },
      include: {
        memorial: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            ownerId: true,
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
      return NextResponse.json({ message: "Invitation not found" }, { status: 404 });
    }

    // Check if token is expired
    if (invitation.expiresAt && isRSVPTokenExpired(invitation.expiresAt)) {
      return NextResponse.json({ message: "This RSVP link has expired" }, { status: 410 });
    }

    // Determine invitation status based on RSVP
    const invitationStatus =
      rsvpStatus === "ATTENDING"
        ? "ACCEPTED"
        : rsvpStatus === "NOT_ATTENDING"
          ? "DECLINED"
          : "PENDING"; // MAYBE keeps it as PENDING

    // Update invitation with RSVP response
    const updatedInvitation = await prisma.invitation.update({
      where: { rsvpToken: token },
      data: {
        status: invitationStatus as "ACCEPTED" | "DECLINED" | "PENDING",
        rsvpStatus: rsvpStatus as "ATTENDING" | "NOT_ATTENDING" | "MAYBE",
        rsvpMessage: rsvpMessage || null,
        rsvpAt: new Date(),
        acceptedAt: rsvpStatus === "ATTENDING" ? new Date() : null,
        declinedAt: rsvpStatus === "NOT_ATTENDING" ? new Date() : null,
        plusOnes: plusOnes || null,
        dietaryRestrictions: dietaryRestrictions || null,
        accessibilityNeeds: accessibilityNeeds || null,
      },
    });

    // Send email notification to organizer
    try {
      const organizerEmail = invitation.invitedBy?.email;
      const organizerName = invitation.invitedBy?.name || "Organizer";
      const memorialName = `${invitation.memorial.firstName} ${invitation.memorial.lastName}`;

      if (organizerEmail) {
        const emailHTML = generateRSVPNotificationEmail({
          organizerName,
          organizerEmail,
          guestName: invitation.name || invitation.email || "A guest",
          guestEmail: invitation.email || undefined,
          guestPhone: invitation.phone || undefined,
          rsvpStatus: rsvpStatus as "ATTENDING" | "NOT_ATTENDING" | "MAYBE",
          rsvpMessage: rsvpMessage || undefined,
          plusOnes: plusOnes || undefined,
          dietaryRestrictions: dietaryRestrictions || undefined,
          accessibilityNeeds: accessibilityNeeds || undefined,
          memorialName,
          memorialId: invitation.memorial.id,
        });

        const emailSubject = generateRSVPNotificationSubject(
          invitation.name || invitation.email || "A guest",
          memorialName
        );

        await sendEmail({
          to: organizerEmail,
          subject: emailSubject,
          html: emailHTML,
        });
      }
    } catch (emailError) {
      // Log error but don't fail the RSVP submission
      console.error("Failed to send organizer notification email:", emailError);
    }

    return NextResponse.json({
      message: "RSVP submitted successfully",
      data: {
        rsvpStatus: updatedInvitation.rsvpStatus,
        rsvpMessage: updatedInvitation.rsvpMessage,
        rsvpAt: updatedInvitation.rsvpAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error("RSVP POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
