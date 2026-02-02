import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const familyMemberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  relationship: z.enum([
    "SPOUSE",
    "PARTNER",
    "FATHER",
    "MOTHER",
    "SON",
    "DAUGHTER",
    "BROTHER",
    "SISTER",
    "GRANDFATHER",
    "GRANDMOTHER",
    "GRANDSON",
    "GRANDDAUGHTER",
    "UNCLE",
    "AUNT",
    "NEPHEW",
    "NIECE",
    "COUSIN",
    "OTHER",
  ]),
  isDeceased: z.boolean().optional().default(false),
  birthYear: z.number().int().min(1800).max(2100).optional().nullable(),
  deathYear: z.number().int().min(1800).max(2100).optional().nullable(),
  photo: z.string().url().optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
});

const createFamilyMemberSchema = familyMemberSchema;
const updateFamilyMemberSchema = familyMemberSchema.partial();

/**
 * GET: Fetch all family members for a memorial
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug: memorialId } = await params;

    // Verify memorial exists and is accessible
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: {
        id: true,
        ownerId: true,
        visibility: true,
      },
    });

    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    // For private memorials, verify access
    if (memorial.visibility === "PRIVATE") {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Check if user is owner or has access via invitation
      if (memorial.ownerId !== session.user.id) {
        const hasAccess = await prisma.invitation.findFirst({
          where: {
            memorialId,
            invitedUserId: session.user.id,
            status: "ACCEPTED",
          },
        });

        if (!hasAccess) {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
      }
    }

    // Fetch family members
    const familyMembers = await prisma.familyMember.findMany({
      where: { memorialId },
      orderBy: [{ relationship: "asc" }, { firstName: "asc" }],
    });

    return NextResponse.json({
      success: true,
      data: familyMembers,
    });
  } catch (error) {
    console.error("Error fetching family members:", error);
    return NextResponse.json({ error: "Failed to fetch family members" }, { status: 500 });
  }
}

/**
 * POST: Create a new family member
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: memorialId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify memorial exists and user has edit access
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { ownerId: true },
    });

    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    // Check ownership or admin collaborator status
    if (memorial.ownerId !== session.user.id) {
      const isAdmin = await prisma.invitation.findFirst({
        where: {
          memorialId,
          invitedUserId: session.user.id,
          status: "ACCEPTED",
          role: "ADMIN",
        },
      });

      if (!isAdmin) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const body = await request.json();
    const validatedData = createFamilyMemberSchema.parse(body);

    const familyMember = await prisma.familyMember.create({
      data: {
        ...validatedData,
        memorialId,
      },
    });

    return NextResponse.json({
      success: true,
      data: familyMember,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating family member:", error);
    return NextResponse.json({ error: "Failed to create family member" }, { status: 500 });
  }
}

/**
 * PATCH: Update a family member
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: memorialId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    // Verify memorial exists and user has edit access
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { ownerId: true },
    });

    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    // Check ownership or admin collaborator status
    if (memorial.ownerId !== session.user.id) {
      const isAdmin = await prisma.invitation.findFirst({
        where: {
          memorialId,
          invitedUserId: session.user.id,
          status: "ACCEPTED",
          role: "ADMIN",
        },
      });

      if (!isAdmin) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const body = await request.json();
    const validatedData = updateFamilyMemberSchema.parse(body);

    const familyMember = await prisma.familyMember.update({
      where: { id: memberId, memorialId },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: familyMember,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating family member:", error);
    return NextResponse.json({ error: "Failed to update family member" }, { status: 500 });
  }
}

/**
 * DELETE: Remove a family member
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: memorialId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    // Verify memorial exists and user has edit access
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { ownerId: true },
    });

    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    // Check ownership or admin collaborator status
    if (memorial.ownerId !== session.user.id) {
      const isAdmin = await prisma.invitation.findFirst({
        where: {
          memorialId,
          invitedUserId: session.user.id,
          status: "ACCEPTED",
          role: "ADMIN",
        },
      });

      if (!isAdmin) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    await prisma.familyMember.delete({
      where: { id: memberId, memorialId },
    });

    return NextResponse.json({
      success: true,
      message: "Family member deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting family member:", error);
    return NextResponse.json({ error: "Failed to delete family member" }, { status: 500 });
  }
}
