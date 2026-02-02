import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import log from "@/lib/logger";

/**
 * GET: Fetch all user's media uploads across all memorials with plan limits
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "IMAGE" | "VIDEO" | null;
    const search = searchParams.get("search");
    const album = searchParams.get("album");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get memorials where user is a collaborator (accepted invitations only)
    // Check both invitedUserId and email since invitations are sent by email
    const collaboratorInvitations = await prisma.invitation.findMany({
      where: {
        status: "ACCEPTED",
        role: { in: ["ADMIN", "EDITOR", "CONTRIBUTOR", "VIEWER"] }, // All collaborator roles
        OR: [{ invitedUserId: session.user.id }, { email: session.user.email || "" }],
      },
      select: {
        memorialId: true,
        role: true,
        memorial: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    const collaboratorMemorialIds = collaboratorInvitations.map((inv) => inv.memorialId);
    const memorialOwnerIds = collaboratorInvitations.map((inv) => inv.memorial.ownerId);

    log.info("🎨 DEBUG - Media API Query:", {
      userId: session.user.id,
      collaboratorCount: collaboratorInvitations.length,
      collaboratorMemorialIds,
      memorialOwnerIds,
      collaboratorDetails: collaboratorInvitations.map((inv) => ({
        memorialId: inv.memorialId,
        role: inv.role,
        ownerId: inv.memorial.ownerId,
      })),
    });

    // Get user's subscription OR the owner's subscription if user is a collaborator
    let subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
      include: {
        plan: {
          select: {
            name: true,
            maxPhotosPerMemorial: true,
            maxVideosPerMemorial: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // If user doesn't have a subscription, try to get subscription from memorial owner
    if (!subscription && memorialOwnerIds.length > 0) {
      subscription = await prisma.subscription.findFirst({
        where: {
          userId: { in: memorialOwnerIds },
          status: "ACTIVE",
        },
        include: {
          plan: {
            select: {
              name: true,
              maxPhotosPerMemorial: true,
              maxVideosPerMemorial: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: "No active subscription found" },
        { status: 403 }
      );
    }

    // Build where clause for uploads - include library, owned, and collaborator memorials
    const where: Record<string, unknown> = {
      OR: [
        // Library uploads (no memorial) - user's own library
        { uploaderId: session.user.id, memorial: null },
        // Memorial uploads (user owns the memorial)
        { memorial: { ownerId: session.user.id } },
        // Memorial uploads (user is a collaborator)
        ...(collaboratorMemorialIds.length > 0
          ? [{ memorialId: { in: collaboratorMemorialIds } }]
          : []),
        // Library uploads from memorial owners (for collaborators to access owner's media pool)
        ...(memorialOwnerIds.length > 0
          ? [{ uploaderId: { in: memorialOwnerIds }, memorialId: null }]
          : []),
      ],
    };

    if (type) {
      where.type = type;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { originalName: { contains: search, mode: "insensitive" } },
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    if (album) {
      where.album = album;
    }

    // Get total count
    const totalCount = await prisma.upload.count({ where });

    log.info("🎨 DEBUG - Media Query WHERE clause:", JSON.stringify(where, null, 2));
    log.info("🎨 DEBUG - Total media count found:", totalCount);

    // Debug: Check if media exists for this memorial at all
    if (totalCount === 0 && collaboratorMemorialIds.length > 0) {
      const memorialMediaCheck = await prisma.upload.count({
        where: { memorialId: { in: collaboratorMemorialIds } },
      });
      const ownerMediaCheck = await prisma.upload.count({
        where: { memorial: { ownerId: { in: memorialOwnerIds } } },
      });
      const ownerLibraryCheck = await prisma.upload.count({
        where: { uploaderId: { in: memorialOwnerIds }, memorialId: null },
      });
      const allOwnerMedia = await prisma.upload.count({
        where: { uploaderId: { in: memorialOwnerIds } },
      });
      log.info("🔍 DEBUG - Media exists check:", {
        mediaInCollaboratorMemorials: memorialMediaCheck,
        mediaInOwnerMemorials: ownerMediaCheck,
        mediaInOwnerLibrary: ownerLibraryCheck,
        allMediaUploadedByOwner: allOwnerMedia,
        collaboratorMemorialIds,
        memorialOwnerIds,
      });
    }

    // Fetch paginated uploads for this user
    const uploads = await prisma.upload.findMany({
      where,
      include: {
        memorial: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    log.info("🎨 DEBUG - Media found:", {
      count: uploads.length,
      memorialIds: [...new Set(uploads.map((u) => u.memorialId).filter(Boolean))],
      uploaders: [...new Set(uploads.map((u) => u.uploaderId))],
    });

    // Count totals by type - include library, owned, collaborator memorials, and owner's library
    const imageCount = await prisma.upload.count({
      where: {
        OR: [
          { uploaderId: session.user.id, memorial: null, type: "IMAGE" as const },
          { memorial: { ownerId: session.user.id }, type: "IMAGE" as const },
          ...(collaboratorMemorialIds.length > 0
            ? [{ memorialId: { in: collaboratorMemorialIds }, type: "IMAGE" as const }]
            : []),
          ...(memorialOwnerIds.length > 0
            ? [{ uploaderId: { in: memorialOwnerIds }, memorialId: null, type: "IMAGE" as const }]
            : []),
        ],
      },
    });

    const videoCount = await prisma.upload.count({
      where: {
        OR: [
          { uploaderId: session.user.id, memorial: null, type: "VIDEO" as const },
          { memorial: { ownerId: session.user.id }, type: "VIDEO" as const },
          ...(collaboratorMemorialIds.length > 0
            ? [{ memorialId: { in: collaboratorMemorialIds }, type: "VIDEO" as const }]
            : []),
          ...(memorialOwnerIds.length > 0
            ? [{ uploaderId: { in: memorialOwnerIds }, memorialId: null, type: "VIDEO" as const }]
            : []),
        ],
      },
    });

    // Get unique albums for filtering - include library, owned, collaborator memorials, and owner's library
    const albums = await prisma.upload.findMany({
      where: {
        OR: [
          { uploaderId: session.user.id, memorial: null, album: { not: null } },
          { memorial: { ownerId: session.user.id }, album: { not: null } },
          ...(collaboratorMemorialIds.length > 0
            ? [{ memorialId: { in: collaboratorMemorialIds }, album: { not: null } }]
            : []),
          ...(memorialOwnerIds.length > 0
            ? [
                {
                  uploaderId: { in: memorialOwnerIds },
                  memorialId: null,
                  album: { not: null },
                },
              ]
            : []),
        ],
      },
      select: { album: true },
      distinct: ["album"],
    });

    // Transform uploads to add computed name field for memorial
    const transformedUploads = uploads.map((upload) => ({
      ...upload,
      memorial: upload.memorial
        ? {
            id: upload.memorial.id,
            name: `${upload.memorial.firstName} ${upload.memorial.lastName}`,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        uploads: transformedUploads,
        plan: {
          name: subscription.plan.name,
          limits: {
            images: {
              used: imageCount,
              max: subscription.plan.maxPhotosPerMemorial,
              remaining: subscription.plan.maxPhotosPerMemorial - imageCount,
              percentage: Math.round((imageCount / subscription.plan.maxPhotosPerMemorial) * 100),
            },
            videos: {
              used: videoCount,
              max: subscription.plan.maxVideosPerMemorial,
              remaining: subscription.plan.maxVideosPerMemorial - videoCount,
              percentage: Math.round((videoCount / subscription.plan.maxVideosPerMemorial) * 100),
            },
          },
        },
        albums: albums.map((a) => a.album).filter(Boolean),
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: page < Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    log.error("Error fetching user media:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch media" }, { status: 500 });
  }
}
