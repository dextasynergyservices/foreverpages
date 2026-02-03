import { NextResponse } from "next/server";

// Version info - uses Vercel's built-in env vars as fallbacks for automatic versioning
// No manual updates needed on each deploy!
const APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION ||
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || // Short commit hash
  "1.0.0";
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();

export async function GET() {
  return NextResponse.json(
    {
      version: APP_VERSION,
      buildTime: BUILD_TIME,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
