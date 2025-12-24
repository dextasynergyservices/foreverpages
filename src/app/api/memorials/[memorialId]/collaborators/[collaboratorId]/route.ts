import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getUserMemorialRole } from "@/lib/permissions";

/**
 * PATCH /api/memorials/[memorialId]/collaborators/[collaboratorId]
 * Update a collaborator's role
 */
export async function PATCH(
  request: Request,
  { params }: { params: { memorialId: string; collaboratorId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const { memorialId, collaboratorId } = params;
    const body = await request.json();
    const { role } = body;

    if (!role || !["ADMIN", "EDITOR", "CONTRIBUTOR", "VIEWER"].includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    // Check if memorial exists and user has permission
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { id: true, ownerId: true },
    });

    if (!memorial) {
      return NextResponse.json({ message: "Memorial not found" }, { status: 404 });
    }

    // Only owner and admins can update roles
    const userRole = await getUserMemorialRole(user.id, memorialId);
    const isOwner = memorial.ownerId === user.id;

    if (!isOwner && userRole !== "ADMIN") {
      return NextResponse.json(
        { message: "You don't have permission to update roles" },
        { status: 403 }
      );
    }

    // Update the invitation role
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: collaboratorId,
        memorialId,
      },
    });

    if (!invitation) {
      return NextResponse.json({ message: "Collaborator not found" }, { status: 404 });
    }

    // Prevent changing owner's role
    if (invitation.email === session.user.email) {
      return NextResponse.json({ message: "Cannot change your own role" }, { status: 400 });
    }

    await prisma.invitation.update({
      where: { id: collaboratorId },
      data: { role },
    });

    return NextResponse.json({
      success: true,
      message: "Role updated successfully",
    });
  } catch (error) {
    console.error("Error updating collaborator role:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/memorials/[memorialId]/collaborators/[collaboratorId]
 * Remove a collaborator
 */
export async function DELETE(
  request: Request,
  { params }: { params: { memorialId: string; collaboratorId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const { memorialId, collaboratorId } = params;

    // Check if memorial exists and user has permission
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { id: true, ownerId: true },
    });

    if (!memorial) {
      return NextResponse.json({ message: "Memorial not found" }, { status: 404 });
    }

    // Only owner and admins can remove collaborators
    const userRole = await getUserMemorialRole(user.id, memorialId);
    const isOwner = memorial.ownerId === user.id;

    if (!isOwner && userRole !== "ADMIN") {
      return NextResponse.json(
        { message: "You don't have permission to remove collaborators" },
        { status: 403 }
      );
    }

    // Check if the invitation exists
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: collaboratorId,
        memorialId,
      },
    });

    if (!invitation) {
      return NextResponse.json({ message: "Collaborator not found" }, { status: 404 });
    }

    // Prevent removing yourself
    if (invitation.email === session.user.email) {
      return NextResponse.json({ message: "Cannot remove yourself" }, { status: 400 });
    }

    // Delete the invitation
    await prisma.invitation.delete({
      where: { id: collaboratorId },
    });

    return NextResponse.json({
      success: true,
      message: "Collaborator removed successfully",
    });
  } catch (error) {
    console.error("Error removing collaborator:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
