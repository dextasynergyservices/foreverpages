import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { StreamStatus } from "@/generated/prisma";

/**
 * GET /api/memorials/[memorialId]/active-stream
 * Public endpoint that returns a currently active stream for the memorial
 * (LIVE / PAUSED / STARTING). Recording URLs are omitted for non-owners.
 */
export async function GET(req: NextRequest, { params }: { params: { memorialId: string } }) {
  try {
    const memorialId = params.memorialId;

    // Find memorial
    const memorial = await prisma.memorial.findUnique({ where: { id: memorialId } });
    if (!memorial) return NextResponse.json({ error: "Memorial not found" }, { status: 404 });

    // Look for a stream that is live/starting/paused for this memorial
    const stream = await prisma.memorialStream.findFirst({
      where: {
        memorialId,
        status: { in: [StreamStatus.STARTING, StreamStatus.LIVE, StreamStatus.PAUSED] },
      },
      orderBy: { scheduledFor: "desc" },
    });

    if (!stream) return NextResponse.json({ stream: null });

    // Determine ownership so we can decide whether to include recordingUrl
    const session = await getServerSession(authOptions);
    const isOwner = session?.user?.id === memorial.ownerId;

    if (!isOwner) {
      // Sanitize sensitive fields and ensure recordingUrl is not exposed on
      // public memorial pages.
      const publicStream = { ...stream, recordingUrl: null };
      return NextResponse.json({ stream: publicStream });
    }

    return NextResponse.json({ stream });
  } catch (error) {
    console.error("Error fetching active stream:", error);
    return NextResponse.json({ error: "Failed to fetch active stream" }, { status: 500 });
  }
}
