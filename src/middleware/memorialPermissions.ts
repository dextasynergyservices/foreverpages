import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient, MemorialRole } from "@/generated/prisma";
import { getUserMemorialRole, canPerformAction } from "@/lib/permissions";

const prisma = new PrismaClient();

export type MemorialAction =
  | "view"
  | "edit"
  | "delete"
  | "upload_media"
  | "delete_media"
  | "manage_invitations"
  | "manage_collaborators"
  | "manage_settings"
  | "moderate_content"
  | "add_tribute";

/**
 * Middleware to check if user has permission to perform an action on a memorial
 */
export async function checkMemorialPermission(
  memorialId: string,
  action: MemorialAction
): Promise<{
  authorized: boolean;
  user?: { id: string; email: string };
  role?: MemorialRole;
  isOwner?: boolean;
  error?: NextResponse;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return {
        authorized: false,
        error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
      };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true },
    });

    if (!user) {
      return {
        authorized: false,
        error: NextResponse.json({ message: "User not found" }, { status: 404 }),
      };
    }

    // Check if memorial exists
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { id: true, ownerId: true },
    });

    if (!memorial) {
      return {
        authorized: false,
        error: NextResponse.json({ message: "Memorial not found" }, { status: 404 }),
      };
    }

    const isOwner = memorial.ownerId === user.id;

    // Owner always has permission
    if (isOwner) {
      return {
        authorized: true,
        user,
        role: "OWNER" as MemorialRole,
        isOwner: true,
      };
    }

    // Get user's role for this memorial
    const role = await getUserMemorialRole(user.id, memorialId);

    if (!role) {
      return {
        authorized: false,
        error: NextResponse.json(
          { message: "You don't have access to this memorial" },
          { status: 403 }
        ),
      };
    }

    // Check if user can perform the action
    const canPerform = canPerformAction(role, action);

    if (!canPerform) {
      return {
        authorized: false,
        error: NextResponse.json(
          { message: `You don't have permission to ${action.replace("_", " ")}` },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      user,
      role,
      isOwner: false,
    };
  } catch (error) {
    console.error("Error checking memorial permission:", error);
    return {
      authorized: false,
      error: NextResponse.json({ message: "Internal server error" }, { status: 500 }),
    };
  }
}

/**
 * Middleware wrapper for API routes that require memorial permissions
 */
export function withMemorialPermission(
  action: MemorialAction,
  handler: (
    request: Request,
    params: { memorialId: string; [key: string]: string },
    auth: { user: { id: string; email: string }; role: MemorialRole; isOwner: boolean }
  ) => Promise<NextResponse>
) {
  return async (request: Request, { params }: { params: { memorialId: string } }) => {
    const memorialId = params.memorialId;

    const permissionCheck = await checkMemorialPermission(memorialId, action);

    if (!permissionCheck.authorized || !permissionCheck.user || !permissionCheck.role) {
      return (
        permissionCheck.error || NextResponse.json({ message: "Unauthorized" }, { status: 401 })
      );
    }

    return handler(request, params, {
      user: permissionCheck.user,
      role: permissionCheck.role,
      isOwner: permissionCheck.isOwner || false,
    });
  };
}

/**
 * Check if user has minimum required role
 */
export async function checkMinimumRole(
  memorialId: string,
  minimumRole: MemorialRole
): Promise<{
  authorized: boolean;
  user?: { id: string; email: string };
  role?: MemorialRole;
  isOwner?: boolean;
  error?: NextResponse;
}> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return {
        authorized: false,
        error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
      };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true },
    });

    if (!user) {
      return {
        authorized: false,
        error: NextResponse.json({ message: "User not found" }, { status: 404 }),
      };
    }

    // Check if memorial exists
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { id: true, ownerId: true },
    });

    if (!memorial) {
      return {
        authorized: false,
        error: NextResponse.json({ message: "Memorial not found" }, { status: 404 }),
      };
    }

    const isOwner = memorial.ownerId === user.id;

    // Owner always has permission
    if (isOwner) {
      return {
        authorized: true,
        user,
        role: "OWNER" as MemorialRole,
        isOwner: true,
      };
    }

    // Get user's role for this memorial
    const role = await getUserMemorialRole(user.id, memorialId);

    if (!role) {
      return {
        authorized: false,
        error: NextResponse.json(
          { message: "You don't have access to this memorial" },
          { status: 403 }
        ),
      };
    }

    // Define role hierarchy
    const roleHierarchy: Record<MemorialRole, number> = {
      OWNER: 5,
      ADMIN: 4,
      EDITOR: 3,
      CONTRIBUTOR: 2,
      VIEWER: 1,
    };

    const userRoleLevel = roleHierarchy[role] || 0;
    const requiredRoleLevel = roleHierarchy[minimumRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return {
        authorized: false,
        error: NextResponse.json(
          { message: `Requires at least ${minimumRole} role` },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      user,
      role,
      isOwner: false,
    };
  } catch (error) {
    console.error("Error checking minimum role:", error);
    return {
      authorized: false,
      error: NextResponse.json({ message: "Internal server error" }, { status: 500 }),
    };
  }
}
