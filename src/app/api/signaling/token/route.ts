import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import jwt from "jsonwebtoken";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimiter";

/**
 * GET /api/signaling/token
 * Returns a short-lived JWT for the authenticated user that the frontend
 * can include in the Socket.IO handshake: { token }
 *
 * Requirements:
 * - Environment variable JWT_SECRET must be set in the deployment where this runs.
 */
export async function GET(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;

  // Diagnostic: log whether a session was found for this request
  try {
    console.log(
      "[token route] session found?",
      !!session,
      "user:",
      session?.user?.email ?? session?.user?.id ?? null
    );
  } catch (e) {
    console.log("[token route] session logging failed", e);
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "server misconfigured: missing JWT_SECRET" },
      { status: 500 }
    );
  }

  // Rate-limit by IP to protect token issuance
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const rl = await checkRateLimit(`token-route:${ip}`, 30, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  // If caller is authenticated, issue a user token
  if (session) {
    const payload: Record<string, unknown> = {
      userId: session.user?.id ?? session.user?.email ?? "unknown",
      email: session.user?.email,
      authenticated: true,
    };

    const token = jwt.sign(payload, secret, { algorithm: "HS256", expiresIn: "1h" });
    return NextResponse.json({ token });
  }

  // Non-authenticated requests may be requesting a token for a specific stream.
  // Allow anonymous tokens for public streams, but require the stream accessToken for private streams.

  // Read query params and headers from the NextRequest
  const reqUrl = new URL(req.url);
  const streamIdParam = reqUrl.searchParams.get("streamId");
  const accessTokenHeader =
    req.headers.get("x-stream-access") || reqUrl.searchParams.get("accessToken");

  const streamId = streamIdParam;

  // Diagnostic: log incoming request context for easier debugging in dev
  try {
    console.log("[token route] incoming request", {
      url: req.url,
      streamId,
      hasSession: !!session,
      accessHeaderPresent: !!accessTokenHeader,
    });
  } catch {
    // ignore logging errors
  }

  // Allow anonymous tokens when no streamId is provided (legacy behaviour)
  if (!streamId) {
    const anonId = `anon-${Math.random().toString(36).slice(2, 10)}`;
    const anonPayload: Record<string, unknown> = {
      userId: anonId,
      anonymous: true,
    };
    const anonToken = jwt.sign(anonPayload, secret, { algorithm: "HS256", expiresIn: "15m" });
    console.log("[token route] issuing anonymous viewer token (no streamId)", { anonId });
    return NextResponse.json({ token: anonToken });
  }

  // We have a streamId - fetch stream and enforce privacy rules
  try {
    const stream = await prisma.memorialStream.findUnique({ where: { id: streamId } });
    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (stream.isPublic) {
      const anonId = `anon-${Math.random().toString(36).slice(2, 10)}`;
      const anonPayload: Record<string, unknown> = {
        userId: anonId,
        anonymous: true,
      };
      const anonToken = jwt.sign(anonPayload, secret, {
        algorithm: "HS256",
        expiresIn: "15m",
      });
      console.log("[token route] issuing anonymous token for public stream", { streamId, anonId });
      return NextResponse.json({ token: anonToken });
    }

    // Private stream: verify signed access JWT provided by client
    const providedAccess = accessTokenHeader ?? null;
    if (!providedAccess) {
      return NextResponse.json(
        { error: "Unauthorized: stream password required" },
        { status: 401 }
      );
    }

    // Verify the provided access token. Prefer RS256 public-key verification
    // using STREAM_ACCESS_PUBLIC_KEY. If not present, fall back to the
    // symmetric STREAM_ACCESS_SECRET (HS256).
    const publicKeyRaw = process.env.STREAM_ACCESS_PUBLIC_KEY;
    const accessSecret = process.env.STREAM_ACCESS_SECRET;

    if (!publicKeyRaw && !accessSecret) {
      console.error("STREAM_ACCESS_PUBLIC_KEY or STREAM_ACCESS_SECRET not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const publicKey = publicKeyRaw ? publicKeyRaw.replace(/\\n/g, "\n") : undefined;

    try {
      const decoded = publicKey
        ? (jwt.verify(providedAccess, publicKey, { algorithms: ["RS256"] }) as {
            streamId?: string;
            jti?: string;
          })
        : (jwt.verify(providedAccess, accessSecret as string, { algorithms: ["HS256"] }) as {
            streamId?: string;
            jti?: string;
          });

      if (!decoded || decoded.streamId !== streamId) {
        return NextResponse.json({ error: "Unauthorized: invalid access token" }, { status: 401 });
      }

      // Check jti revocation
      const jti = decoded.jti as string | undefined;
      if (jti) {
        try {
          const { isJtiRevoked } = await import("@/lib/rateLimiter");
          const revoked = await isJtiRevoked(jti);
          if (revoked) {
            return NextResponse.json({ error: "Unauthorized: token revoked" }, { status: 401 });
          }
        } catch (err) {
          console.warn("[token route] failed to check jti revocation", err);
          // allow through if revocation check failed to avoid availability problems
        }
      }
    } catch (err) {
      console.warn("[token route] invalid access token", err);
      return NextResponse.json({ error: "Unauthorized: invalid access token" }, { status: 401 });
    }

    // Provided access token valid - issue anonymous viewer token
    const anonId = `anon-${Math.random().toString(36).slice(2, 10)}`;
    const anonPayload: Record<string, unknown> = {
      userId: anonId,
      anonymous: true,
      streamId,
    };
    const anonToken = jwt.sign(anonPayload, secret, { algorithm: "HS256", expiresIn: "15m" });
    console.log("[token route] issued token for private stream after access check", {
      streamId,
      anonId,
    });
    return NextResponse.json({ token: anonToken });
  } catch (err) {
    // Log detailed error for debugging. In production avoid leaking stack traces.
    console.error("[token route] error while issuing token:", err);
    if (process.env.NODE_ENV !== "production") {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      return NextResponse.json({ error: message || "server_error", stack }, { status: 500 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
