import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: streamId } = await params;
    const body = await request.json();
    const { autoStart, autoEnd } = body;

    // Verify stream ownership
    const stream = await prisma.memorialStream.findUnique({
      where: { id: streamId },
      include: {
        memorial: {
          select: { ownerId: true },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (stream.memorial.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update schedule settings
    const updateData: { autoStart?: boolean; autoEnd?: boolean } = {};
    if (typeof autoStart === "boolean") updateData.autoStart = autoStart;
    if (typeof autoEnd === "boolean") updateData.autoEnd = autoEnd;

    const updatedStream = await prisma.memorialStream.update({
      where: { id: streamId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      autoStart: updatedStream.autoStart,
      autoEnd: updatedStream.autoEnd,
    });
  } catch (error) {
    console.error("Schedule update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
