import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * DEBUG ENDPOINT - REMOVE AFTER TROUBLESHOOTING
 * Tests NextAuth session retrieval
 */
export async function GET() {
  try {
    const start = Date.now();
    const session = await getServerSession(authOptions);
    const duration = Date.now() - start;

    return NextResponse.json({
      success: true,
      hasSession: !!session,
      userId: session?.user?.id || null,
      userRole: session?.user?.role || null,
      userEmail: session?.user?.email ? "***@" + session.user.email.split("@")[1] : null,
      sessionDuration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Session check error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        errorName: error instanceof Error ? error.name : "UnknownError",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
