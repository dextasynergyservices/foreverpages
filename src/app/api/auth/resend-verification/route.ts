import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import {
  generateVerificationCode,
  generateVerificationToken,
  getVerificationExpiry,
} from "@/lib/verification-utils";
import { sendVerificationEmail } from "@/lib/email-service";
import { sendWhatsAppVerification } from "@/lib/whatsapp-service";

/**
 * POST /api/auth/resend-verification
 * Resend email verification code to authenticated user
 */
export async function POST() {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Please login first.",
        },
        { status: 401 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "Email is already verified.",
        },
        { status: 400 }
      );
    }

    // Rate limiting: Check last verification sent time
    if (user.lastVerificationSentAt) {
      const timeSinceLastSent = Date.now() - user.lastVerificationSentAt.getTime();
      const oneMinute = 60 * 1000;

      if (timeSinceLastSent < oneMinute) {
        const secondsRemaining = Math.ceil((oneMinute - timeSinceLastSent) / 1000);
        return NextResponse.json(
          {
            success: false,
            error: `Please wait ${secondsRemaining} seconds before requesting another verification code.`,
          },
          { status: 429 }
        );
      }
    }

    // Generate new verification code and token
    const verificationCode = generateVerificationCode();
    const verificationToken = generateVerificationToken();
    const verificationExpiresAt = getVerificationExpiry(15); // 15 minutes

    // Invalidate old tokens and create new one
    await prisma.$transaction(async (tx) => {
      // Mark old tokens as used
      await tx.verificationToken.updateMany({
        where: {
          userId: user.id,
          type: "EMAIL_VERIFICATION",
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });

      // Create new verification token
      await tx.verificationToken.create({
        data: {
          userId: user.id,
          identifier: user.email,
          token: verificationToken,
          code: verificationCode,
          type: "EMAIL_VERIFICATION",
          expires: verificationExpiresAt,
        },
      });

      // Update user's lastVerificationSentAt
      await tx.user.update({
        where: { id: user.id },
        data: {
          lastVerificationSentAt: new Date(),
          verificationAttempts: {
            increment: 1,
          },
        },
      });
    });

    // Send verification email
    try {
      await sendVerificationEmail(
        user.email,
        user.name || "User",
        verificationCode,
        verificationToken
      );
      console.log(`✅ Verification email resent to: ${user.email}`);
    } catch (emailError) {
      console.error("❌ Failed to send verification email:", emailError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send verification email. Please try again.",
        },
        { status: 500 }
      );
    }

    // Send WhatsApp verification (if phone exists)
    if (user.phone) {
      try {
        await sendWhatsAppVerification(user.phone, verificationCode, user.name || "User");
        console.log(`✅ WhatsApp verification resent to: ${user.phone}`);
      } catch (whatsappError) {
        console.error("❌ Failed to send WhatsApp verification:", whatsappError);
        // Don't fail the request if WhatsApp fails
      }
    }

    // Fetch updated user to get current attempt count
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { verificationAttempts: true },
    });

    // Calculate attempts remaining (max 5 per session)
    const maxAttempts = 5;
    const attemptsRemaining = Math.max(0, maxAttempts - (updatedUser?.verificationAttempts || 0));

    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully. Check your email and WhatsApp.",
      attemptsRemaining,
    });
  } catch (error) {
    console.error("❌ Resend verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}
