import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/user/storage
 * Get user's storage usage and limits
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all memorials owned by user
    const memorials = await prisma.memorial.findMany({
      where: { ownerId: user.id },
      select: { id: true },
    });

    const memorialIds = memorials.map((m) => m.id);

    // Calculate total storage used from recordings
    const streams = await prisma.memorialStream.findMany({
      where: {
        memorialId: { in: memorialIds },
        recordingSize: { not: null },
      },
      select: {
        recordingSize: true,
      },
    });

    const usedBytes = streams.reduce((total, stream) => {
      return total + (stream.recordingSize || 0);
    }, 0);

    // Get user's subscription plan to determine storage limit
    // Default: Free tier = 5 GB, Premium = 50 GB, Enterprise = 500 GB
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
      },
      include: {
        plan: true,
      },
    });

    // Storage limits in bytes (5 GB, 50 GB, 500 GB)
    const storageLimits: Record<string, number> = {
      FREE: 5 * 1024 * 1024 * 1024, // 5 GB
      BASIC: 10 * 1024 * 1024 * 1024, // 10 GB
      STANDARD: 50 * 1024 * 1024 * 1024, // 50 GB
      PREMIUM: 500 * 1024 * 1024 * 1024, // 500 GB
    };

    const planName = subscription?.plan?.name?.toUpperCase() || "FREE";
    const totalBytes = storageLimits[planName] || storageLimits.FREE;

    // Count recordings for additional stats
    const recordingCount = await prisma.memorialStream.count({
      where: {
        memorialId: { in: memorialIds },
        recordingUrl: { not: null },
      },
    });

    return NextResponse.json({
      usedBytes,
      totalBytes,
      percentage: totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0,
      recordingCount,
      plan: planName,
      warning: usedBytes / totalBytes >= 0.8 ? "Storage is running low" : null,
      critical: usedBytes / totalBytes >= 0.95 ? "Storage is almost full" : null,
    });
  } catch (error) {
    console.error("[GET /api/user/storage] Error:", error);
    return NextResponse.json({ error: "Failed to get storage info" }, { status: 500 });
  }
}
