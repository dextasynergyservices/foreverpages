import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/invitations/accept?token=xxx
 * Fetch invitation details by token (no auth required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ message: "Token is required" }, { status: 400 });
    }

    // Find invitation by token
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        status: true,
        message: true,
        expiresAt: true,
        sentAt: true,
        acceptedAt: true,
        declinedAt: true,
        memorial: {
          select: {
            id: true,
            slug: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            coverPhoto: true,
            birthDate: true,
            deathDate: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ message: "Invitation not found" }, { status: 404 });
    }

    // Check if invitation has expired
    if (new Date() > new Date(invitation.expiresAt)) {
      return NextResponse.json(
        {
          message: "This invitation has expired",
          data: { invitation: { ...invitation, status: "EXPIRED" } },
        },
        { status: 410 }
      );
    }

    // Check if invitation was already accepted
    if (invitation.status === "ACCEPTED") {
      return NextResponse.json(
        {
          message: "This invitation has already been accepted",
          data: { invitation },
        },
        { status: 200 }
      );
    }

    // Check if invitation was declined
    if (invitation.status === "DECLINED") {
      return NextResponse.json(
        {
          message: "This invitation has been declined",
          data: { invitation },
        },
        { status: 200 }
      );
    }

    // Check if invitation was revoked
    if (invitation.status === "REVOKED") {
      return NextResponse.json(
        {
          message: "This invitation has been revoked",
          data: { invitation },
        },
        { status: 410 }
      );
    }

    // Return invitation details
    return NextResponse.json({
      message: "Invitation retrieved successfully",
      data: { invitation },
    });
  } catch (error) {
    console.error("Invitation fetch error:", error);
    return NextResponse.json(
      { message: "Internal server error - Please try again later" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invitations/accept
 * Accept an invitation (no auth required initially)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email, name } = body;

    if (!token) {
      return NextResponse.json({ message: "Token is required" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json(
        { message: "Email is required to accept the invitation" },
        { status: 400 }
      );
    }

    // Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        memorial: {
          select: {
            id: true,
            slug: true,
            firstName: true,
            lastName: true,
            ownerId: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ message: "Invitation not found" }, { status: 404 });
    }

    // Validate invitation
    if (new Date() > new Date(invitation.expiresAt)) {
      return NextResponse.json({ message: "This invitation has expired" }, { status: 410 });
    }

    if (invitation.status === "ACCEPTED") {
      return NextResponse.json(
        { message: "This invitation has already been accepted" },
        { status: 400 }
      );
    }

    if (invitation.status === "DECLINED") {
      return NextResponse.json(
        { message: "This invitation has been declined and cannot be accepted" },
        { status: 400 }
      );
    }

    if (invitation.status === "REVOKED") {
      return NextResponse.json({ message: "This invitation has been revoked" }, { status: 410 });
    }

    // Check if user exists with this email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Update invitation - accept it regardless of whether user has account
    // Collaborators don't need subscriptions; they access via owner's subscription
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        invitedUserId: user?.id || null,
        name: name || invitation.name,
        email: email.toLowerCase(),
      },
    });

    // Determine redirect based on user existence
    // Collaborators can create FREE accounts (no subscription required)
    // They only need to authenticate to access invited memorials
    const redirectUrl = user
      ? `/auth/login?redirect=/user-dashboard&message=invitation_accepted&memorial=${invitation.memorial.slug}`
      : `/auth/signup?email=${encodeURIComponent(email.toLowerCase())}&type=collaborator&memorial=${invitation.memorial.slug}&invitation=${token}`;

    return NextResponse.json({
      message: user
        ? "Invitation accepted! Redirecting to your dashboard..."
        : "Invitation accepted! Please create a free account to access the memorial.",
      data: {
        needsAccount: !user,
        isCollaborator: true, // Flag to indicate this is a collaborator invitation
        email: email.toLowerCase(),
        memorialSlug: invitation.memorial.slug,
        memorialName: `${invitation.memorial.firstName} ${invitation.memorial.lastName}`,
        role: invitation.role,
        redirectUrl,
      },
    });
  } catch (error) {
    console.error("Invitation accept error:", error);
    return NextResponse.json(
      { message: "Internal server error - Please try again later" },
      { status: 500 }
    );
  }
}
