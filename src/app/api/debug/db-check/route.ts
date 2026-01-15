import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * DEBUG ENDPOINT - REMOVE AFTER TROUBLESHOOTING
 * Tests database connection and query performance
 */
export async function GET() {
  try {
    const start = Date.now();

    // Simple query to test connection
    const userCount = await prisma.user.count();

    const duration = Date.now() - start;

    return NextResponse.json({
      success: true,
      userCount,
      queryDuration: `${duration}ms`,
      message: "Database connection successful",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database check error:", error);

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
