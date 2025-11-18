import { NextResponse } from "next/server";
import type { Socket } from "socket.io";
import { getGlobalSocketServer } from "@/lib/socket/socketServer";
import type { ClientToServerEvents, ServerToClientEvents } from "@/lib/socket/socketServer";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const streamId = url.searchParams.get("streamId");
  if (!streamId) return NextResponse.json({ error: "missing streamId" }, { status: 400 });

  const io = getGlobalSocketServer();
  if (!io) return NextResponse.json({ error: "socket_server_unavailable" }, { status: 503 });

  try {
    // Room name is `stream:${streamId}` per socketServer implementation
    const room = `stream:${streamId}`;
    const sockets = await io.in(room).allSockets();
    const ids = Array.from(sockets || []);

    const members = ids.map((id) => {
      const sock = io.sockets.sockets.get(id as string) as
        | Socket<ClientToServerEvents, ServerToClientEvents>
        | undefined;

      return {
        id,
        data: sock?.data ?? null,
        rooms: sock ? Array.from(sock.rooms) : [],
      };
    });

    return NextResponse.json({ streamId, room, members, count: members.length });
  } catch (err) {
    console.warn("debug stream-state failed", err);
    return NextResponse.json({ error: "failed", details: String(err) }, { status: 500 });
  }
}
