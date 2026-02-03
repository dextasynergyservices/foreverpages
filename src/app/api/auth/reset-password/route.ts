/**
 * Reset Password API
 * POST /api/auth/reset-password
 *
 * Resets user's password using a valid reset token
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Password validation schema - must match the one in validation.ts
const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters long")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");

const resetPasswordInputSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    // ============================================
    // 1. VALIDATE INPUT WITH ZOD SCHEMA
    // ============================================
    const validation = resetPasswordInputSchema.safeParse({ token, password });

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || "Invalid input";
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 400 }
      );
    }

    // ============================================
    // 2. FIND AND VALIDATE RESET TOKEN
    // ============================================
    const resetToken = await prisma.verificationToken.findFirst({
      where: {
        token: token,
        type: "PASSWORD_RESET",
        usedAt: null, // Token hasn't been used
        expires: {
          gt: new Date(), // Token hasn't expired
        },
      },
      include: {
        user: true,
      },
    });

    if (!resetToken) {
      console.log(`⚠️ Invalid or expired reset token attempted`);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired reset link. Please request a new password reset.",
        },
        { status: 400 }
      );
    }

    // ============================================
    // 3. GET USER FROM TOKEN
    // ============================================
    const user =
      resetToken.user ||
      (await prisma.user.findUnique({
        where: { email: resetToken.identifier },
      }));

    if (!user) {
      console.log(`⚠️ User not found for reset token: ${resetToken.identifier}`);
      return NextResponse.json(
        {
          success: false,
          error: "User not found. Please contact support.",
        },
        { status: 404 }
      );
    }

    // ============================================
    // 4. HASH NEW PASSWORD
    // ============================================
    const hashedPassword = await bcrypt.hash(password, 12);

    // ============================================
    // 5. UPDATE USER PASSWORD AND MARK TOKEN AS USED
    // ============================================
    await prisma.$transaction([
      // Update user's password
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }),
      // Mark token as used
      prisma.verificationToken.update({
        where: { id: resetToken.id },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);

    console.log(`✅ Password reset successful for: ${user.email}`);

    // ============================================
    // 6. INVALIDATE ALL OTHER RESET TOKENS FOR THIS USER
    // ============================================
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: user.email!,
        type: "PASSWORD_RESET",
        id: {
          not: resetToken.id,
        },
      },
    });

    // ============================================
    // 7. RETURN SUCCESS RESPONSE
    // ============================================
    return NextResponse.json(
      {
        success: true,
        message: "Password has been reset successfully. You can now log in with your new password.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Reset password error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}
