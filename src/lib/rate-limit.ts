import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter for development
// In production, use Redis or a proper rate limiting service
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Rate limit: 50 requests per 5 minutes for auth endpoints
const MAX_REQUESTS = 50;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export async function rateLimitMiddleware(request: NextRequest) {
  // Only apply rate limiting to auth endpoints
  if (!request.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Get client IP (fallback to a default for development)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1";

  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    // First request or window expired
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
  } else {
    // Increment count
    entry.count++;
  }

  const currentEntry = rateLimitMap.get(ip)!;
  const remaining = Math.max(0, MAX_REQUESTS - currentEntry.count);
  const reset = currentEntry.resetTime;

  if (currentEntry.count > MAX_REQUESTS) {
    return NextResponse.json(
      {
        message: "Too many requests. Please try again later.",
        limit: MAX_REQUESTS,
        remaining: 0,
        reset: new Date(reset).toISOString(),
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": MAX_REQUESTS.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - now) / 1000).toString(),
        },
      }
    );
  }

  const response = NextResponse.next();

  // Add rate limit headers to successful responses
  response.headers.set("X-RateLimit-Limit", MAX_REQUESTS.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", reset.toString());

  return response;
}

// ============================================
// Progressive Login Rate Limiter
// ============================================
// 3 attempts: wait 10 minutes
// 7 attempts: wait 1 hour
// 10 attempts: wait 24 hours
// ============================================

interface LoginAttempt {
  failedAttempts: number;
  lockoutUntil: number | null;
}

const loginAttemptsMap = new Map<string, LoginAttempt>();

// Lockout tiers
const LOCKOUT_TIERS = [
  { maxAttempts: 3, lockoutMs: 10 * 60 * 1000 }, // 10 minutes
  { maxAttempts: 7, lockoutMs: 60 * 60 * 1000 }, // 1 hour
  { maxAttempts: 10, lockoutMs: 24 * 60 * 60 * 1000 }, // 24 hours
] as const;

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts?: number;
  lockoutUntil?: number;
  lockoutDuration?: string;
  message?: string;
}

/**
 * Check if login attempt is allowed for the identifier
 */
export function checkLoginRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const attempt = loginAttemptsMap.get(identifier);

  // No previous attempts
  if (!attempt) {
    return { allowed: true, remainingAttempts: LOCKOUT_TIERS[0].maxAttempts };
  }

  // Check if currently locked out
  if (attempt.lockoutUntil && now < attempt.lockoutUntil) {
    const timeRemaining = attempt.lockoutUntil - now;
    return {
      allowed: false,
      lockoutUntil: attempt.lockoutUntil,
      lockoutDuration: formatDuration(timeRemaining),
      message: `Too many failed attempts. Please try again in ${formatDuration(timeRemaining)}.`,
    };
  }

  // Lockout expired, reset attempts
  if (attempt.lockoutUntil && now >= attempt.lockoutUntil) {
    loginAttemptsMap.delete(identifier);
    return { allowed: true, remainingAttempts: LOCKOUT_TIERS[0].maxAttempts };
  }

  // Calculate remaining attempts
  const currentTier =
    LOCKOUT_TIERS.find((tier) => attempt.failedAttempts < tier.maxAttempts) || LOCKOUT_TIERS[2];
  const remainingAttempts = currentTier.maxAttempts - attempt.failedAttempts;

  return { allowed: true, remainingAttempts };
}

/**
 * Record a failed login attempt
 */
export function recordFailedLogin(identifier: string): RateLimitResult {
  const now = Date.now();
  const attempt = loginAttemptsMap.get(identifier);

  if (!attempt) {
    // First failed attempt
    loginAttemptsMap.set(identifier, {
      failedAttempts: 1,
      lockoutUntil: null,
    });
    return {
      allowed: true,
      remainingAttempts: LOCKOUT_TIERS[0].maxAttempts - 1,
    };
  }

  // Increment failed attempts
  attempt.failedAttempts++;

  // Check if we've hit a lockout tier
  for (const tier of LOCKOUT_TIERS) {
    if (attempt.failedAttempts >= tier.maxAttempts) {
      attempt.lockoutUntil = now + tier.lockoutMs;
      loginAttemptsMap.set(identifier, attempt);

      return {
        allowed: false,
        lockoutUntil: attempt.lockoutUntil,
        lockoutDuration: formatDuration(tier.lockoutMs),
        message: `Too many failed attempts. Please try again in ${formatDuration(tier.lockoutMs)}.`,
      };
    }
  }

  // Not locked out yet
  const currentTier =
    LOCKOUT_TIERS.find((tier) => attempt.failedAttempts < tier.maxAttempts) || LOCKOUT_TIERS[2];
  const remainingAttempts = currentTier.maxAttempts - attempt.failedAttempts;

  return {
    allowed: true,
    remainingAttempts,
  };
}

/**
 * Reset login attempts for a user (on successful login)
 */
export function resetLoginAttempts(identifier: string): void {
  loginAttemptsMap.delete(identifier);
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  return `${seconds} second${seconds > 1 ? "s" : ""}`;
}
