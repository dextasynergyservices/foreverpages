import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * POST /api/auth/check-2fa - Check if user has 2FA enabled before login
 */
export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json({ message: "Missing credentials" }, { status: 400 });
    }

    // Find user
    const isEmail = identifier.includes("@");
    const user = await prisma.user.findFirst({
      where: isEmail ? { email: identifier } : { phone: identifier },
      select: {
        id: true,
        email: true,
        password: true,
        twoFactorEnabled: true,
        twoFactorMethod: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // Return 2FA status
    return NextResponse.json({
      userId: user.id,
      email: user.email,
      twoFactorEnabled: user.twoFactorEnabled,
      twoFactorMethod: user.twoFactorMethod,
    });
  } catch (error) {
    console.error("Check 2FA error:", error);
    return NextResponse.json({ message: "Authentication failed" }, { status: 500 });
  }
}
