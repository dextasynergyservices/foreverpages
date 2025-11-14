import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendRecordingExpiringEmail,
  sendRecordingDeletedEmail,
} from "@/lib/livestream-email-service";
import { addDays } from "date-fns";

/**
 * POST /api/cron/recording-retention
 * Manages livestream recording retention lifecycle:
 * 1. Sends warning emails 7 days before deletion
 * 2. Deletes expired recordings from storage
 *
 * This endpoint should be called daily by cron-job.org
 * Protected by CRON_SECRET environment variable
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      console.warn("Unauthorized cron job attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const sevenDaysFromNow = addDays(now, 7);

    // Step 1: Find recordings that will expire in 7 days and haven't been warned
    const recordingsToWarn = await prisma.memorialStream.findMany({
      where: {
        recordingUrl: { not: null },
        recordingDeleteAt: {
          lte: sevenDaysFromNow,
          gt: now,
        },
        recordingDeleteWarningAt: null,
      },
      include: {
        memorial: {
          include: {
            owner: true,
          },
        },
      },
    });

    console.log(`Found ${recordingsToWarn.length} recordings to warn about expiration`);

    const warnResults = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send warning emails
    for (const stream of recordingsToWarn) {
      try {
        if (!stream.memorial.owner.email) {
          console.warn(`No email for memorial owner: ${stream.memorial.id}`);
          warnResults.failed++;
          continue;
        }

        // Calculate days remaining
        const daysRemaining = Math.ceil(
          (stream.recordingDeleteAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        await sendRecordingExpiringEmail({
          recipientEmail: stream.memorial.owner.email,
          recipientName: stream.memorial.owner.name || "Memorial Owner",
          memorialName: stream.memorial.firstName,
          streamTitle: stream.title,
          recordingUrl: stream.recordingUrl!,
          expiresAt: stream.recordingDeleteAt!,
          daysRemaining,
        });

        // Update warning timestamp
        await prisma.memorialStream.update({
          where: { id: stream.id },
          data: { recordingDeleteWarningAt: now },
        });

        warnResults.success++;
        console.log(`Warning sent for recording: ${stream.id}`);
      } catch (error) {
        console.error(`Failed to send warning for recording ${stream.id}:`, error);
        warnResults.failed++;
        warnResults.errors.push(
          `Stream ${stream.id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // Step 2: Find and delete expired recordings
    const expiredRecordings = await prisma.memorialStream.findMany({
      where: {
        recordingUrl: { not: null },
        recordingDeleteAt: {
          lte: now,
        },
      },
      include: {
        memorial: {
          include: {
            owner: true,
          },
        },
      },
    });

    console.log(`Found ${expiredRecordings.length} expired recordings to delete`);

    const deleteResults = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process deletions
    for (const stream of expiredRecordings) {
      try {
        const recordingUrl = stream.recordingUrl!;
        const deletedAt = now;

        // Delete from Cloudinary
        // Extract public_id from Cloudinary URL
        // URL format: https://res.cloudinary.com/<cloud_name>/video/upload/v<version>/<public_id>.<extension>
        if (recordingUrl.includes("cloudinary.com")) {
          try {
            const urlParts = recordingUrl.split("/");
            const fileNameWithExt = urlParts[urlParts.length - 1];
            const publicId = fileNameWithExt.split(".")[0];
            const versionIndex = urlParts.findIndex((part: string) => part.startsWith("v"));
            const folderParts = urlParts.slice(versionIndex + 1, -1);
            const fullPublicId =
              folderParts.length > 0 ? `${folderParts.join("/")}/${publicId}` : publicId;

            // Dynamically import cloudinary (only when needed)
            const { v2: cloudinary } = await import("cloudinary");

            // Configure cloudinary if not already configured
            if (!cloudinary.config().cloud_name) {
              cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
              });
            }

            await cloudinary.uploader.destroy(fullPublicId, {
              resource_type: "video",
              invalidate: true,
            });

            console.log(`Deleted video from Cloudinary: ${fullPublicId}`);
          } catch (cloudinaryError) {
            console.error(`Failed to delete from Cloudinary:`, cloudinaryError);
            // Continue with database update even if Cloudinary deletion fails
          }
        }

        // Update database - remove recording URL
        await prisma.memorialStream.update({
          where: { id: stream.id },
          data: {
            recordingUrl: null,
            // Keep recordingDeleteAt for audit trail
          },
        });

        // Send deletion notification email
        if (stream.memorial.owner.email) {
          await sendRecordingDeletedEmail({
            recipientEmail: stream.memorial.owner.email,
            recipientName: stream.memorial.owner.name || "Memorial Owner",
            memorialName: stream.memorial.firstName,
            streamTitle: stream.title,
            deletedAt,
          });
        }

        deleteResults.success++;
        console.log(`Deleted recording: ${stream.id}`);
      } catch (error) {
        console.error(`Failed to delete recording ${stream.id}:`, error);
        deleteResults.failed++;
        deleteResults.errors.push(
          `Stream ${stream.id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // Return summary
    const response = {
      success: true,
      timestamp: now.toISOString(),
      warnings: {
        sent: warnResults.success,
        failed: warnResults.failed,
        total: recordingsToWarn.length,
        errors: warnResults.errors,
      },
      deletions: {
        deleted: deleteResults.success,
        failed: deleteResults.failed,
        total: expiredRecordings.length,
        errors: deleteResults.errors,
      },
    };

    console.log("Recording retention job completed:", response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in recording retention cron job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process recording retention",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/recording-retention
 * Get endpoint information and statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Allow authenticated requests to view statistics
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;

    const isAuthenticated = expectedToken && authHeader === `Bearer ${expectedToken}`;

    if (!isAuthenticated) {
      return NextResponse.json({
        message: "Recording retention cron endpoint",
        usage: "POST with Bearer token in Authorization header",
        schedule: "Should be called daily via cron-job.org",
        actions: [
          "Sends warning emails 7 days before recording deletion",
          "Deletes expired recordings from Cloudinary storage",
          "Sends deletion confirmation emails",
        ],
      });
    }

    // If authenticated, provide statistics
    const now = new Date();
    const sevenDaysFromNow = addDays(now, 7);

    const [totalRecordings, expiringWithinWeek, expired, warned] = await Promise.all([
      prisma.memorialStream.count({
        where: { recordingUrl: { not: null } },
      }),
      prisma.memorialStream.count({
        where: {
          recordingUrl: { not: null },
          recordingDeleteAt: {
            lte: sevenDaysFromNow,
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
      prisma.memorialStream.count({
        where: {
          recordingUrl: { not: null },
          recordingDeleteWarningAt: { not: null },
        },
      }),
    ]);

    return NextResponse.json({
      message: "Recording retention cron endpoint",
      statistics: {
        totalRecordings,
        expiringWithinWeek,
        expiredAwaitingDeletion: expired,
        warningsSent: warned,
        nextRun: "Configured via cron-job.org",
      },
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching recording retention statistics:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}
