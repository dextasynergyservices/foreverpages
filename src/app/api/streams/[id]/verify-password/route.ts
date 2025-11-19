import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { customAlphabet } from "nanoid";
import { checkRateLimit } from "@/lib/rateLimiter";

/**
 * POST /api/streams/[id]/verify-password
 * Verify password for password-protected stream
 * Body: { password: string }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Rate-limit per IP
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rl = await checkRateLimit(`verify-password:${ip}`, 10, 60);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

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

    // Create a short-lived signed access token (JWT) so clients can request signaling tokens
    // Prefer RS256 using a private key (STREAM_ACCESS_PRIVATE_KEY). If not present,
    // fall back to the symmetric STREAM_ACCESS_SECRET (HS256).
    const privateKeyRaw = process.env.STREAM_ACCESS_PRIVATE_KEY;
    const accessSecret = process.env.STREAM_ACCESS_SECRET;

    if (!privateKeyRaw && !accessSecret) {
      console.error("STREAM_ACCESS_PRIVATE_KEY or STREAM_ACCESS_SECRET must be configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // If private key provided, it may have escaped newlines; normalize to real newlines
    const privateKey = privateKeyRaw ? privateKeyRaw.replace(/\\n/g, "\n") : undefined;

    const nano = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);
    const jti = nano();

    const accessPayload = {
      streamId,
      purpose: "stream-access",
      jti,
    };

    let accessToken: string;
    if (privateKey) {
      accessToken = jwt.sign(accessPayload, privateKey, {
        algorithm: "RS256",
        expiresIn: "15m",
        jwtid: jti,
      });
    } else {
      accessToken = jwt.sign(accessPayload, accessSecret as string, {
        algorithm: "HS256",
        expiresIn: "15m",
        jwtid: jti,
      });
    }

    return NextResponse.json({ success: true, accessToken, jti });
  } catch (error) {
    console.error("Error verifying password:", error);
    return NextResponse.json({ error: "Failed to verify password" }, { status: 500 });
  }
}
