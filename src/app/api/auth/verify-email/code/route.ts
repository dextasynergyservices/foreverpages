/**
 * Email Verification via Code (6-Digit Method)
 * POST /api/auth/verify-email/code
 *
 * Verifies email using 6-digit code sent via email/WhatsApp
 * User types code into verification form
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // ============================================
    // 1. VALIDATE INPUTS
    // ============================================
    if (!email || !code) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and verification code are required",
        },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid code format. Code must be 6 digits.",
        },
        { status: 400 }
      );
    }

    // ============================================
    // 2. FIND VERIFICATION TOKEN BY EMAIL & CODE
    // ============================================
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email.toLowerCase(),
        code: code,
        type: "EMAIL_VERIFICATION",
      },
      orderBy: {
        createdAt: "desc", // Get the most recent token
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid verification code. Please check your code and try again.",
        },
        { status: 404 }
      );
    }

    // ============================================
    // 3. CHECK TOKEN NOT ALREADY USED
    // ============================================
    if (verificationToken.usedAt) {
      return NextResponse.json(
        {
          success: false,
          error: "Code already used. Please request a new verification code.",
        },
        { status: 400 }
      );
    }

    // ============================================
    // 4. CHECK TOKEN NOT EXPIRED (15 min limit)
    // ============================================
    const now = new Date();
    if (now > verificationToken.expires) {
      return NextResponse.json(
        {
          success: false,
          error: "Code expired. Please request a new verification code.",
          expiredAt: verificationToken.expires,
        },
        { status: 400 }
      );
    }

    // ============================================
    // 5. FIND USER BY EMAIL
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
    // 6. CHECK IF ALREADY VERIFIED
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
    // 7. DATABASE TRANSACTION - VERIFY EMAIL
    // ============================================
    const result = await prisma.$transaction(async (tx) => {
      // Update user - mark email as verified
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: now,
          verificationMethod: "CODE",
          verificationAttempts: 0, // Reset attempts after successful verification
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
          description: "Email verified successfully via 6-digit code",
          metadata: {
            verificationMethod: "CODE",
            tokenId: verificationToken.id,
            code: code,
          },
        },
      });

      return updatedUser;
    });

    // ============================================
    // 8. SEND WELCOME EMAIL
    // ============================================
    try {
      await sendWelcomeEmail(result.email, result.name || "User");
      console.log(`✅ Welcome email sent to: ${result.email}`);
    } catch (emailError) {
      console.error("❌ Failed to send welcome email:", emailError);
      // Don't fail verification if welcome email fails
    }

    // ============================================
    // 9. RETURN SUCCESS RESPONSE
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
