import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendStreamReminders } from "@/lib/notification-service";

/**
 * POST /api/streams/[id]/reminder
 * Send reminder notifications to all stream subscribers
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: streamId } = await context.params;

    // Verify stream exists and user is the owner
    const stream = await prisma.memorialStream.findUnique({
      where: { id: streamId },
      include: {
        memorial: {
          select: { ownerId: true, firstName: true, lastName: true },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (stream.memorial.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if stream is scheduled
    if (stream.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "Can only send reminders for scheduled streams" },
        { status: 400 }
      );
    }

    // Check if reminder was already sent
    if (stream.reminderSent) {
      return NextResponse.json(
        { error: "Reminder has already been sent for this stream" },
        { status: 400 }
      );
    }

    // Send reminders using the unified notification service
    // This handles email, SMS, and WhatsApp based on user preferences
    const result = await sendStreamReminders(streamId);

    console.log(
      `✅ Stream reminder sent for: ${stream.title} (${result.sent} sent, ${result.failed} failed)`
    );

    return NextResponse.json({
      success: true,
      message: "Reminder sent successfully",
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
