/**
 * Resend Email Verification
 * POST /api/auth/verify-email/resend
 *
 * Resends verification email with rate limiting
 * Rate limit: Max 3 attempts per hour
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateVerificationCode,
  generateVerificationToken,
  getVerificationExpiry,
} from "@/lib/verification-utils";
import { sendVerificationEmail } from "@/lib/email-service";
import { sendWhatsAppVerification } from "@/lib/whatsapp-service";

// Rate limiting constants
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_HOURS = 1;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // ============================================
    // 1. VALIDATE EMAIL PROVIDED
    // ============================================
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Email is required",
        },
        { status: 400 }
      );
    }

    // ============================================
    // 2. FIND USER BY EMAIL
    // ============================================
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists (security best practice)
      return NextResponse.json(
        {
          success: true,
          message: "If this email exists, a verification code has been sent.",
        },
        { status: 200 }
      );
    }

    // ============================================
    // 3. CHECK IF ALREADY VERIFIED
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
    // 4. RATE LIMITING CHECK
    // ============================================
    const rateLimitWindow = new Date();
    rateLimitWindow.setHours(rateLimitWindow.getHours() - RATE_LIMIT_WINDOW_HOURS);

    // Check if user exceeded rate limit
    if (user.verificationAttempts >= MAX_ATTEMPTS) {
      // Check when last attempt was made
      if (user.lastVerificationSentAt && user.lastVerificationSentAt > rateLimitWindow) {
        const timeUntilReset = new Date(user.lastVerificationSentAt);
        timeUntilReset.setHours(timeUntilReset.getHours() + RATE_LIMIT_WINDOW_HOURS);

        return NextResponse.json(
          {
            success: false,
            error: `Too many requests. Please try again later.`,
            retryAfter: timeUntilReset,
            attemptsRemaining: 0,
          },
          { status: 429 }
        );
      } else {
        // Rate limit window has passed, reset attempts
        await prisma.user.update({
          where: { id: user.id },
          data: {
            verificationAttempts: 0,
          },
        });
      }
    }

    // ============================================
    // 5. GENERATE NEW VERIFICATION CODES
    // ============================================
    const verificationCode = generateVerificationCode();
    const verificationToken = generateVerificationToken();
    const expiresAt = getVerificationExpiry(15); // 15 minutes

    // ============================================
    // 6. DATABASE TRANSACTION
    // ============================================
    await prisma.$transaction(async (tx) => {
      // Invalidate all old tokens for this email
      await tx.verificationToken.updateMany({
        where: {
          identifier: email.toLowerCase(),
          type: "EMAIL_VERIFICATION",
          usedAt: null, // Only invalidate unused tokens
        },
        data: {
          usedAt: new Date(), // Mark as used to invalidate
        },
      });

      // Create new verification token
      await tx.verificationToken.create({
        data: {
          identifier: email.toLowerCase(),
          token: verificationToken,
          code: verificationCode,
          type: "EMAIL_VERIFICATION",
          expires: expiresAt,
        },
      });

      // Update user - increment attempts and update timestamp
      await tx.user.update({
        where: { id: user.id },
        data: {
          verificationAttempts: {
            increment: 1,
          },
          lastVerificationSentAt: new Date(),
        },
      });

      // Create activity log
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "UPDATED",
          entityType: "User",
          entityId: user.id,
          description: "Verification code resent",
          metadata: {
            attemptNumber: user.verificationAttempts + 1,
            maxAttempts: MAX_ATTEMPTS,
          },
        },
      });
    });

    // ============================================
    // 7. SEND NEW VERIFICATION EMAIL
    // ============================================
    try {
      await sendVerificationEmail(email, user.name || "User", verificationCode, verificationToken);
      console.log(`✅ Verification email resent to: ${email}`);
    } catch (emailError) {
      console.error("❌ Failed to resend verification email:", emailError);
      // Don't fail the request if email fails
    }

    // ============================================
    // 8. SEND WHATSAPP VERIFICATION (if phone exists)
    // ============================================
    if (user.phone) {
      try {
        await sendWhatsAppVerification(user.phone, verificationCode, user.name || "User");
        console.log(`✅ WhatsApp verification resent to: ${user.phone}`);
      } catch (whatsappError) {
        console.error("❌ Failed to resend WhatsApp verification:", whatsappError);
        // Don't fail the request if WhatsApp fails
      }
    }

    // ============================================
    // 9. RETURN SUCCESS RESPONSE
    // ============================================
    const attemptsRemaining = MAX_ATTEMPTS - (user.verificationAttempts + 1);

    return NextResponse.json(
      {
        success: true,
        message: "Verification code sent successfully!",
        verificationSent: {
          email: true,
          whatsapp: !!user.phone,
        },
        rateLimit: {
          attemptsRemaining,
          maxAttempts: MAX_ATTEMPTS,
          windowHours: RATE_LIMIT_WINDOW_HOURS,
        },
        expiresAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Resend verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during resend",
      },
      { status: 500 }
    );
  }
}
