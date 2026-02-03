import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in to access gallery" },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const memorialId = searchParams.get("memorialId");
    const type = searchParams.get("type"); // IMAGE, VIDEO, AUDIO, DOCUMENT
    const album = searchParams.get("album");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Build the where clause
    const where: {
      uploaderId: string;
      memorialId?: string | null;
      type?: string;
      album?: string;
    } = {
      uploaderId: session.user.id,
    };

    // Filter by memorial if specified
    if (memorialId) {
      where.memorialId = memorialId;
    }

    // Filter by type if specified
    if (type && ["IMAGE", "VIDEO", "AUDIO", "DOCUMENT"].includes(type.toUpperCase())) {
      where.type = type.toUpperCase();
    }

    // Filter by album if specified
    if (album) {
      where.album = album;
    }

    // Get total count for pagination
    const totalCount = await prisma.upload.count({ where });

    // Get media from the Upload table
    const uploads = await prisma.upload.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip,
      take: limit,
      include: {
        memorial: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            slug: true,
          },
        },
      },
    });

    // Transform to gallery format
    const media = uploads.map((upload) => ({
      id: upload.id,
      url: upload.url,
      thumbnailUrl: upload.thumbnailUrl,
      title: upload.title || upload.originalName,
      description: upload.description,
      caption: upload.caption,
      type: upload.type.toLowerCase(),
      mimeType: upload.mimeType,
      fileSize: upload.fileSize,
      width: upload.width,
      height: upload.height,
      duration: upload.duration,
      album: upload.album,
      tags: upload.tags,
      dateTaken: upload.dateTaken,
      isPublic: upload.isPublic,
      createdAt: upload.createdAt.toISOString(),
      memorial: upload.memorial
        ? {
            id: upload.memorial.id,
            name: `${upload.memorial.firstName} ${upload.memorial.lastName}`,
            slug: upload.memorial.slug,
          }
        : null,
    }));

    // Get unique albums for filtering UI
    const albums = await prisma.upload.findMany({
      where: { uploaderId: session.user.id },
      select: { album: true },
      distinct: ["album"],
    });

    const uniqueAlbums = albums.map((a) => a.album).filter((a): a is string => a !== null);

    return NextResponse.json({
      message: "Gallery media retrieved successfully",
      data: {
        media,
        albums: uniqueAlbums,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: skip + uploads.length < totalCount,
        },
      },
    });
  } catch (error) {
    console.error("Gallery fetch error:", error);
    return NextResponse.json(
      { message: "Internal server error - Please try again later" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in to upload media" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      url,
      fileName,
      originalName,
      mimeType,
      fileSize,
      thumbnailUrl,
      title,
      description,
      caption,
      type,
      width,
      height,
      duration,
      album,
      tags,
      dateTaken,
      isPublic,
      memorialId,
      publicId,
    } = body;

    // Basic validation
    if (!url?.trim()) {
      return NextResponse.json({ message: "URL is required" }, { status: 400 });
    }

    // Verify the memorial belongs to the user if specified
    if (memorialId) {
      const memorial = await prisma.memorial.findFirst({
        where: {
          id: memorialId,
          ownerId: session.user.id,
        },
      });

      if (!memorial) {
        return NextResponse.json(
          { message: "Memorial not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Determine upload type from mimeType or provided type
    let uploadType = "IMAGE";
    if (type) {
      uploadType = type.toUpperCase();
    } else if (mimeType) {
      if (mimeType.startsWith("video/")) uploadType = "VIDEO";
      else if (mimeType.startsWith("audio/")) uploadType = "AUDIO";
      else if (mimeType.startsWith("application/") || mimeType === "text/plain")
        uploadType = "DOCUMENT";
    }

    // Get the next sort order for this user's uploads
    const lastUpload = await prisma.upload.findFirst({
      where: { uploaderId: session.user.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const nextSortOrder = (lastUpload?.sortOrder || 0) + 1;

    // Create the upload record
    const newUpload = await prisma.upload.create({
      data: {
        url: url.trim(),
        fileName: fileName || url.split("/").pop() || "unnamed",
        originalName: originalName || title || "Unnamed",
        mimeType: mimeType || "image/jpeg",
        fileSize: fileSize || 0,
        thumbnailUrl,
        title: title?.trim(),
        description: description?.trim(),
        caption: caption?.trim(),
        type: uploadType as "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT",
        width,
        height,
        duration,
        album: album?.trim(),
        tags: tags || [],
        dateTaken: dateTaken ? new Date(dateTaken) : null,
        isPublic: isPublic ?? true,
        publicId,
        sortOrder: nextSortOrder,
        memorialId: memorialId || null,
        uploaderId: session.user.id,
      },
      include: {
        memorial: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            slug: true,
          },
        },
      },
    });

    console.log(`✅ Media uploaded to gallery: ${newUpload.id} by user ${session.user.id}`);

    return NextResponse.json(
      {
        message: "Media uploaded successfully",
        data: {
          id: newUpload.id,
          url: newUpload.url,
          thumbnailUrl: newUpload.thumbnailUrl,
          title: newUpload.title || newUpload.originalName,
          type: newUpload.type.toLowerCase(),
          createdAt: newUpload.createdAt.toISOString(),
          memorial: newUpload.memorial
            ? {
                id: newUpload.memorial.id,
                name: `${newUpload.memorial.firstName} ${newUpload.memorial.lastName}`,
                slug: newUpload.memorial.slug,
              }
            : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Media upload error:", error);
    return NextResponse.json(
      { message: "Internal server error - Please try again later" },
      { status: 500 }
    );
  }
}

// DELETE - Remove media from gallery
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Media ID is required" }, { status: 400 });
    }

    // Verify ownership
    const upload = await prisma.upload.findFirst({
      where: {
        id,
        uploaderId: session.user.id,
      },
    });

    if (!upload) {
      return NextResponse.json({ message: "Media not found or access denied" }, { status: 404 });
    }

    // Delete the record
    await prisma.upload.delete({
      where: { id },
    });

    console.log(`✅ Media deleted: ${id} by user ${session.user.id}`);

    return NextResponse.json({
      message: "Media deleted successfully",
    });
  } catch (error) {
    console.error("Media delete error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update media metadata
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, caption, album, tags, isPublic, sortOrder, memorialId } = body;

    if (!id) {
      return NextResponse.json({ message: "Media ID is required" }, { status: 400 });
    }

    // Verify ownership
    const upload = await prisma.upload.findFirst({
      where: {
        id,
        uploaderId: session.user.id,
      },
    });

    if (!upload) {
      return NextResponse.json({ message: "Media not found or access denied" }, { status: 404 });
    }

    // If changing memorial, verify ownership of target memorial
    if (memorialId !== undefined && memorialId !== null) {
      const memorial = await prisma.memorial.findFirst({
        where: {
          id: memorialId,
          ownerId: session.user.id,
        },
      });

      if (!memorial) {
        return NextResponse.json(
          { message: "Target memorial not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Update the record
    const updatedUpload = await prisma.upload.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title?.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(caption !== undefined && { caption: caption?.trim() }),
        ...(album !== undefined && { album: album?.trim() }),
        ...(tags !== undefined && { tags }),
        ...(isPublic !== undefined && { isPublic }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(memorialId !== undefined && { memorialId: memorialId || null }),
      },
    });

    console.log(`✅ Media updated: ${id} by user ${session.user.id}`);

    return NextResponse.json({
      message: "Media updated successfully",
      data: {
        id: updatedUpload.id,
        title: updatedUpload.title,
        album: updatedUpload.album,
        isPublic: updatedUpload.isPublic,
      },
    });
  } catch (error) {
    console.error("Media update error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
