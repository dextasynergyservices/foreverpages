import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { deleteFromCloudinary, extractPublicId } from "@/lib/cloudinary";

interface RouteContext {
  params: {
    memorialId: string;
    uploadId: string;
  };
}

/**
 * DELETE: Remove media item
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { memorialId, uploadId } = params;

    // Check permissions using middleware
    const { checkMemorialPermission } = await import("@/middleware/memorialPermissions");
    const permissionCheck = await checkMemorialPermission(memorialId, "delete_media");

    // Find the upload
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
      select: {
        id: true,
        uploaderId: true,
        url: true,
        fileName: true,
        type: true,
        memorial: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!upload) {
      return NextResponse.json({ success: false, error: "Upload not found" }, { status: 404 });
    }

    // Allow if user has delete_media permission OR is the uploader
    const isUploader = upload.uploaderId === session.user.id;

    if (!permissionCheck.authorized && !isUploader) {
      return NextResponse.json(
        { success: false, error: "You do not have permission to delete this media" },
        { status: 403 }
      );
    }

    // Delete from Cloudinary
    const publicId = extractPublicId(upload.url) || upload.fileName;
    const resourceType = upload.type === "VIDEO" ? "video" : "image";

    try {
      await deleteFromCloudinary(publicId, resourceType);
    } catch (cloudinaryError) {
      console.warn("Cloudinary delete failed, continuing with DB deletion:", cloudinaryError);
    }

    // Delete from database
    await prisma.upload.delete({
      where: { id: uploadId },
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

/**
 * PATCH: Update media metadata
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { uploadId } = params;
    const body = await request.json();
    const { title, description, caption, album, tags, isPublic } = body;

    // Find the upload
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
      select: {
        id: true,
        uploaderId: true,
        title: true,
        description: true,
        caption: true,
        album: true,
        tags: true,
        isPublic: true,
        memorial: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!upload) {
      return NextResponse.json({ success: false, error: "Upload not found" }, { status: 404 });
    }

    // Check permissions - owner can be either memorial owner or uploader (for library items)
    const isMemorialOwner = upload.memorial?.ownerId === session.user.id;
    const isUploader = upload.uploaderId === session.user.id;

    // Check if user is ADMIN/EDITOR collaborator on memorial owned by uploader
    const isCollaborator = await prisma.invitation.findFirst({
      where: {
        status: "ACCEPTED",
        role: { in: ["ADMIN", "EDITOR"] },
        OR: [{ invitedUserId: session.user.id }, { email: session.user.email || "" }],
        memorial: {
          ownerId: upload.uploaderId,
        },
      },
    });

    if (!isMemorialOwner && !isUploader && !isCollaborator) {
      return NextResponse.json(
        { success: false, error: "You do not have permission to update this media" },
        { status: 403 }
      );
    }

    // Update upload
    const updated = await prisma.upload.update({
      where: { id: uploadId },
      data: {
        title: title !== undefined ? title : upload.title,
        description: description !== undefined ? description : upload.description,
        caption: caption !== undefined ? caption : upload.caption,
        album: album !== undefined ? album : upload.album,
        tags: tags !== undefined ? tags : upload.tags,
        isPublic: isPublic !== undefined ? isPublic : upload.isPublic,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating media:", error);
    return NextResponse.json({ success: false, error: "Failed to update media" }, { status: 500 });
  }
}
