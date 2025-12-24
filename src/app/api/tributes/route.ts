import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in to access tributes" },
        { status: 401 }
      );
    }

    // Get user's owned memorials
    const userMemorials = await prisma.memorial.findMany({
      where: { ownerId: session.user.id },
      select: { id: true, ownerId: true },
    });

    // Get memorials where user is a collaborator (accepted invitations only)
    // Note: Collaborator invitations have invitedUserId set and rsvpToken is null
    const collaboratorInvitations = await prisma.invitation.findMany({
      where: {
        invitedUserId: session.user.id,
        status: "ACCEPTED",
        expiresAt: { gte: new Date() }, // Not expired yet
      },
      select: {
        memorialId: true,
        memorial: {
          select: { ownerId: true },
        },
      },
    });

    // Combine owned and collaborator memorial IDs
    const memorialIds = [
      ...userMemorials.map((m: { id: string }) => m.id),
      ...collaboratorInvitations.map((inv) => inv.memorialId),
    ];

    // Check subscription - user's own subscription OR memorial owner's subscription (for collaborators)
    // Always include the current user's ID so users with subscription but no memorials can access
    const memorialOwnerIds = [
      session.user.id, // Current user (most important!)
      ...new Set([
        ...userMemorials.map((m) => m.ownerId),
        ...collaboratorInvitations.map((inv) => inv.memorial.ownerId),
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

    // Get tributes (posts with type TRIBUTE) for user's memorials
    const tributes = await prisma.post.findMany({
      where: {
        memorialId: { in: memorialIds },
        type: "TRIBUTE",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        isApproved: true,
        createdAt: true,
        updatedAt: true,
        authorName: true,
        authorEmail: true,
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Tributes retrieved successfully",
      data: {
        tributes: tributes.map((tribute) => ({
          id: tribute.id,
          author: tribute.author?.name || tribute.authorName || "Anonymous",
          email: tribute.author?.email || tribute.authorEmail || "anonymous@example.com",
          message: tribute.content,
          date: tribute.createdAt.toISOString().split("T")[0], // Format as YYYY-MM-DD
          status: tribute.isApproved ? "approved" : "pending",
          createdAt: tribute.createdAt.toISOString(),
          updatedAt: tribute.updatedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Tributes fetch error:", error);
    return NextResponse.json(
      { message: "Internal server error - Please try again later" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in to update tributes" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ message: "Missing required fields: id, status" }, { status: 400 });
    }

    // Verify the tribute (post) exists
    const tribute = await prisma.post.findFirst({
      where: {
        id,
        type: "TRIBUTE",
      },
      include: {
        memorial: {
          select: { id: true, ownerId: true },
        },
      },
    });

    if (!tribute || !tribute.memorial) {
      return NextResponse.json({ message: "Tribute not found" }, { status: 404 });
    }

    // Check if user owns the memorial or is a collaborator with moderate_content permission
    const isOwner = tribute.memorial.ownerId === session.user.id;

    if (!isOwner) {
      // Check if user is a collaborator with appropriate permissions
      const invitation = await prisma.invitation.findFirst({
        where: {
          memorialId: tribute.memorial.id,
          invitedUserId: session.user.id,
          status: "ACCEPTED",
          expiresAt: { gte: new Date() },
          role: { in: ["ADMIN", "EDITOR"] }, // Only ADMIN and EDITOR can moderate tributes
        },
      });

      if (!invitation) {
        return NextResponse.json(
          { message: "You don't have permission to moderate tributes for this memorial" },
          { status: 403 }
        );
      }
    }

    // Map status to isApproved boolean
    const isApproved = status === "approved";

    // Update the tribute status
    const updatedTribute = await prisma.post.update({
      where: { id },
      data: { isApproved },
      select: {
        id: true,
        content: true,
        isApproved: true,
        createdAt: true,
        updatedAt: true,
        authorName: true,
        authorEmail: true,
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Tribute updated successfully",
      data: {
        tribute: {
          id: updatedTribute.id,
          author: updatedTribute.author?.name || updatedTribute.authorName || "Anonymous",
          email:
            updatedTribute.author?.email || updatedTribute.authorEmail || "anonymous@example.com",
          message: updatedTribute.content,
          date: updatedTribute.createdAt.toISOString().split("T")[0],
          status: updatedTribute.isApproved ? "approved" : "pending",
          createdAt: updatedTribute.createdAt.toISOString(),
          updatedAt: updatedTribute.updatedAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Tribute update error:", error);
    return NextResponse.json(
      { message: "Internal server error - Please try again later" },
      { status: 500 }
    );
  }
}
