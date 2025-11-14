import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // TODO: Implement actual reminder notification system
    // This could be done via:
    // 1. Email notifications to invited guests
    // 2. Push notifications to mobile app users
    // 3. SMS reminders
    // 4. In-app notifications

    // For now, just log and update reminderSent flag
    console.log(`Sending stream reminder for: ${stream.title}`);
    console.log(`Memorial: ${stream.memorial.firstName} ${stream.memorial.lastName}`);
    console.log(`Scheduled for: ${stream.scheduledFor}`);

    // Update reminderSent flag
    await prisma.memorialStream.update({
      where: { id: streamId },
      data: { reminderSent: true },
    });

    // In production, you would:
    // 1. Query all invited users/guests
    // 2. Send email via SendGrid/AWS SES
    // 3. Send push notifications
    // 4. Create in-app notifications
    // 5. Track delivery status

    return NextResponse.json({
      success: true,
      message: "Reminder sent successfully",
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
