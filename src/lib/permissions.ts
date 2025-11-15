import { PrismaClient, MemorialRole } from "@/generated/prisma";

const prisma = new PrismaClient();

/**
 * Get the user's role for a specific memorial
 * Returns OWNER if they own it, or the invitation role if they're a collaborator
 */
export async function getUserMemorialRole(
  userId: string,
  memorialId: string
): Promise<MemorialRole | null> {
  try {
    // Check if user is the owner
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { ownerId: true },
    });

    if (memorial?.ownerId === userId) {
      return "OWNER";
    }

    // Check if user has an accepted invitation
    const invitation = await prisma.invitation.findFirst({
      where: {
        memorialId,
        invitedUserId: userId,
        status: "ACCEPTED",
        expiresAt: { gte: new Date() },
      },
      select: { role: true },
    });

    return invitation?.role || null;
  } catch (error) {
    console.error("Error getting user memorial role:", error);
    return null;
  }
}

/**
 * Check if a user can access a memorial (either as owner or collaborator)
 */
export async function canAccessMemorial(userId: string, memorialId: string): Promise<boolean> {
  const role = await getUserMemorialRole(userId, memorialId);
  return role !== null;
}

/**
 * Check if a user can perform a specific action based on their role
 */
export function canPerformAction(role: MemorialRole, action: string): boolean {
  const permissions: Record<MemorialRole, string[]> = {
    OWNER: [
      "all",
      "view",
      "edit",
      "delete",
      "manage_content",
      "manage_media",
      "upload_media",
      "delete_media",
      "moderate",
      "moderate_content",
      "invite",
      "manage_invitations",
      "manage_collaborators",
      "manage_settings",
      "manage_billing",
      "add_tribute",
    ],
    ADMIN: [
      "view",
      "edit",
      "manage_content",
      "manage_media",
      "upload_media",
      "delete_media",
      "moderate",
      "moderate_content",
      "invite",
      "manage_invitations",
      "manage_collaborators",
      "manage_settings",
      "add_tribute",
    ],
    EDITOR: [
      "view",
      "edit",
      "manage_content",
      "manage_media",
      "upload_media",
      "delete_media",
      "add_tribute",
    ],
    CONTRIBUTOR: ["view", "add_story", "add_photo", "add_comment", "add_tribute", "upload_media"],
    VIEWER: ["view"],
  };

  const rolePermissions = permissions[role] || [];
  return rolePermissions.includes(action) || rolePermissions.includes("all");
}

/**
 * Get all memorials a user can access (owned + invited)
 */
export async function getUserAccessibleMemorials(userId: string) {
  try {
    // Get owned memorials
    const ownedMemorials = await prisma.memorial.findMany({
      where: { ownerId: userId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Get invited memorials
    const invitations = await prisma.invitation.findMany({
      where: {
        invitedUserId: userId,
        status: "ACCEPTED",
        expiresAt: { gte: new Date() },
      },
      include: {
        memorial: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const invitedMemorials = invitations.map((inv) => ({
      ...inv.memorial,
      collaboratorRole: inv.role,
      invitationId: inv.id,
    }));

    return {
      owned: ownedMemorials,
      invited: invitedMemorials,
      all: [...ownedMemorials, ...invitedMemorials],
    };
  } catch (error) {
    console.error("Error getting user accessible memorials:", error);
    return { owned: [], invited: [], all: [] };
  }
}

/**
 * Check if user needs a subscription to access a memorial
 * Collaborators don't need subscriptions - they access via owner's subscription
 */
export async function needsSubscriptionForMemorial(
  userId: string,
  memorialId: string
): Promise<boolean> {
  try {
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { ownerId: true },
    });

    // If user is the owner, they need a subscription
    if (memorial?.ownerId === userId) {
      return true;
    }

    // If user is a collaborator, they don't need a subscription
    const invitation = await prisma.invitation.findFirst({
      where: {
        memorialId,
        invitedUserId: userId,
        status: "ACCEPTED",
        expiresAt: { gte: new Date() },
      },
    });

    return !invitation; // No subscription needed if they have an invitation
  } catch (error) {
    console.error("Error checking subscription requirement:", error);
    return true; // Default to requiring subscription on error
  }
}

/**
 * Get readable permission description for a role
 */
export function getRoleDescription(role: MemorialRole): string {
  const descriptions: Record<MemorialRole, string> = {
    OWNER: "Full control including billing and settings",
    ADMIN: "Can manage content, media, and invite others",
    EDITOR: "Can edit content and manage media",
    CONTRIBUTOR: "Can add stories, photos, and comments",
    VIEWER: "Can view memorial content only",
  };

  return descriptions[role] || "Unknown role";
}

/**
 * Get list of actions a role can perform
 */
export function getRolePermissions(role: MemorialRole): string[] {
  const permissionsList: Record<MemorialRole, string[]> = {
    OWNER: [
      "View memorial",
      "Edit all content",
      "Delete memorial",
      "Manage media and gallery",
      "Moderate comments and tributes",
      "Invite and manage collaborators",
      "Configure settings",
      "Manage billing and subscription",
    ],
    ADMIN: [
      "View memorial",
      "Edit all content",
      "Manage media and gallery",
      "Moderate comments and tributes",
      "Invite and manage collaborators",
      "Configure settings",
    ],
    EDITOR: [
      "View memorial",
      "Edit memorial content",
      "Upload and manage media",
      "Organize gallery",
    ],
    CONTRIBUTOR: [
      "View memorial",
      "Add stories and memories",
      "Upload photos",
      "Write comments and tributes",
    ],
    VIEWER: ["View memorial", "Read stories and tributes"],
  };

  return permissionsList[role] || [];
}
