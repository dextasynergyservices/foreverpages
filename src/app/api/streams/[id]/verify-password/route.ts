import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * POST /api/streams/[id]/verify-password
 * Verify password for password-protected stream
 * Body: { password: string }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const streamId = params.id;
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    // Get stream
    const stream = await prisma.memorialStream.findUnique({
      where: { id: streamId },
      select: {
        id: true,
        password: true,
        isPublic: true,
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (stream.isPublic || !stream.password) {
      return NextResponse.json({ error: "Stream is not password protected" }, { status: 400 });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, stream.password);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Generate access token (simple for now, could be JWT)
    const accessToken = `${streamId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Update stream with access token (optional - could use session instead)
    await prisma.memorialStream.update({
      where: { id: streamId },
      data: { accessToken },
    });

    return NextResponse.json({
      success: true,
      accessToken,
    });
  } catch (error) {
    console.error("Error verifying password:", error);
    return NextResponse.json({ error: "Failed to verify password" }, { status: 500 });
  }
}
