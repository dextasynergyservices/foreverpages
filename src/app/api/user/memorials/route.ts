import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fetch all memorials owned by the user
    const ownedMemorials = await prisma.memorial.findMany({
      where: {
        ownerId: session.user.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        deathDate: true,
        profilePhoto: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get user's email for invitation lookup
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    // Fetch memorials where user is a collaborator
    // Note: Check both invitedUserId and email since invitations are sent by email
    // expiresAt check removed for ACCEPTED - once accepted, access is permanent
    const collaboratorInvitations = await prisma.invitation.findMany({
      where: {
        status: "ACCEPTED",
        role: {
          in: ["ADMIN", "EDITOR", "CONTRIBUTOR"],
        },
        OR: [{ invitedUserId: session.user.id }, { email: user?.email || "" }],
      },
      include: {
        memorial: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthDate: true,
            deathDate: true,
            profilePhoto: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        acceptedAt: "desc",
      },
    });

    const ownedMemorialsFormatted = ownedMemorials.map((memorial) => ({
      id: memorial.id,
      name: `${memorial.firstName} ${memorial.lastName}`,
      firstName: memorial.firstName,
      lastName: memorial.lastName,
      birthDate: memorial.birthDate.toISOString(),
      deathDate: memorial.deathDate.toISOString(),
      profileImage: memorial.profilePhoto,
      createdAt: memorial.createdAt.toISOString(),
    }));

    const collaboratorMemorialsFormatted = collaboratorInvitations.map((inv) => ({
      id: inv.memorial.id,
      name: `${inv.memorial.firstName} ${inv.memorial.lastName}`,
      firstName: inv.memorial.firstName,
      lastName: inv.memorial.lastName,
      birthDate: inv.memorial.birthDate.toISOString(),
      deathDate: inv.memorial.deathDate.toISOString(),
      profileImage: inv.memorial.profilePhoto,
      createdAt: inv.memorial.createdAt.toISOString(),
      role: inv.role,
    }));

    // Combine both owned and collaborator memorials
    const allMemorials = [...ownedMemorialsFormatted, ...collaboratorMemorialsFormatted];

    return NextResponse.json({
      message: "Memorials retrieved successfully",
      data: {
        memorials: allMemorials,
      },
      // Keep old structure for backward compatibility
      ownedMemorials: ownedMemorialsFormatted,
      collaboratorMemorials: collaboratorMemorialsFormatted,
    });
  } catch (error) {
    console.error("Error fetching memorials:", error);
    return NextResponse.json({ message: "Failed to fetch memorials" }, { status: 500 });
  }
}
