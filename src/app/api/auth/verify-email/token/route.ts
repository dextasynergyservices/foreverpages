/**
 * Email Verification via Token (Link Method)
 * POST /api/auth/verify-email/token
 *
 * Verifies email using UUID token from email link
 * One-click verification for user convenience
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    // ============================================
    // 1. VALIDATE TOKEN PROVIDED
    // ============================================
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Verification token is required",
        },
        { status: 400 }
      );
    }

    // ============================================
    // 2. FIND VERIFICATION TOKEN
    // ============================================
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid verification token. Token not found.",
        },
        { status: 404 }
      );
    }

    // ============================================
    // 3. CHECK TOKEN TYPE
    // ============================================
    if (verificationToken.type !== "EMAIL_VERIFICATION") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid token type. This token is not for email verification.",
        },
        { status: 400 }
      );
    }

    // ============================================
    // 4. CHECK TOKEN NOT ALREADY USED
    // ============================================
    if (verificationToken.usedAt) {
      return NextResponse.json(
        {
          success: false,
          error: "Token already used. Please request a new verification email.",
        },
        { status: 400 }
      );
    }

    // ============================================
    // 5. CHECK TOKEN NOT EXPIRED (15 min limit)
    // ============================================
    const now = new Date();
    if (now > verificationToken.expires) {
      return NextResponse.json(
        {
          success: false,
          error: "Token expired. Please request a new verification email.",
          expiredAt: verificationToken.expires,
        },
        { status: 400 }
      );
    }

    // ============================================
    // 6. FIND USER BY EMAIL
    // ============================================
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
      include: {
        currentPlan: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found. Please register again.",
        },
        { status: 404 }
      );
    }

    // ============================================
    // 7. CHECK IF ALREADY VERIFIED
    // ============================================
    if (user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "Email already verified. You can proceed to login.",
        },
        { status: 400 }
      );
    }

    // ============================================
    // 8. DATABASE TRANSACTION - VERIFY EMAIL
    // ============================================
    const result = await prisma.$transaction(async (tx) => {
      // Update user - mark email as verified
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: now,
          verificationMethod: "LINK",
        },
      });

      // Mark token as used
      await tx.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: now },
      });

      // Create activity log
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "UPDATED",
          entityType: "User",
          entityId: user.id,
          description: "Email verified successfully via link",
          metadata: {
            verificationMethod: "LINK",
            tokenId: verificationToken.id,
          },
        },
      });

      return updatedUser;
    });

    // ============================================
    // 9. SEND WELCOME EMAIL
    // ============================================
    try {
      await sendWelcomeEmail(result.email, result.name || "User");
      console.log(`✅ Welcome email sent to: ${result.email}`);
    } catch (emailError) {
      console.error("❌ Failed to send welcome email:", emailError);
      // Don't fail verification if welcome email fails
    }

    // ============================================
    // 10. RETURN SUCCESS RESPONSE
    // ============================================
    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully! Welcome to ForeverPages.",
        user: {
          id: result.id,
          email: result.email,
          name: result.name,
          emailVerified: result.emailVerified,
          verificationMethod: result.verificationMethod,
          plan: user.currentPlan,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Email verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during email verification",
      },
      { status: 500 }
    );
  }
}
