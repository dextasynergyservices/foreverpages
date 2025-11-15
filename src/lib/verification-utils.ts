/**
 * Verification Utilities
 *
 * Generate and validate verification codes and tokens
 * for email and WhatsApp verification
 */

import crypto from "crypto";

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  // Generate random number between 100000 and 999999
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString();
}

/**
 * Generate a secure random token for email verification links
 */
export function generateVerificationToken(): string {
  // Generate 32 bytes of random data and convert to hex string
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate a secure password reset token
 */
export function generatePasswordResetToken(): string {
  // Generate 32 bytes of random data and convert to hex string
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a verification code for secure storage
 * (optional - if you want to hash codes before storing)
 */
export function hashVerificationCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/**
 * Verify a hashed code
 */
export function verifyHashedCode(code: string, hashedCode: string): boolean {
  const codeHash = hashVerificationCode(code);
  return codeHash === hashedCode;
}

/**
 * Calculate token expiry time
 * Default: 24 hours for email verification
 */
export function getVerificationExpiry(hours = 24): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry;
}

/**
 * Calculate password reset token expiry time
 * Default: 1 hour for password reset
 */
export function getPasswordResetExpiry(hours = 1): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry;
}

/**
 * Check if a token/code has expired
 */
export function isExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}

/**
 * Generate a random session ID for payment tracking
 */
export function generatePaymentSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(16).toString("hex");
  return `pay_${timestamp}_${randomStr}`;
}

/**
 * Generate a reference for Paystack transactions
 * Format: FP-{timestamp}-{random}
 */
export function generatePaystackReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `FP-${timestamp}-${random}`;
}

/**
 * Validate verification code format
 */
export function isValidVerificationCode(code: string): boolean {
  // Must be exactly 6 digits
  return /^\d{6}$/.test(code);
}

/**
 * Validate token format (hex string)
 */
export function isValidToken(token: string): boolean {
  // Must be 64 characters hex string (32 bytes)
  return /^[a-f0-9]{64}$/i.test(token);
}

/**
 * Generate a unique order ID
 */
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(6).toString("hex").toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

/**
 * Mask email for privacy (show first 3 chars and domain)
 * Example: user@example.com -> use***@example.com
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!domain) return email;

  const visibleChars = Math.min(3, localPart.length);
  const maskedLocal = localPart.substring(0, visibleChars) + "***";

  return `${maskedLocal}@${domain}`;
}

/**
 * Mask phone number for privacy (show last 4 digits)
 * Example: +2348012345678 -> ****5678
 */
export function maskPhoneNumber(phoneNumber: string): string {
  if (phoneNumber.length < 4) return phoneNumber;

  const lastFour = phoneNumber.slice(-4);
  return `****${lastFour}`;
}

/**
 * Generate a time-based one-time password (TOTP) - for future 2FA
 */
export function generateTOTP(secret: string, window = 0): string {
  const epoch = Math.floor(Date.now() / 1000);
  const time = Math.floor(epoch / 30) + window;

  const hmac = crypto.createHmac("sha1", secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(time));
  hmac.update(buffer);

  const hash = hmac.digest();
  const offset = hash[hash.length - 1] & 0xf;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = (binary % 1000000).toString().padStart(6, "0");
  return otp;
}

/**
 * Verify TOTP code
 */
export function verifyTOTP(secret: string, token: string, window = 1): boolean {
  // Check current window and +/- 1 window for clock drift
  for (let i = -window; i <= window; i++) {
    if (generateTOTP(secret, i) === token) {
      return true;
    }
  }
  return false;
}
