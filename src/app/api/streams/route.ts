import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { StreamStatus } from "@/generated/prisma";
import bcrypt from "bcryptjs";

/**
 * GET /api/streams
 * List streams for the authenticated user
 * Query params: memorialId (optional), status (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const memorialId = searchParams.get("memorialId");
    const status = searchParams.get("status") as StreamStatus | null;

    // Build query filters
    const whereClause: {
      memorialId?: string;
      status?: StreamStatus;
    } = {};

    if (memorialId) {
      whereClause.memorialId = memorialId;
    }

    if (status) {
      whereClause.status = status;
    }

    // Get user's memorials
    const userMemorials = await prisma.memorial.findMany({
      where: { ownerId: session.user.id },
      select: { id: true },
    });

    const memorialIds = userMemorials.map((m) => m.id);

    const streams = await prisma.memorialStream.findMany({
      where: {
        memorialId: { in: memorialIds },
        ...whereClause,
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
        _count: {
          select: {
            viewers: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ streams });
  } catch (error) {
    console.error("Error fetching streams:", error);
    return NextResponse.json({ error: "Failed to fetch streams" }, { status: 500 });
  }
}

/**
 * POST /api/streams
 * Create a new stream
 * Body: { memorialId, title?, description?, scheduledFor?, streamQuality?, isPublic?, password?, recordStream? }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      memorialId,
      title,
      description,
      scheduledFor,
      streamQuality = "FULL_HD",
      isPublic = true,
      password,
      recordStream = true,
    } = body;

    // Validate memorial belongs to user
    const memorial = await prisma.memorial.findUnique({
      where: {
        id: memorialId,
      },
    });

    if (!memorial || memorial.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Create stream
    const stream = await prisma.memorialStream.create({
      data: {
        memorialId,
        title: title || `${memorial.firstName} ${memorial.lastName} - Memorial Service`,
        description,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        streamQuality,
        isPublic,
        password: hashedPassword,
        recordStream,
        status: StreamStatus.SCHEDULED, // All streams start as SCHEDULED
      },
      include: {
        memorial: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ stream }, { status: 201 });
  } catch (error) {
    console.error("Error creating stream:", error);
    return NextResponse.json({ error: "Failed to create stream" }, { status: 500 });
  }
}
