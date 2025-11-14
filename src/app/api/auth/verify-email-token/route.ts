import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logEmailVerification } from "@/lib/activity-logger";

/**
 * GET /api/auth/verify-email-token?token=xxx
 * Verifies email verification token from the link sent to user
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");

    // Validate token exists
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid verification token. Please use the link from your email.",
        },
        { status: 400 }
      );
    }

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
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

    // Check if token exists
    if (!verificationToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired verification token. Please request a new one.",
        },
        { status: 404 }
      );
    }

    // Check if token is already used
    if (verificationToken.usedAt) {
      return NextResponse.json(
        {
          success: false,
          error: "This verification link has already been used.",
        },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > verificationToken.expires) {
      return NextResponse.json(
        {
          success: false,
          error: "This verification link has expired. Please request a new one.",
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
          description: "Email verified via verification link",
          metadata: {
            verificationMethod: "LINK",
            email: verificationToken.user?.email,
          },
        },
      });
    });

    console.log(`✅ Email verified for user: ${verificationToken.user?.email}`);

    // Log to activity logger (async, non-blocking)
    logEmailVerification({
      userId: verificationToken.userId!,
      email: verificationToken.user?.email || "",
      method: "LINK",
    }).catch((err) => console.error("Failed to log email verification:", err));

    return NextResponse.json({
      success: true,
      message: "Email verified successfully! You can now login.",
    });
  } catch (error) {
    console.error("❌ Email verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred during verification. Please try again.",
      },
      { status: 500 }
    );
  }
}
