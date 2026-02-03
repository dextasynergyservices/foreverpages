/**
 * Change Password API
 * POST /api/user/change-password
 *
 * Allows authenticated users to change their password
 * Requires current password verification for security
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validation";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // ============================================
    // 1. VERIFY USER IS AUTHENTICATED
    // ============================================
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Please log in first.",
        },
        { status: 401 }
      );
    }

    // ============================================
    // 2. PARSE AND VALIDATE INPUT
    // ============================================
    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body);

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

    const { currentPassword, newPassword } = validation.data;

    // ============================================
    // 3. GET USER FROM DATABASE
    // ============================================
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found.",
        },
        { status: 404 }
      );
    }

    // ============================================
    // 4. VERIFY CURRENT PASSWORD
    // ============================================
    if (!user.password) {
      // User signed up with OAuth (Google, etc.) and has no password
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot change password for accounts using social login. Please use your social provider to manage your password.",
        },
        { status: 400 }
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      console.log(`⚠️ Invalid current password attempt for user: ${user.email}`);
      return NextResponse.json(
        {
          success: false,
          error: "Current password is incorrect.",
        },
        { status: 400 }
      );
    }

    // ============================================
    // 5. CHECK NEW PASSWORD IS DIFFERENT
    // ============================================
    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      return NextResponse.json(
        {
          success: false,
          error: "New password must be different from your current password.",
        },
        { status: 400 }
      );
    }

    // ============================================
    // 6. HASH AND UPDATE PASSWORD
    // ============================================
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Password changed successfully for: ${user.email}`);

    // ============================================
    // 7. RETURN SUCCESS RESPONSE
    // ============================================
    return NextResponse.json(
      {
        success: true,
        message: "Password changed successfully.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Change password error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}
