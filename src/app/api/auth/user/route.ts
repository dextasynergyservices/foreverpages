import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/user
 * Get current user data with fresh database query (not cached NextAuth session)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        {
          user: null,
          authenticated: false,
        },
        { status: 401 }
      );
    }

    // Fetch fresh user data from database (not cached)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        phone: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          user: null,
          authenticated: false,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          role: user.role,
          phone: user.phone,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        authenticated: true,
      },
      {
        headers: {
          "Cache-Control": "no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json(
      {
        user: null,
        authenticated: false,
        error: "Failed to fetch session",
      },
      { status: 500 }
    );
  }
}
