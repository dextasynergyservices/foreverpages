import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateQRCodeBuffer } from "@/lib/qrCode";

/**
 * GET: Generate and download QR code for an invitation
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if invitation has RSVP token
    if (!invitation.rsvpToken) {
      return NextResponse.json({ error: "Invitation does not have an RSVP link" }, { status: 400 });
    }

    // Generate QR code URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://foreverpages.online";
    const rsvpUrl = `${baseUrl}/rsvp/${invitation.rsvpToken}`;

    // Generate QR code as buffer
    const qrCodeBuffer = await generateQRCodeBuffer(rsvpUrl, { width: 500 });

    // Create filename
    const guestName = invitation.name || "guest";
    const memorialName = `${invitation.memorial.firstName}-${invitation.memorial.lastName}`;
    const filename = `qr-code-${memorialName}-${guestName.replace(/\s+/g, "-")}.png`;

    // Return QR code as downloadable image
    return new NextResponse(new Uint8Array(qrCodeBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}
