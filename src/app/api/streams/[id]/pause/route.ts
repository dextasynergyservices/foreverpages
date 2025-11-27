import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { StreamStatus } from "@/generated/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = (await params) as { id?: string };
    if (!id) {
      return NextResponse.json({ error: "Missing stream id" }, { status: 400 });
    }
    const streamId = id;

    const stream = await prisma.memorialStream.findUnique({
      where: { id: streamId },
      include: { memorial: { select: { ownerId: true } } },
    });

    if (!stream) return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    if (stream.memorial.ownerId !== session.user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (stream.status !== StreamStatus.LIVE) {
      return NextResponse.json({ error: "Stream is not live" }, { status: 400 });
    }

    const updated = await prisma.memorialStream.update({
      where: { id: streamId },
      data: { status: StreamStatus.PAUSED },
    });

    return NextResponse.json({ stream: updated });
  } catch (error) {
    console.error("Error pausing stream:", error);
    return NextResponse.json({ error: "Failed to pause stream" }, { status: 500 });
  }
}
