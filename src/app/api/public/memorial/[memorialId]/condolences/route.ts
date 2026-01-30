import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch approved condolences for a memorial
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

    // Fetch approved condolences for this memorial
    const condolences = await prisma.post.findMany({
      where: {
        memorialId,
        type: "CONDOLENCE",
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

    // Transform condolences for frontend
    const formattedCondolences = condolences.map((condolence) => ({
      id: condolence.id,
      name: condolence.authorName || condolence.author?.name || "Anonymous",
      relationship: condolence.title || "Friend",
      message: condolence.content,
      photo: condolence.images?.[0] || condolence.author?.image || undefined,
      timestamp: formatTimeAgo(condolence.createdAt),
      date: condolence.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      condolences: formattedCondolences,
    });
  } catch (error) {
    console.error("Error fetching condolences:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Submit a new condolence (requires approval)
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
    const { name, email, relationship, message, letterUrl, letter } = body;

    // Accept both letterUrl (legacy) and letter (from form)
    const uploadedFile = letterUrl || letter || null;

    if (!name || !message) {
      return NextResponse.json(
        { success: false, error: "Name and message are required" },
        { status: 400 }
      );
    }

    // Determine if the file is an image or other type
    const isImage = uploadedFile && (uploadedFile.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(uploadedFile));

    // Create the condolence (isApproved defaults to false, requiring owner approval)
    const condolence = await prisma.post.create({
      data: {
        memorialId,
        type: "CONDOLENCE",
        title: relationship || "Friend", // Use title for relationship
        content: message,
        authorName: name,
        authorEmail: email || null,
        images: isImage && uploadedFile ? [uploadedFile] : [], // Store image files
        attachments: !isImage && uploadedFile ? [uploadedFile] : [], // Store non-image files (PDFs, etc.)
        isApproved: false, // Requires approval by memorial owner
      },
    });

    // TODO: Optionally create a notification for the memorial owner
    // await createNotification(memorial.ownerId, 'NEW_CONDOLENCE', condolence.id);

    return NextResponse.json({
      success: true,
      message: "Condolence submitted successfully. It will appear after approval.",
      condolenceId: condolence.id,
    });
  } catch (error) {
    console.error("Error submitting condolence:", error);
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
