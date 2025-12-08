import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/user/media/order
 * Save custom media order for the user's gallery
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { mediaOrder } = body;

    // Validate mediaOrder is an array of strings
    if (!Array.isArray(mediaOrder) || !mediaOrder.every((id) => typeof id === "string")) {
      return NextResponse.json(
        { error: "Invalid mediaOrder format. Expected array of media IDs." },
        { status: 400 }
      );
    }

    // Update sortOrder for each media item
    const updatePromises = mediaOrder.map((mediaId, index) =>
      prisma.upload.updateMany({
        where: {
          id: mediaId,
          uploaderId: session.user.id, // Ensure user owns the media
        },
        data: {
          sortOrder: index,
        },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: "Media order saved successfully",
    });
  } catch (error) {
    console.error("Error saving media order:", error);
    return NextResponse.json({ error: "Failed to save media order" }, { status: 500 });
  }
}
