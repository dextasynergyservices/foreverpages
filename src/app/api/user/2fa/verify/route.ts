import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTOTPCode, verifyBackupCode } from "@/lib/two-factor";
import crypto from "crypto";

/**
 * POST /api/user/2fa/verify - Verify 2FA code during login
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, code, isBackupCode } = await req.json();

    if (!userId || !code) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Get user's 2FA settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorMethod: true,
        twoFactorSecret: true,
        backupCodes: true,
        email: true,
      },
    });

    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json({ message: "2FA not enabled" }, { status: 400 });
    }

    // Verify backup code
    if (isBackupCode) {
      if (!user.backupCodes || user.backupCodes.length === 0) {
        return NextResponse.json({ message: "No backup codes available" }, { status: 400 });
      }

      const { valid, usedIndex } = await verifyBackupCode(code, user.backupCodes);

      if (!valid) {
        return NextResponse.json({ message: "Invalid backup code" }, { status: 400 });
      }

      // Remove used backup code
      const updatedCodes = user.backupCodes.filter((_, index) => index !== usedIndex);
      await prisma.user.update({
        where: { id: userId },
        data: { backupCodes: updatedCodes },
      });

      // Create temporary session token for NextAuth
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute

      await prisma.verificationToken.create({
        data: {
          identifier: userId,
          token: sessionToken,
          code: "", // Not used for session tokens
          type: "TWO_FACTOR_SESSION",
          expires: expiresAt,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Backup code verified",
        remainingBackupCodes: updatedCodes.length,
        sessionToken,
      });
    }

    // Verify based on method
    if (user.twoFactorMethod === "AUTHENTICATOR") {
      if (!user.twoFactorSecret) {
        return NextResponse.json({ message: "2FA secret not found" }, { status: 500 });
      }

      const isValid = verifyTOTPCode(code, user.twoFactorSecret);

      if (!isValid) {
        return NextResponse.json({ message: "Invalid verification code" }, { status: 400 });
      }

      // Create temporary session token for NextAuth
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute

      await prisma.verificationToken.create({
        data: {
          identifier: userId,
          token: sessionToken,
          code: "", // Not used for session tokens
          type: "TWO_FACTOR_SESSION",
          expires: expiresAt,
        },
      });

      return NextResponse.json({ success: true, message: "Code verified", sessionToken });
    }

    if (user.twoFactorMethod === "EMAIL") {
      // Check verification token in database
      const verificationToken = await prisma.verificationToken.findFirst({
        where: {
          identifier: user.email,
          type: "TWO_FACTOR",
          code: code,
          expires: {
            gt: new Date(),
          },
          usedAt: null,
        },
      });

      if (!verificationToken) {
        return NextResponse.json(
          { message: "Invalid or expired verification code" },
          { status: 400 }
        );
      }

      // Mark token as used
      await prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      });

      // Create temporary session token for NextAuth
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute

      await prisma.verificationToken.create({
        data: {
          identifier: userId,
          token: sessionToken,
          code: "", // Not used for session tokens
          type: "TWO_FACTOR_SESSION",
          expires: expiresAt,
        },
      });

      return NextResponse.json({ success: true, message: "Code verified", sessionToken });
    }

    return NextResponse.json({ message: "Invalid 2FA method" }, { status: 400 });
  } catch (error) {
    console.error("2FA verification error:", error);
    return NextResponse.json({ message: "Failed to verify code" }, { status: 500 });
  }
}
