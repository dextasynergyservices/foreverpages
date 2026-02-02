import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * PATCH: Update media item (e.g., after editing)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { url, publicId, thumbnailUrl } = body;

    // Find the media item and verify ownership
    const media = await prisma.upload.findUnique({
      where: { id },
      select: {
        id: true,
        uploaderId: true,
      },
    });

    if (!media) {
      return NextResponse.json({ success: false, error: "Media not found" }, { status: 404 });
    }

    // Check if user is the uploader
    if (media.uploaderId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // Update the media record
    const updatedMedia = await prisma.upload.update({
      where: { id },
      data: {
        url,
        publicId,
        thumbnailUrl,
      },
    });

    return NextResponse.json({
      success: true,
      media: updatedMedia,
    });
  } catch (error) {
    console.error("Error updating media:", error);
    return NextResponse.json({ success: false, error: "Failed to update media" }, { status: 500 });
  }
}

/**
 * DELETE: Remove media from user's library
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find the media item and verify ownership or collaborator access
    const media = await prisma.upload.findUnique({
      where: { id },
      select: {
        id: true,
        publicId: true,
        uploaderId: true,
      },
    });

    if (!media) {
      return NextResponse.json({ success: false, error: "Media not found" }, { status: 404 });
    }

    // Check if user is the uploader
    const isUploader = media.uploaderId === session.user.id;

    // Check if user is a collaborator with permission to manage media
    let isCollaborator = false;
    if (!isUploader) {
      const collaboratorInvitation = await prisma.invitation.findFirst({
        where: {
          status: "ACCEPTED",
          role: { in: ["ADMIN", "EDITOR"] }, // Only ADMIN and EDITOR can delete media
          OR: [{ invitedUserId: session.user.id }, { email: session.user.email || "" }],
          memorial: {
            ownerId: media.uploaderId, // Check if collaborator is on a memorial owned by the uploader
          },
        },
      });
      isCollaborator = !!collaboratorInvitation;
    }

    if (!isUploader && !isCollaborator) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // Delete from Cloudinary if publicId exists
    if (media.publicId) {
      try {
        await cloudinary.uploader.destroy(media.publicId);
      } catch (cloudinaryError) {
        console.error("Cloudinary deletion error:", cloudinaryError);
        // Continue with database deletion even if Cloudinary fails
      }
    }

    // Delete from database
    await prisma.upload.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting media:", error);
    return NextResponse.json({ success: false, error: "Failed to delete media" }, { status: 500 });
  }
}
