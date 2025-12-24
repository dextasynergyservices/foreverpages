import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in to access gallery" },
        { status: 401 }
      );
    }

    // Get media associated with user's memorials
    // For now, we'll simulate media data since we don't have a media table yet
    // In a real implementation, you'd have a Media table with memorialId foreign key
    const media = [
      {
        id: "1",
        url: "https://picsum.photos/800/600?random=1",
        title: "Family Gathering",
        type: "image" as const,
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        url: "https://picsum.photos/800/600?random=2",
        title: "Wedding Day",
        type: "image" as const,
        createdAt: new Date().toISOString(),
      },
      {
        id: "3",
        url: "https://picsum.photos/800/600?random=3",
        title: "Graduation Ceremony",
        type: "image" as const,
        createdAt: new Date().toISOString(),
      },
      {
        id: "4",
        url: "https://picsum.photos/800/600?random=4",
        title: "Birthday Celebration",
        type: "image" as const,
        createdAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      message: "Gallery media retrieved successfully",
      data: {
        media,
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
    const { url, title, type, memorialId } = body;

    // Basic validation
    if (!url?.trim() || !title?.trim()) {
      return NextResponse.json({ message: "URL and title are required" }, { status: 400 });
    }

    // Verify the memorial belongs to the user
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

    // In a real implementation, you'd save this to a Media table
    // For now, we'll just return success
    const newMedia = {
      id: Date.now().toString(),
      url: url.trim(),
      title: title.trim(),
      type: type || "image",
      memorialId,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        message: "Media uploaded successfully",
        data: newMedia,
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
