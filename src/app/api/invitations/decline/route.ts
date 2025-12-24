import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/invitations/decline
 * Decline an invitation (no auth required)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, reason } = body;

    if (!token) {
      return NextResponse.json({ message: "Token is required" }, { status: 400 });
    }

    // Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        memorial: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ message: "Invitation not found" }, { status: 404 });
    }

    // Validate invitation
    if (invitation.status === "DECLINED") {
      return NextResponse.json(
        { message: "This invitation has already been declined" },
        { status: 400 }
      );
    }

    if (invitation.status === "ACCEPTED") {
      return NextResponse.json(
        { message: "This invitation has already been accepted and cannot be declined" },
        { status: 400 }
      );
    }

    if (invitation.status === "REVOKED") {
      return NextResponse.json({ message: "This invitation has been revoked" }, { status: 410 });
    }

    // Update invitation
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "DECLINED",
        declinedAt: new Date(),
        message: reason || invitation.message, // Optionally store decline reason
      },
    });

    return NextResponse.json({
      message: "Invitation declined successfully",
      data: {
        memorialName: `${invitation.memorial.firstName} ${invitation.memorial.lastName}`,
      },
    });
  } catch (error) {
    console.error("Invitation decline error:", error);
    return NextResponse.json(
      { message: "Internal server error - Please try again later" },
      { status: 500 }
    );
  }
}
