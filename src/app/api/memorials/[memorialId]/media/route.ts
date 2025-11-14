import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary, validateFile } from "@/lib/cloudinary";
import { UploadType } from "@/generated/prisma";

interface RouteContext {
  params: {
    memorialId: string;
  };
}

/**
 * GET: Fetch all media for a memorial
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { memorialId } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as UploadType | null;
    const album = searchParams.get("album");

    // Build query filters
    const where: { memorialId: string; type?: UploadType; album?: string } = {
      memorialId,
    };
    if (type) where.type = type;
    if (album) where.album = album;

    // Fetch media
    const media = await prisma.upload.findMany({
      where,
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get albums list
    const albums = await prisma.upload.findMany({
      where: { memorialId },
      select: { album: true },
      distinct: ["album"],
    });

    const albumsList = albums.map((a) => a.album).filter((a): a is string => a !== null);

    return NextResponse.json({
      success: true,
      data: media,
      albums: albumsList,
    });
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch media" }, { status: 500 });
  }
}

/**
 * POST: Upload new media
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { memorialId } = params;

    // Check permissions using middleware
    const { checkMemorialPermission } = await import("@/middleware/memorialPermissions");
    const permissionCheck = await checkMemorialPermission(memorialId, "upload_media");

    if (!permissionCheck.authorized) {
      return (
        permissionCheck.error ||
        NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
      );
    }

    const formData = await request.formData();

    const file = formData.get("file") as File;
    const type = formData.get("type") as UploadType;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const caption = formData.get("caption") as string | null;
    const album = formData.get("album") as string | null;
    const tags = formData.get("tags") as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    // Verify memorial exists and get owner info for plan check
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      include: {
        owner: {
          include: {
            currentPlan: true,
          },
        },
      },
    });

    if (!memorial) {
      return NextResponse.json({ success: false, error: "Memorial not found" }, { status: 404 });
    }

    // Get current upload count
    const currentUploads = await prisma.upload.groupBy({
      by: ["type"],
      where: { memorialId },
      _count: true,
    });

    const imageCount = currentUploads.find((u) => u.type === "IMAGE")?._count || 0;
    const videoCount = currentUploads.find((u) => u.type === "VIDEO")?._count || 0;

    // Check plan limits
    const plan = memorial.owner.currentPlan;
    if (!plan) {
      return NextResponse.json({ success: false, error: "No active plan found" }, { status: 403 });
    }

    if (type === "IMAGE" && imageCount >= plan.maxPhotosPerMemorial) {
      return NextResponse.json(
        {
          success: false,
          error: `You have reached your plan limit of ${plan.maxPhotosPerMemorial} photos`,
          limit: plan.maxPhotosPerMemorial,
          current: imageCount,
        },
        { status: 403 }
      );
    }

    if (type === "VIDEO" && videoCount >= plan.maxVideosPerMemorial) {
      return NextResponse.json(
        {
          success: false,
          error: `You have reached your plan limit of ${plan.maxVideosPerMemorial} videos`,
          limit: plan.maxVideosPerMemorial,
          current: videoCount,
        },
        { status: 403 }
      );
    }

    // Validate file
    const validation = validateFile(file, {
      maxSizeMB: type === "VIDEO" ? 100 : 10,
      allowedTypes: type === "VIDEO" ? ["video/*"] : ["image/*"],
    });

    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(base64, {
      folder: `foreverpages/memorials/${memorialId}`,
      resourceType: type === "VIDEO" ? "video" : "image",
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      transformation:
        type === "IMAGE"
          ? [{ width: 1920, height: 1920, crop: "limit", quality: "auto:good" }]
          : undefined,
    });

    // Save to database
    const upload = await prisma.upload.create({
      data: {
        fileName: uploadResult.public_id,
        originalName: file.name,
        mimeType: file.type,
        fileSize: uploadResult.bytes,
        url: uploadResult.secure_url,
        thumbnailUrl: uploadResult.thumbnail_url,
        type,
        width: uploadResult.width,
        height: uploadResult.height,
        duration: uploadResult.duration,
        title,
        description,
        caption,
        album,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        memorialId,
        uploaderId: session.user.id,
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
      data: upload,
      limits: {
        images: {
          current: imageCount + (type === "IMAGE" ? 1 : 0),
          max: plan.maxPhotosPerMemorial,
        },
        videos: {
          current: videoCount + (type === "VIDEO" ? 1 : 0),
          max: plan.maxVideosPerMemorial,
        },
      },
    });
  } catch (error) {
    console.error("Error uploading media:", error);
    return NextResponse.json({ success: false, error: "Failed to upload media" }, { status: 500 });
  }
}
