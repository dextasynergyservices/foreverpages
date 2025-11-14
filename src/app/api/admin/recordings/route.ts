import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { addMonths } from "date-fns";

/**
 * GET /api/admin/recordings
 * Fetch all recordings with filtering and statistics
 * Admin only
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check admin authorization
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const filter = searchParams.get("filter") || "all"; // all, expiring, expired
    const sortBy = searchParams.get("sortBy") || "expiryDate"; // expiryDate, createdAt, memorialName
    const sortOrder = searchParams.get("sortOrder") || "asc"; // asc, desc

    const now = new Date();
    const thirtyDaysFromNow = addMonths(now, 1);

    // Build where clause based on filter
    type WhereClause = {
      recordingUrl: { not: null };
      recordingDeleteAt?: {
        lte?: Date;
        gt?: Date;
      };
    };

    const whereClause: WhereClause = {
      recordingUrl: { not: null },
    };

    if (filter === "expiring") {
      whereClause.recordingDeleteAt = {
        lte: thirtyDaysFromNow,
        gt: now,
      };
    } else if (filter === "expired") {
      whereClause.recordingDeleteAt = {
        lte: now,
      };
    }

    // Fetch recordings
    const recordings = await prisma.memorialStream.findMany({
      where: whereClause,
      include: {
        memorial: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            slug: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy:
        sortBy === "expiryDate"
          ? { recordingDeleteAt: sortOrder as "asc" | "desc" }
          : sortBy === "createdAt"
            ? { createdAt: sortOrder as "asc" | "desc" }
            : { memorial: { firstName: sortOrder as "asc" | "desc" } },
    });

    // Calculate statistics
    const [totalCount, expiringCount, expiredCount, totalSize, warningsSentCount] =
      await Promise.all([
        prisma.memorialStream.count({
          where: { recordingUrl: { not: null } },
        }),
        prisma.memorialStream.count({
          where: {
            recordingUrl: { not: null },
            recordingDeleteAt: {
              lte: thirtyDaysFromNow,
              gt: now,
            },
          },
        }),
        prisma.memorialStream.count({
          where: {
            recordingUrl: { not: null },
            recordingDeleteAt: { lte: now },
          },
        }),
        prisma.memorialStream.aggregate({
          where: { recordingUrl: { not: null } },
          _sum: { recordingSize: true },
        }),
        prisma.memorialStream.count({
          where: {
            recordingUrl: { not: null },
            recordingDeleteWarningAt: { not: null },
          },
        }),
      ]);

    // Get oldest recording date
    const oldestRecording = await prisma.memorialStream.findFirst({
      where: { recordingUrl: { not: null } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });

    return NextResponse.json({
      recordings: recordings.map((rec) => ({
        id: rec.id,
        title: rec.title,
        memorialId: rec.memorial.id,
        memorialName: `${rec.memorial.firstName} ${rec.memorial.lastName}`,
        memorialSlug: rec.memorial.slug,
        ownerName: rec.memorial.owner.name,
        ownerEmail: rec.memorial.owner.email,
        recordingUrl: rec.recordingUrl,
        recordingSize: rec.recordingSize,
        recordingDuration: rec.recordingDuration,
        recordedAt: rec.startedAt,
        expiresAt: rec.recordingDeleteAt,
        warningAt: rec.recordingDeleteWarningAt,
        status:
          rec.recordingDeleteAt && rec.recordingDeleteAt <= now
            ? "expired"
            : rec.recordingDeleteAt && rec.recordingDeleteAt <= thirtyDaysFromNow
              ? "expiring"
              : "active",
      })),
      statistics: {
        totalRecordings: totalCount,
        expiringWithin30Days: expiringCount,
        expired: expiredCount,
        totalStorageBytes: totalSize._sum.recordingSize || 0,
        warningsSent: warningsSentCount,
        oldestRecordingDate: oldestRecording?.createdAt || null,
      },
    });
  } catch (error) {
    console.error("Error fetching recordings:", error);
    return NextResponse.json({ error: "Failed to fetch recordings" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/recordings
 * Extend or delete recordings
 * Admin only
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check admin authorization
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, recordingIds } = body;

    if (!action || !recordingIds || !Array.isArray(recordingIds)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (action === "extend") {
      // Extend recordings by 6 months
      const updated = await prisma.memorialStream.updateMany({
        where: {
          id: { in: recordingIds },
          recordingUrl: { not: null },
        },
        data: {
          recordingDeleteAt: addMonths(new Date(), 6),
          recordingDeleteWarningAt: null, // Reset warning
        },
      });

      return NextResponse.json({
        success: true,
        message: `Extended ${updated.count} recording(s) by 6 months`,
        count: updated.count,
      });
    } else if (action === "delete") {
      // Delete recordings immediately
      // Note: This only removes the URL from DB, actual file deletion should be done via cron job
      const updated = await prisma.memorialStream.updateMany({
        where: {
          id: { in: recordingIds },
          recordingUrl: { not: null },
        },
        data: {
          recordingUrl: null,
          recordingDeleteAt: new Date(), // Mark as deleted now
        },
      });

      return NextResponse.json({
        success: true,
        message: `Deleted ${updated.count} recording(s)`,
        count: updated.count,
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating recordings:", error);
    return NextResponse.json({ error: "Failed to update recordings" }, { status: 500 });
  }
}
