import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { addDays } from "date-fns";
import {
  generateInvitationEmailHTML,
  generateInvitationEmailSubject,
} from "@/lib/emailTemplates/invitationEmail";
import { sendEmail } from "@/lib/email";
import { sendInvitationWhatsApp } from "@/lib/whatsapp";

const bulkResendSchema = z.object({
  invitationIds: z.array(z.string()).min(1, "At least one invitation is required"),
  extendExpiration: z.boolean().optional().default(true),
  expirationDays: z.number().int().min(1).max(90).optional().default(14),
});

interface ResendResult {
  invitationId: string;
  success: boolean;
  error?: string;
  email?: string;
  phone?: string;
}

/**
 * POST: Bulk resend invitations
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bulkResendSchema.parse(body);

    const { invitationIds, extendExpiration, expirationDays } = validatedData;

    // Fetch all invitations that belong to the user
    const invitations = await prisma.invitation.findMany({
      where: {
        id: { in: invitationIds },
        memorial: {
          ownerId: session.user.id,
        },
        status: { in: ["PENDING", "EXPIRED"] },
      },
      include: {
        memorial: {
          select: {
            id: true,
            slug: true,
            firstName: true,
            lastName: true,
            ownerId: true,
          },
        },
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (invitations.length === 0) {
      return NextResponse.json(
        {
          error: "No valid invitations found",
          message:
            "The selected invitations may have already been accepted or you don't have permission to resend them.",
        },
        { status: 404 }
      );
    }

    const results: ResendResult[] = [];

    // Process each invitation
    for (const invitation of invitations) {
      try {
        // Calculate new expiration date
        const newExpiresAt = extendExpiration
          ? addDays(new Date(), expirationDays)
          : invitation.expiresAt;

        // Update invitation status and expiration
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: {
            status: "PENDING",
            expiresAt: newExpiresAt,
          },
        });

        // Build names for notifications
        const deceasedName =
          `${invitation.memorial.firstName || ""} ${invitation.memorial.lastName || ""}`.trim();
        const inviterName = invitation.invitedBy?.name || "Someone";

        // Send email notification if email is provided
        if (invitation.email) {
          try {
            const emailHTML = generateInvitationEmailHTML({
              recipientName: invitation.name || "Guest",
              recipientEmail: invitation.email,
              inviterName,
              memorialName: deceasedName,
              memorialId: invitation.memorialId,
              role: invitation.role,
              token: invitation.token,
              expiresAt: newExpiresAt?.toISOString() || "",
              message: `Reminder: Your invitation to view this memorial is still pending.`,
            });

            const emailSubject = generateInvitationEmailSubject(
              inviterName,
              deceasedName,
              `Reminder: You're invited to ${deceasedName}'s memorial`
            );

            await sendEmail({
              to: invitation.email,
              subject: emailSubject,
              html: emailHTML,
            });
          } catch (emailError) {
            console.error(`Failed to send email to ${invitation.email}:`, emailError);
          }
        }

        // Send WhatsApp notification if phone is provided
        if (invitation.phone) {
          try {
            await sendInvitationWhatsApp({
              recipientPhone: invitation.phone,
              recipientName: invitation.name || "Guest",
              inviterName,
              memorialName: deceasedName,
              role: invitation.role,
              token: invitation.token,
              expiresAt: newExpiresAt?.toISOString() || "",
            });
          } catch (whatsappError) {
            console.error(`Failed to send WhatsApp to ${invitation.phone}:`, whatsappError);
          }
        }

        results.push({
          invitationId: invitation.id,
          success: true,
          email: invitation.email || undefined,
          phone: invitation.phone || undefined,
        });
      } catch (error) {
        console.error(`Failed to resend invitation ${invitation.id}:`, error);
        results.push({
          invitationId: invitation.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          email: invitation.email || undefined,
          phone: invitation.phone || undefined,
        });
      }
    }

    // Calculate summary statistics
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Successfully resent ${successful} invitation${successful !== 1 ? "s" : ""}${failed > 0 ? `, ${failed} failed` : ""}`,
      summary: {
        total: results.length,
        successful,
        failed,
        requested: invitationIds.length,
        skipped: invitationIds.length - invitations.length,
      },
      results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error bulk resending invitations:", error);
    return NextResponse.json({ error: "Failed to bulk resend invitations" }, { status: 500 });
  }
}
