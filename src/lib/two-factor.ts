import { authenticator } from "otplib";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Configure TOTP settings
authenticator.options = {
  step: 30, // 30 seconds time window
  window: 1, // Allow 1 step before/after for clock skew
};

/**
 * Generate a new TOTP secret for authenticator apps
 */
export function generateTOTPSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate a QR code URL for authenticator app setup
 */
export async function generateQRCode(email: string, secret: string): Promise<string> {
  const otpauthUrl = authenticator.keyuri(email, "ForeverPages", secret);
  return await QRCode.toDataURL(otpauthUrl);
}

/**
 * Verify a TOTP code from authenticator app
 */
export function verifyTOTPCode(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error("TOTP verification error:", error);
    return false;
  }
}

/**
 * Generate 8 backup codes for account recovery
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    // Generate 8-character alphanumeric code (easier to type)
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
  }
  return codes;
}

/**
 * Hash backup codes for secure storage
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const hashedCodes = await Promise.all(codes.map((code) => bcrypt.hash(code, 10)));
  return hashedCodes;
}

/**
 * Verify a backup code against hashed codes
 */
export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<{ valid: boolean; usedIndex: number }> {
  for (let i = 0; i < hashedCodes.length; i++) {
    const isValid = await bcrypt.compare(code, hashedCodes[i]);
    if (isValid) {
      return { valid: true, usedIndex: i };
    }
  }
  return { valid: false, usedIndex: -1 };
}

/**
 * Generate a 6-digit code for email 2FA
 */
export function generateEmailCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Verify an email 2FA code with time expiration
 */
export function verifyEmailCode(inputCode: string, storedCode: string, expiresAt: Date): boolean {
  if (new Date() > expiresAt) {
    return false; // Code expired
  }
  return inputCode === storedCode;
}
