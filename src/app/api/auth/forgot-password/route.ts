/**
 * Forgot Password API
 * POST /api/auth/forgot-password
 *
 * Sends a password reset email with a secure token
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email-service";
import { resetPasswordSchema } from "@/lib/validation";
import crypto from "crypto";

// Rate limiting: Max 3 password reset requests per hour per email
const MAX_REQUESTS_PER_HOUR = 3;

/**
 * Generate a secure reset token
 */
function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // ============================================
    // 1. VALIDATE EMAIL WITH ZOD SCHEMA
    // ============================================
    const validation = resetPasswordSchema.safeParse({ email });

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || "Invalid email";
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 400 }
      );
    }

    const normalizedEmail = validation.data.email.toLowerCase().trim();

    // ============================================
    // 2. FIND USER BY EMAIL
    // ============================================
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      console.log(`⚠️ Password reset requested for non-existent email: ${normalizedEmail}`);
      return NextResponse.json(
        {
          success: true,
          message: "If an account exists with this email, you will receive a password reset link.",
        },
        { status: 200 }
      );
    }

    // ============================================
    // 3. RATE LIMITING CHECK
    // ============================================
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentRequests = await prisma.verificationToken.count({
      where: {
        identifier: normalizedEmail,
        type: "PASSWORD_RESET",
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (recentRequests >= MAX_REQUESTS_PER_HOUR) {
      console.log(`⚠️ Rate limit exceeded for password reset: ${normalizedEmail}`);
      return NextResponse.json(
        {
          success: false,
          error: "Too many password reset requests. Please try again in an hour.",
        },
        { status: 429 }
      );
    }

    // ============================================
    // 4. INVALIDATE OLD RESET TOKENS
    // ============================================
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: normalizedEmail,
        type: "PASSWORD_RESET",
      },
    });

    // ============================================
    // 5. CREATE NEW RESET TOKEN
    // ============================================
    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: resetToken,
        code: "000000", // Not used for password reset, but required by schema
        type: "PASSWORD_RESET",
        expires: expiresAt,
        userId: user.id,
      },
    });

    console.log(`✅ Password reset token created for: ${normalizedEmail}`);

    // ============================================
    // 6. SEND PASSWORD RESET EMAIL
    // ============================================
    try {
      const result = await sendPasswordResetEmail(normalizedEmail, user.name || "User", resetToken);

      if (!result.success) {
        console.error(
          `❌ Failed to send password reset email to ${normalizedEmail}:`,
          result.error
        );
        return NextResponse.json(
          {
            success: false,
            error: "Failed to send password reset email. Please try again.",
          },
          { status: 500 }
        );
      }

      console.log(`✅ Password reset email sent to: ${normalizedEmail}`);
    } catch (emailError) {
      console.error(`❌ Error sending password reset email:`, emailError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send password reset email. Please try again.",
        },
        { status: 500 }
      );
    }

    // ============================================
    // 7. RETURN SUCCESS RESPONSE
    // ============================================
    return NextResponse.json(
      {
        success: true,
        message: "If an account exists with this email, you will receive a password reset link.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}
