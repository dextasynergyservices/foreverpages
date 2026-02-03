import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

/**
 * Schema for notification preferences update
 */
const notificationPreferencesSchema = z.object({
  // Global
  notificationsEnabled: z.boolean().optional(),

  // Email
  emailNotifications: z.boolean().optional(),
  emailTributes: z.boolean().optional(),
  emailComments: z.boolean().optional(),
  emailLivestream: z.boolean().optional(),
  emailAnniversary: z.boolean().optional(),
  emailDigest: z.boolean().optional(),
  emailMarketing: z.boolean().optional(),

  // SMS
  smsNotifications: z.boolean().optional(),
  smsTributes: z.boolean().optional(),
  smsLivestream: z.boolean().optional(),
  smsAnniversary: z.boolean().optional(),

  // WhatsApp
  whatsappNotifications: z.boolean().optional(),
  whatsappNumber: z.string().nullable().optional(),
  whatsappTributes: z.boolean().optional(),
  whatsappLivestream: z.boolean().optional(),
  whatsappAnniversary: z.boolean().optional(),
});

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;

/**
 * GET /api/user/notification-preferences
 * Get user's notification preferences
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        // Global
        notificationsEnabled: true,

        // Email
        emailNotifications: true,
        emailTributes: true,
        emailComments: true,
        emailLivestream: true,
        emailAnniversary: true,
        emailDigest: true,
        emailMarketing: true,

        // SMS
        smsNotifications: true,
        smsTributes: true,
        smsLivestream: true,
        smsAnniversary: true,
        phone: true, // Needed to show if SMS is available

        // WhatsApp
        whatsappNotifications: true,
        whatsappNumber: true,
        whatsappTributes: true,
        whatsappLivestream: true,
        whatsappAnniversary: true,
      },
    });

    if (!preferences) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      preferences: {
        ...preferences,
        hasPhone: !!preferences.phone,
        hasWhatsApp: !!preferences.whatsappNumber,
      },
    });
  } catch (error) {
    console.error("[GET /api/user/notification-preferences] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/notification-preferences
 * Update user's notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = notificationPreferencesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // Validate phone number for SMS if enabling SMS notifications
    if (updates.smsNotifications === true) {
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { phone: true },
      });

      if (!currentUser?.phone) {
        return NextResponse.json(
          { error: "Phone number required to enable SMS notifications" },
          { status: 400 }
        );
      }
    }

    // Note: WhatsApp number validation will be enabled after schema migration
    // For now, we allow setting the whatsappNumber directly

    // Update preferences
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updates,
      select: {
        notificationsEnabled: true,
        emailNotifications: true,
        emailTributes: true,
        emailComments: true,
        emailLivestream: true,
        emailAnniversary: true,
        emailDigest: true,
        emailMarketing: true,
        smsNotifications: true,
        smsTributes: true,
        smsLivestream: true,
        smsAnniversary: true,
        phone: true,
        whatsappNotifications: true,
        whatsappNumber: true,
        whatsappTributes: true,
        whatsappLivestream: true,
        whatsappAnniversary: true,
      },
    });

    return NextResponse.json({
      success: true,
      preferences: {
        ...updatedUser,
        hasPhone: !!updatedUser.phone,
        hasWhatsApp: !!updatedUser.whatsappNumber,
      },
    });
  } catch (error) {
    console.error("[PATCH /api/user/notification-preferences] Error:", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}
