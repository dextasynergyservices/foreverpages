import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateEmailCode } from "@/lib/two-factor";
import { sendEmail } from "@/lib/email";

/**
 * POST /api/user/2fa/send-code - Send 2FA code via email
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Verify user has email 2FA enabled
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        twoFactorEnabled: true,
        twoFactorMethod: true,
        name: true,
      },
    });

    if (!user || !user.twoFactorEnabled || user.twoFactorMethod !== "EMAIL") {
      return NextResponse.json({ message: "Email 2FA not enabled" }, { status: 400 });
    }

    if (user.email !== email) {
      return NextResponse.json({ message: "Email mismatch" }, { status: 400 });
    }

    // Generate 6-digit code
    const code = generateEmailCode();

    // Store in database (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: `2fa-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        code: code,
        type: "TWO_FACTOR",
        expires: expiresAt,
        userId: userId,
      },
    });

    // Send email
    await sendEmail({
      to: email,
      subject: "Your ForeverPages 2FA Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Two-Factor Authentication</h2>
          <p>Hello ${user.name || "there"},</p>
          <p>Your verification code is:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px;">
            This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">
            ForeverPages - Preserve memories, forever.
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      message: "Verification code sent to your email",
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Send 2FA code error:", error);
    return NextResponse.json({ message: "Failed to send verification code" }, { status: 500 });
  }
}
