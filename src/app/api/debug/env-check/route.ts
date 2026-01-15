import { NextResponse } from "next/server";

/**
 * DEBUG ENDPOINT - REMOVE AFTER TROUBLESHOOTING
 * Checks if critical environment variables are set in production
 */
export async function GET() {
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    nextAuthUrlPreview: process.env.NEXTAUTH_URL?.substring(0, 25) + "...", // Partial for security
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseHost: process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] || "unknown",
    timestamp: new Date().toISOString(),
  });
}
