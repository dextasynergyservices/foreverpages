import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotification, NotificationEvent } from "@/lib/notification-service";

/**
 * POST /api/streams/[id]/invites
 * Send stream invitations to users via email or SMS
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
          select: { ownerId: true, firstName: true, lastName: true, slug: true },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (stream.memorial.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { recipients, message, type } = body as {
      recipients: string[];
      message: string;
      type: "email" | "sms";
    };

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: "Recipients required" }, { status: 400 });
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    console.log(`Sending ${type} invitations to:`, recipients);

    let sentCount = 0;
    let failedCount = 0;

    // Find registered users by email
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: recipients,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Send notifications to registered users using the notification service
    for (const invitedUser of users) {
      try {
        const result = await sendNotification(invitedUser.id, NotificationEvent.STREAM_SCHEDULED, {
          memorialName: `${stream.memorial.firstName} ${stream.memorial.lastName}`,
          streamTitle: stream.title,
          streamUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${stream.memorial.slug}?stream=${streamId}`,
          scheduledFor: stream.scheduledFor || new Date(),
        });

        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }

    // Create in-app notifications for registered users
    if (users.length > 0) {
      await prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          type: "SYSTEM",
          title: `You're invited to a livestream: ${stream.title}`,
          message: message,
          link: `/memorial-pages/${stream.memorialId}/stream/${stream.id}`,
        })),
      });
    }

    // Track non-registered recipients (those not found as users)
    const registeredEmails = new Set(users.map((u) => u.email));
    const unregisteredRecipients = recipients.filter((r) => !registeredEmails.has(r));

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      unregistered: unregisteredRecipients.length,
      type,
      message:
        unregisteredRecipients.length > 0
          ? `${sentCount} notifications sent. ${unregisteredRecipients.length} recipients are not registered users.`
          : `${sentCount} notifications sent successfully.`,
    });
  } catch (error) {
    console.error("Error sending invites:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
