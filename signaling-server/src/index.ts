// signaling-server/src/index.ts
import express from "express";
import http from "http";
import { Server as IOServer, Socket } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { verifyToken, verifyAccessToken } from "./jwt";
import jwt from "jsonwebtoken";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient, RedisClientType } from "redis";

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const REDIS_URL = process.env.REDIS_URL || "";
const JWT_SECRET = process.env.JWT_SECRET || "";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  // Use Express response helpers for simplicity. Default 200 is fine for health.
  res.json({ status: "ok", ts: Date.now() });
});

app.post("/api/streams/:id/metadata", async (req, res) => {
  const streamId = (req.params && (req.params.id as string)) || undefined;
  const adminSecret = process.env.SOCKET_ADMIN_SECRET || "";
  const provided = (req.get && (req.get("x-admin-secret") as string)) || "";

  if (!adminSecret || provided !== adminSecret) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const payload = req.body || {};

  // Accept only a subset of safe fields
  const metadata: Record<string, unknown> = {};
  if (typeof payload.status === "string") metadata.status = payload.status;
  if (typeof payload.recordingUrl === "string") metadata.recordingUrl = payload.recordingUrl;
  if (typeof payload.startedAt === "string") metadata.startedAt = payload.startedAt;
  if (typeof payload.endedAt === "string") metadata.endedAt = payload.endedAt;
  if (typeof payload.streamQuality === "string") metadata.streamQuality = payload.streamQuality;
  if (typeof payload.viewers === "number") metadata.viewers = payload.viewers;

  // Emit to the stream room so connected clients can update their caches
  try {
    io.to(`stream:${streamId}`).emit("stream-metadata-updated", { streamId, metadata });
    return res.status(200).json({ ok: true, streamId, metadata });
  } catch (err) {
    console.error("Failed to emit stream-metadata-updated", err);
    return res.status(500).json({ error: "emit_failed" });
  }
});

const server = http.createServer(app);

const io = new IOServer(server, {
  path: "/api/socket",
  cors: {
    origin: process.env.SOCKET_ORIGIN || "*",
  },
});

// Stream state stored at module scope (single-process). For multi-process
// deployments use the Redis adapter to synchronize state across instances.
const streamBroadcasters = new Map<string, string>();
const streamViewers = new Map<string, Set<string>>();

// Determine production mode once for reuse in handlers
const isProd = process.env.NODE_ENV === "production";

// Create a small Redis client for revocation checks when REDIS_URL is available
let revocationClient: RedisClientType | null = null;
async function getRevocationClient(): Promise<RedisClientType | null> {
  if (revocationClient) return revocationClient;
  if (!REDIS_URL) return null;
  try {
    const c: RedisClientType = createClient({ url: REDIS_URL });
    await c.connect();
    revocationClient = c;
    return revocationClient;
  } catch (err) {
    console.warn("Failed to initialize revocation Redis client:", err);
    return null;
  }
}

async function isJtiRevokedInRedis(jti: string) {
  try {
    const client = await getRevocationClient();
    if (!client) return false;
    // `exists` returns 1 if key exists, 0 if not
    const exists = await client.exists(`revoked_jti:${jti}`);
    return exists === 1;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn("jti revocation check failed", err);
    return false;
  }
}

// Simple auth middleware for socket.io
io.use(async (socket: Socket, next) => {
  // Accept token via handshake auth or query param for debugging
  const token =
    (socket.handshake.auth?.token as string | undefined) ||
    (socket.handshake.query?.token as string | undefined);

  // Reduce noise in production
  const isProdLocal = process.env.NODE_ENV === "production";

  if (!JWT_SECRET) {
    if (!isProdLocal) console.log("[socket auth] JWT_SECRET not set; skipping handshake auth");
    return next();
  }

  // First try verifying the handshake token (signed by JWT_SECRET)
  if (token) {
    const result = verifyToken(token, JWT_SECRET);
    if (result.payload) {
      if (!isProdLocal) console.log("[socket auth] handshake token verified");
      socket.data.user = result.payload;
      return next();
    }

    if (!isProdLocal) {
      const decoded = jwt.decode(token);
      console.warn("[socket auth] handshake token verification failed", {
        error: result.error,
        decoded,
      });
    }
  }

  // If handshake token missing/invalid, allow clients to present a direct stream-access token
  const streamAccess = socket.handshake.auth?.streamAccess || socket.handshake.query?.streamAccess;
  if (streamAccess) {
    const accessResult = verifyAccessToken(streamAccess as string);
    if (accessResult.payload) {
      // Check jti revocation in Redis (if available)
      try {
        const jti = accessResult.payload.jti as string | undefined;
        if (jti) {
          const revoked = await isJtiRevokedInRedis(jti);
          if (revoked) {
            if (!isProdLocal) console.warn("[socket auth] access token jti revoked", jti);
            return next(new Error("invalid token"));
          }
        }
      } catch (err) {
        if (!isProdLocal) console.warn("[socket auth] jti revocation check failed", err);
        // proceed (favor availability)
      }

      if (!isProdLocal) console.log("[socket auth] stream-access token verified");
      socket.data.user = accessResult.payload;
      return next();
    }

    if (!isProdLocal) console.warn("[socket auth] stream-access token invalid", accessResult.error);
  }

  // Nothing verified — allow anonymous socket and enforce privacy later at join time
  if (!isProdLocal) console.warn("[socket auth] allowing anonymous socket (will enforce on join)");
  socket.data.user = { anonymous: true } as { anonymous: boolean };
  return next();
});

interface SocketUserData {
  user?: {
    userId?: string;
    anonymous?: boolean;
    [key: string]: unknown;
  };
  streamId?: string;
  [key: string]: unknown;
}

io.on("connection", (socket: Socket & { data: SocketUserData }) => {
  console.log("socket connected", socket.id, socket.data.user?.userId || "anonymous");

  // use module-scoped maps (shared in this process)

  // Join a stream as broadcaster or viewer
  socket.on("join-stream", async (data: { streamId: string; role?: string; quality?: string }) => {
    const { streamId, role } = data;
    socket.data.streamId = streamId;
    // Join a namespaced room so room naming matches in-app socketServer (`stream:<id>`)
    const room = `stream:${streamId}`;

    // If anonymous and joining as viewer, verify the stream is public by querying the app
    try {
      const user = socket.data.user as { anonymous?: boolean } | undefined;
      // Treat missing role as implicit viewer for public pages
      if (user?.anonymous && (role === "viewer" || !role)) {
        const appBase =
          process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
        const url = `${appBase.replace(/\/$/, "")}/api/streams/${encodeURIComponent(streamId)}`;
        if (!isProd) console.log("[socket auth] verifying public stream via:", url);
        const res = await fetch(url, { method: "GET" });
        if (!res.ok) {
          if (!isProd) console.warn("[socket auth] stream metadata fetch failed", res.status);
          socket.emit("error", { message: "unauthorized" });
          socket.disconnect();
          return;
        }
        const body = await res.json().catch(() => null);
        const isPublic = !!body?.stream?.isPublic;
        if (!isPublic) {
          if (!isProd)
            console.warn("[socket auth] anonymous viewer denied for private stream", streamId);
          socket.emit("error", { message: "unauthorized: private stream" });
          socket.disconnect();
          return;
        }
      }
    } catch (err) {
      console.error("[socket auth] error during anonymous join validation:", err);
      socket.emit("error", { message: "unauthorized" });
      socket.disconnect();
      return;
    }

    // All checks passed or not needed — join the room and proceed
    socket.join(room);

    if (role === "broadcaster") {
      streamBroadcasters.set(streamId, socket.id);
      console.log(`broadcaster joined stream=${streamId} id=${socket.id}`);
      // notify room that stream started
      io.to(room).emit("stream-started", { streamId });
    } else {
      // viewer
      const viewers = streamViewers.get(streamId) || new Set<string>();
      viewers.add(socket.id);
      streamViewers.set(streamId, viewers);

      const viewerCount = viewers.size;
      console.log(`viewer joined stream=${streamId} id=${socket.id} viewers=${viewerCount}`);

      const broadcasterId = streamBroadcasters.get(streamId);
      if (broadcasterId) {
        // Ask broadcaster to create a peer for this viewer (broadcaster initiates)
        io.to(broadcasterId).emit("viewer-joined", { viewerId: socket.id, viewerCount });
      }

      // Broadcast viewer count to the room
      io.to(room).emit("viewer-count", { count: viewerCount });
    }
  });

  // A viewer (or client) may request a quality change; forward the request to the broadcaster
  socket.on(
    "change-quality-request",
    ({ streamId, quality }: { streamId: string; quality: string }) => {
      const broadcasterId = streamBroadcasters.get(streamId);
      if (broadcasterId) {
        io.to(broadcasterId).emit("change-quality-request", {
          quality,
          requesterId: socket.id,
        });
      }
    }
  );

  // Broadcaster acknowledges/applies a quality change and notifies viewers
  socket.on("quality-applied", ({ streamId, quality }: { streamId: string; quality: string }) => {
    const room = `stream:${streamId}`;
    console.log(`✅ Quality applied for stream ${streamId}:`, quality);
    io.to(room).emit("quality-applied", { quality });
  });

  // Handle leaving a stream
  socket.on("leave-stream", (data: { streamId: string }) => {
    const { streamId } = data;
    const room = `stream:${streamId}`;
    socket.leave(room);
    const viewers = streamViewers.get(streamId);
    if (viewers && viewers.has(socket.id)) {
      viewers.delete(socket.id);
      const viewerCount = viewers.size;
      streamViewers.set(streamId, viewers);
      const broadcasterId = streamBroadcasters.get(streamId);
      if (broadcasterId)
        io.to(broadcasterId).emit("viewer-left", { viewerId: socket.id, viewerCount });
      io.to(room).emit("viewer-count", { count: viewerCount });
    }
    // If broadcaster left, end stream
    if (streamBroadcasters.get(streamId) === socket.id) {
      streamBroadcasters.delete(streamId);
      // notify viewers
      io.to(room).emit("stream-ended", { streamId });
      streamViewers.delete(streamId);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("socket disconnected", socket.id, reason);

    // Cleanup any viewer or broadcaster state
    const streamId = socket.data.streamId as string | undefined;
    if (streamId) {
      const room = `stream:${streamId}`;
      const viewers = streamViewers.get(streamId);
      if (viewers && viewers.has(socket.id)) {
        viewers.delete(socket.id);
        const viewerCount = viewers.size;
        streamViewers.set(streamId, viewers);
        const broadcasterId = streamBroadcasters.get(streamId);
        if (broadcasterId)
          io.to(broadcasterId).emit("viewer-left", { viewerId: socket.id, viewerCount });
        io.to(room).emit("viewer-count", { count: viewerCount });
      }
      if (streamBroadcasters.get(streamId) === socket.id) {
        streamBroadcasters.delete(streamId);
        io.to(room).emit("stream-ended", { streamId });
        streamViewers.delete(streamId);
      }
    }
  });
});

// Start server with optional Redis adapter
async function startServer() {
  if (REDIS_URL) {
    try {
      const pubClient: RedisClientType = createClient({ url: REDIS_URL });
      const subClient: RedisClientType = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);

      // Type mismatch between installed adapter types and socket.io's expected AdapterConstructor
      // The adapter returned by createAdapter is runtime-compatible; suppress the type-check here.
      // @ts-expect-error - runtime adapter is compatible even if types differ between packages
      io.adapter(createAdapter(pubClient, subClient) as unknown);
    } catch (err) {
      console.warn("Failed to initialize Redis adapter:", err);
    }
  }

  server.listen(PORT, () => {
    console.log(`Signaling server listening on http://localhost:${PORT}`);
  });
}

startServer();
