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
    // Check both invitedUserId and email since invitations are sent by email
    const collaboratorInvitations = await prisma.invitation.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ invitedUserId: session.user.id }, { email: session.user.email || "" }],
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
        title: true,
        images: true,
        videos: true,
        attachments: true,
        memorial: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Get condolences (posts with type CONDOLENCE) for user's memorials
    const condolences = await prisma.post.findMany({
      where: {
        memorialId: { in: memorialIds },
        type: "CONDOLENCE",
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
        title: true,
        images: true,
        videos: true,
        attachments: true,
        memorial: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Helper to format post data
    const formatPost = (post: (typeof tributes)[0]) => ({
      id: post.id,
      author: post.author?.name || post.authorName || "Anonymous",
      email: post.author?.email || post.authorEmail || "anonymous@example.com",
      message: post.content,
      relationship: post.title || "Friend",
      date: post.createdAt.toISOString().split("T")[0],
      status: post.isApproved ? "approved" : "pending",
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      memorialId: post.memorial?.id,
      memorialName: post.memorial
        ? `${post.memorial.firstName} ${post.memorial.lastName}`.trim()
        : "Unknown",
      images: post.images || [],
      videos: post.videos || [],
      attachments: post.attachments || [],
    });

    return NextResponse.json({
      message: "Tributes and condolences retrieved successfully",
      data: {
        tributes: tributes.map(formatPost),
        condolences: condolences.map(formatPost),
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

    // Verify the tribute/condolence (post) exists
    const tribute = await prisma.post.findFirst({
      where: {
        id,
        type: { in: ["TRIBUTE", "CONDOLENCE"] },
      },
      include: {
        memorial: {
          select: { id: true, ownerId: true },
        },
      },
    });

    if (!tribute || !tribute.memorial) {
      return NextResponse.json({ message: "Tribute or condolence not found" }, { status: 404 });
    }

    // Check if user owns the memorial or is a collaborator with moderate_content permission
    const isOwner = tribute.memorial.ownerId === session.user.id;

    if (!isOwner) {
      // Check if user is a collaborator with appropriate permissions
      const invitation = await prisma.invitation.findFirst({
        where: {
          memorialId: tribute.memorial.id,
          status: "ACCEPTED",
          role: { in: ["ADMIN", "EDITOR"] }, // Only ADMIN and EDITOR can moderate tributes
          OR: [{ invitedUserId: session.user.id }, { email: session.user.email || "" }],
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
