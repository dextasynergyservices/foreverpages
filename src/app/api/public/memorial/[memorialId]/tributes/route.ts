import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch approved tributes for a memorial
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ memorialId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { memorialId } = resolvedParams;

    if (!memorialId) {
      return NextResponse.json(
        { success: false, error: "Memorial ID is required" },
        { status: 400 }
      );
    }

    // Verify memorial exists
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { id: true, isPublished: true },
    });

    if (!memorial) {
      return NextResponse.json(
        { success: false, error: "Memorial not found" },
        { status: 404 }
      );
    }

    // Fetch approved tributes for this memorial
    const tributes = await prisma.post.findMany({
      where: {
        memorialId,
        type: "TRIBUTE",
        isApproved: true,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        images: true,
        authorName: true,
        authorEmail: true,
        createdAt: true,
        author: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    // Transform tributes for frontend
    const formattedTributes = tributes.map((tribute) => ({
      id: tribute.id,
      name: tribute.authorName || tribute.author?.name || "Anonymous",
      relationship: tribute.title || "Friend",
      message: tribute.content,
      photo: tribute.images?.[0] || tribute.author?.image || undefined,
      offering: "candle" as const, // Default offering type
      timestamp: formatTimeAgo(tribute.createdAt),
    }));

    return NextResponse.json({
      success: true,
      tributes: formattedTributes,
    });
  } catch (error) {
    console.error("Error fetching tributes:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Submit a new tribute (requires approval)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ memorialId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { memorialId } = resolvedParams;

    if (!memorialId) {
      return NextResponse.json(
        { success: false, error: "Memorial ID is required" },
        { status: 400 }
      );
    }

    // Verify memorial exists
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { id: true, isPublished: true, ownerId: true },
    });

    if (!memorial) {
      return NextResponse.json(
        { success: false, error: "Memorial not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, relationship, message, photo, attachment } = body;
    // Note: offering field is received but not stored - could be used for virtual candle/flower tracking

    if (!name || !message) {
      return NextResponse.json(
        { success: false, error: "Name and message are required" },
        { status: 400 }
      );
    }

    // Determine if any uploaded file is an image or other type
    const uploadedFile = photo || attachment || null;
    const isImage = uploadedFile && (uploadedFile.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(uploadedFile));

    // Create the tribute (isApproved defaults to false, requiring owner approval)
    const tribute = await prisma.post.create({
      data: {
        memorialId,
        type: "TRIBUTE",
        title: relationship || "Friend", // Use title for relationship
        content: message,
        authorName: name,
        images: isImage && uploadedFile ? [uploadedFile] : [],
        attachments: !isImage && uploadedFile ? [uploadedFile] : [], // Store non-image files
        isApproved: false, // Requires approval by memorial owner
      },
    });

    // TODO: Optionally create a notification for the memorial owner
    // await createNotification(memorial.ownerId, 'NEW_TRIBUTE', tribute.id);

    return NextResponse.json({
      success: true,
      message: "Tribute submitted successfully. It will appear after approval.",
      tributeId: tribute.id,
    });
  } catch (error) {
    console.error("Error submitting tribute:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}
