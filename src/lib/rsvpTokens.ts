import { nanoid } from "nanoid";

/**
 * Generate a secure, unique RSVP token
 * Uses nanoid for URL-safe, collision-resistant tokens
 * Default length: 21 characters (provides ~10^6 years to have a 1% probability of collision)
 */
export function generateRSVPToken(length: number = 21): string {
  return nanoid(length);
}

/**
 * Generate RSVP URL for a given token
 * @param token - The RSVP token
 * @param baseUrl - Base URL of the application (defaults to env variable or localhost)
 * @returns Full RSVP URL
 */
export function generateRSVPUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/rsvp/${token}`;
}

/**
 * Check if RSVP token has expired
 * Tokens expire 30 days after the memorial service date
 * @param expiresAt - Expiration date from invitation
 * @returns true if token is expired
 */
export function isRSVPTokenExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}

/**
 * Validate RSVP token format
 * Ensures token matches expected format (nanoid pattern)
 * @param token - Token to validate
 * @returns true if token format is valid
 */
export function isValidRSVPTokenFormat(token: string): boolean {
  // nanoid uses URL-safe characters: A-Za-z0-9_-
  const nanoidPattern = /^[A-Za-z0-9_-]{21}$/;
  return nanoidPattern.test(token);
}
