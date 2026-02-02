import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * POST: Upload media to user's personal library (no memorial required)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      url,
      publicId,
      thumbnailUrl,
      originalName,
      fileSize,
      width,
      height,
      duration,
      format,
      title,
      description,
    } = body;

    // Validate required fields
    if (!type || !url || !publicId || !originalName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user is ADMIN/EDITOR collaborator on any memorial
    const collaboratorInvitation = await prisma.invitation.findFirst({
      where: {
        status: "ACCEPTED",
        role: { in: ["ADMIN", "EDITOR"] },
        OR: [{ invitedUserId: session.user.id }, { email: session.user.email || "" }],
      },
      include: {
        memorial: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    // Determine whose subscription to check: collaborator uses memorial owner's subscription
    const subscriptionUserId = collaboratorInvitation?.memorial.ownerId || session.user.id;

    // Check user's or memorial owner's active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: subscriptionUserId,
        status: "ACTIVE",
      },
      include: {
        plan: {
          select: {
            maxPhotosPerMemorial: true,
            maxVideosPerMemorial: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: "No active subscription found" },
        { status: 403 }
      );
    }

    // Check if subscription owner has reached their plan limits (across all memorials + library)
    const currentCount = await prisma.upload.count({
      where: {
        uploaderId: subscriptionUserId,
        type: type as "IMAGE" | "VIDEO",
      },
    });

    const maxAllowed =
      type === "IMAGE"
        ? subscription.plan.maxPhotosPerMemorial
        : subscription.plan.maxVideosPerMemorial;

    if (currentCount >= maxAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: `You have reached your plan limit of ${maxAllowed} ${type === "IMAGE" ? "images" : "videos"}`,
        },
        { status: 403 }
      );
    }

    // Create upload in user's library (no memorial attached)
    const upload = await prisma.upload.create({
      data: {
        fileName: publicId,
        originalName,
        mimeType: type === "IMAGE" ? `image/${format || "jpg"}` : `video/${format || "mp4"}`,
        fileSize: fileSize || 0,
        url,
        publicId,
        thumbnailUrl: thumbnailUrl || url,
        type: type as "IMAGE" | "VIDEO",
        width,
        height,
        duration,
        title: title || originalName,
        description,
        uploaderId: session.user.id,
        // memorialId is null - uploaded to library
      },
    });

    return NextResponse.json({
      success: true,
      data: upload,
      message: "Media uploaded to your library successfully",
    });
  } catch (error) {
    console.error("Error uploading to library:", error);
    return NextResponse.json({ success: false, error: "Failed to upload media" }, { status: 500 });
  }
}
