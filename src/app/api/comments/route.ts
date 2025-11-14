import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      memorialId,
      content,
      type = "GENERAL",
      authorName,
      authorEmail,
      language = "en",
    } = body;

    // Validation
    if (!memorialId) {
      return NextResponse.json({ error: "Memorial ID is required" }, { status: 400 });
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: "Message is too long (max 5000 characters)" },
        { status: 400 }
      );
    }

    // Validate message type
    const validTypes = ["GENERAL", "CONDOLENCE", "MEMORY", "TRIBUTE", "APPRECIATION"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid message type" }, { status: 400 });
    }

    // Verify memorial exists and get owner info
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        ownerId: true,
        moderateComments: true,
        allowComments: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!memorial) {
      return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
    }

    // Check if comments are allowed
    if (!memorial.allowComments) {
      return NextResponse.json(
        { error: "Comments are not enabled for this memorial" },
        { status: 403 }
      );
    }

    // Determine if comment should be auto-approved
    const isApproved = !memorial.moderateComments;

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        type: type as "GENERAL" | "CONDOLENCE" | "MEMORY" | "TRIBUTE" | "APPRECIATION",
        authorName: authorName || null,
        authorEmail: authorEmail || null,
        language,
        isApproved,
        memorialId,
      },
      select: {
        id: true,
        content: true,
        type: true,
        authorName: true,
        isApproved: true,
        createdAt: true,
      },
    });

    // Send notification email to memorial owner
    if (memorial.owner.email) {
      try {
        const typeLabel = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
        const memorialName = `${memorial.firstName} ${memorial.lastName}`;
        const statusText = isApproved ? "has been posted" : "is awaiting approval";

        await sendEmail({
          to: memorial.owner.email,
          subject: `New ${typeLabel} on ${memorialName}'s Memorial`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: #fff; margin: 0; font-size: 24px;">New ${typeLabel}</h1>
              </div>

              <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                  A new ${typeLabel.toLowerCase()} ${statusText} on <strong>${memorialName}'s</strong> memorial page.
                </p>

                ${authorName ? `<p style="color: #666; margin-bottom: 10px;"><strong>From:</strong> ${authorName}</p>` : ""}
                ${authorEmail ? `<p style="color: #666; margin-bottom: 20px;"><strong>Email:</strong> ${authorEmail}</p>` : ""}

                <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.6;">
                    "${content.trim()}"
                  </p>
                </div>

                ${
                  !isApproved
                    ? `
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #92400e; font-weight: 600;">
                    ⏳ This message requires your approval before it will be visible
                  </p>
                </div>
                `
                    : ""
                }

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://foreverpages.online"}/user-dashboard/memorials/${memorial.id}" style="background: #667eea; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                    ${isApproved ? "View Message" : "Review & Approve"}
                  </a>
                </div>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />

                <p style="color: #999; font-size: 12px; text-align: center;">
                  ForeverPages - Preserve memories, forever.
                </p>
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
        // Don't fail the comment creation if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: isApproved
        ? "Your message has been posted successfully"
        : "Your message has been submitted and is awaiting approval",
      data: {
        comment,
      },
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
