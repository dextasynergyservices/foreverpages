import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import {
  generateTOTPSecret,
  generateQRCode,
  verifyTOTPCode,
  generateBackupCodes,
  hashBackupCodes,
} from "@/lib/two-factor";

/**
 * GET /api/user/2fa/status - Get current 2FA status
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        twoFactorEnabled: true,
        twoFactorMethod: true,
        backupCodes: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      enabled: user.twoFactorEnabled,
      method: user.twoFactorMethod,
      hasBackupCodes: user.backupCodes && user.backupCodes.length > 0,
      backupCodesCount: user.backupCodes?.length || 0,
    });
  } catch (error) {
    console.error("2FA status error:", error);
    return NextResponse.json({ message: "Failed to get 2FA status" }, { status: 500 });
  }
}

/**
 * POST /api/user/2fa/enable/email - Enable email-based 2FA
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { action, method, code, secret } = await req.json();

    // Enable Email 2FA
    if (action === "enable" && method === "email") {
      // Generate backup codes
      const backupCodes = generateBackupCodes();
      const hashedBackupCodes = await hashBackupCodes(backupCodes);

      // Update user
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          twoFactorEnabled: true,
          twoFactorMethod: "EMAIL",
          backupCodes: hashedBackupCodes,
        },
      });

      return NextResponse.json({
        message: "Email 2FA enabled successfully",
        backupCodes, // Return plain text codes ONCE for user to save
      });
    }

    // Enable Authenticator 2FA - Step 1: Generate secret
    if (action === "setup" && method === "authenticator") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true },
      });

      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }

      const totpSecret = generateTOTPSecret();
      const qrCode = await generateQRCode(user.email, totpSecret);

      // Store secret temporarily (will be confirmed after verification)
      await prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorSecret: totpSecret },
      });

      return NextResponse.json({
        message: "Scan QR code with your authenticator app",
        qrCode,
        secret: totpSecret, // Manual entry option
      });
    }

    // Enable Authenticator 2FA - Step 2: Verify and enable
    if (action === "enable" && method === "authenticator" && code && secret) {
      const isValid = verifyTOTPCode(code, secret);

      if (!isValid) {
        return NextResponse.json({ message: "Invalid verification code" }, { status: 400 });
      }

      // Generate backup codes
      const backupCodes = generateBackupCodes();
      const hashedBackupCodes = await hashBackupCodes(backupCodes);

      // Enable 2FA
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          twoFactorEnabled: true,
          twoFactorMethod: "AUTHENTICATOR",
          twoFactorSecret: secret,
          backupCodes: hashedBackupCodes,
        },
      });

      return NextResponse.json({
        message: "Authenticator 2FA enabled successfully",
        backupCodes,
      });
    }

    // Disable 2FA
    if (action === "disable") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorMethod: null,
          twoFactorSecret: null,
          backupCodes: [],
        },
      });

      return NextResponse.json({ message: "2FA disabled successfully" });
    }

    // Regenerate backup codes
    if (action === "regenerate-backup-codes") {
      const backupCodes = generateBackupCodes();
      const hashedBackupCodes = await hashBackupCodes(backupCodes);

      await prisma.user.update({
        where: { id: session.user.id },
        data: { backupCodes: hashedBackupCodes },
      });

      return NextResponse.json({
        message: "Backup codes regenerated",
        backupCodes,
      });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("2FA enable error:", error);
    return NextResponse.json({ message: "Failed to modify 2FA settings" }, { status: 500 });
  }
}
