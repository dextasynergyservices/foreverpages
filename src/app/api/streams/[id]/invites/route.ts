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

    // TODO: Implement actual email/SMS sending logic here
    // For now, just log the invitations
    console.log(`Sending ${type} invitations to:`, recipients);
    console.log(`Message: ${message}`);

    // You could integrate with services like:
    // - SendGrid or AWS SES for email
    // - Twilio or AWS SNS for SMS
    // - Or create a notification queue

    // For demonstration, we'll create notifications for registered users
    if (type === "email") {
      const users = await prisma.user.findMany({
        where: {
          email: {
            in: recipients,
          },
        },
        select: {
          id: true,
          email: true,
        },
      });

      if (users.length > 0) {
        await prisma.notification.createMany({
          data: users.map((u) => ({
            userId: u.id,
            type: "SYSTEM",
            title: "You've been invited to a livestream",
            message: message,
            link: `/memorial-pages/${stream.memorialId}/stream/${stream.id}`,
          })),
        });
      }
    }

    return NextResponse.json({
      success: true,
      sent: recipients.length,
      type,
    });
  } catch (error) {
    console.error("Error sending invites:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
