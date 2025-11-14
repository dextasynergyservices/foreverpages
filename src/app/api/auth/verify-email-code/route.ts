import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logEmailVerification } from "@/lib/activity-logger";

/**
 * POST /api/auth/verify-email-code
 * Verifies the 6-digit email verification code
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;

    // Validate code format
    if (!code || typeof code !== "string" || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid verification code. Please enter a 6-digit code.",
        },
        { status: 400 }
      );
    }

    // Find the verification token with this code
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        code: code,
        type: "EMAIL_VERIFICATION",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            emailVerified: true,
          },
        },
      },
    });

    // Check if code exists
    if (!verificationToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid verification code. Please check and try again.",
        },
        { status: 404 }
      );
    }

    // Check if code is already used
    if (verificationToken.usedAt) {
      return NextResponse.json(
        {
          success: false,
          error: "This verification code has already been used.",
        },
        { status: 400 }
      );
    }

    // Check if code is expired
    if (new Date() > verificationToken.expires) {
      return NextResponse.json(
        {
          success: false,
          error: "This verification code has expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // Verify the user's email
    await prisma.$transaction(async (tx) => {
      // Update user's emailVerified field
      await tx.user.update({
        where: { id: verificationToken.userId! },
        data: { emailVerified: new Date() },
      });

      // Mark the token as used
      await tx.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: verificationToken.userId!,
          action: "UPDATED",
          entityType: "User",
          entityId: verificationToken.userId!,
          description: "Email verified via 6-digit code",
          metadata: {
            verificationMethod: "CODE",
            email: verificationToken.user?.email,
          },
        },
      });
    });

    console.log(`✅ Email verified via code for user: ${verificationToken.user?.email}`);

    // Log to activity logger (async, non-blocking)
    logEmailVerification({
      userId: verificationToken.userId!,
      email: verificationToken.user?.email || "",
      method: "CODE",
    }).catch((err) => console.error("Failed to log email verification:", err));

    return NextResponse.json({
      success: true,
      message: "Email verified successfully! You can now login.",
    });
  } catch (error) {
    console.error("❌ Email code verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred during verification. Please try again.",
      },
      { status: 500 }
    );
  }
}
