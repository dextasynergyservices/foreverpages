import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

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

    // Get user's memorials first
    const userMemorials = await prisma.memorial.findMany({
      where: { ownerId: session.user.id },
      select: { id: true },
    });

    const memorialIds = userMemorials.map((m: { id: string }) => m.id);

    // Get invitations for user's memorials
    const invitations = await prisma.invitation.findMany({
      where: {
        memorialId: { in: memorialIds },
      },
      orderBy: { sentAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        message: true,
        sentAt: true,
        acceptedAt: true,
        declinedAt: true,
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
          name: inv.invitedUser?.name || "Pending",
          status: inv.status.toLowerCase() as "sent" | "pending" | "delivered",
          rsvp: inv.acceptedAt ? "yes" : inv.declinedAt ? "no" : null,
          createdAt: inv.sentAt.toISOString(),
          updatedAt: (inv.acceptedAt || inv.declinedAt || inv.sentAt).toISOString(),
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
    const { email, memorialId, role = "VIEWER" } = body;

    if (!email || !memorialId) {
      return NextResponse.json(
        { message: "Missing required fields: email, memorialId" },
        { status: 400 }
      );
    }

    // Verify the memorial belongs to the user
    const memorial = await prisma.memorial.findFirst({
      where: {
        id: memorialId,
        ownerId: session.user.id,
      },
    });

    if (!memorial) {
      return NextResponse.json({ message: "Memorial not found or access denied" }, { status: 404 });
    }

    // Generate a unique token
    const token = `inv_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create the invitation
    const invitation = await prisma.invitation.create({
      data: {
        email,
        role: role as "OWNER" | "ADMIN" | "EDITOR" | "CONTRIBUTOR" | "VIEWER",
        token,
        status: "PENDING",
        memorialId,
        invitedById: session.user.id,
        expiresAt,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        sentAt: true,
        acceptedAt: true,
        invitedUser: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Invitation created successfully",
      data: {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          name: invitation.invitedUser?.name || "Pending",
          status: invitation.status.toLowerCase() as "sent" | "pending" | "delivered",
          rsvp: invitation.acceptedAt ? "yes" : null,
          createdAt: invitation.sentAt.toISOString(),
          updatedAt: invitation.sentAt.toISOString(),
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
