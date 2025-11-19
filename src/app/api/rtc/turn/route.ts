import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Returns ICE servers (STUN + TURN) for authenticated users.
 * Protects TURN credentials server-side using NextAuth session.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = process.env.TURN_URL;
    const username = process.env.TURN_USERNAME;
    const credential = process.env.TURN_PASSWORD;
    const tls = process.env.TURN_URL_TLS;

    if (!url || !username || !credential) {
      return NextResponse.json({ error: "turn-not-configured" }, { status: 500 });
    }

    const iceServers: Array<Record<string, unknown>> = [
      { urls: ["stun:stun.l.google.com:19302"] },
      { urls: [url], username, credential },
    ];

    if (tls) {
      iceServers.push({ urls: [tls], username, credential });
    }

    return NextResponse.json({ ok: true, iceServers }, { status: 200 });
  } catch (err) {
    console.error("/api/rtc/turn error:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
