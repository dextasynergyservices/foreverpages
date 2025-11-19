"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// signaling-server/src/index.ts
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const jwt_1 = require("./jwt");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_adapter_1 = require("@socket.io/redis-adapter");
const redis_1 = require("redis");
dotenv_1.default.config();
const PORT = Number(process.env.PORT || 3000);
const REDIS_URL = process.env.REDIS_URL || "";
const JWT_SECRET = process.env.JWT_SECRET || "";
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health and admin endpoints
const healthHandler = (_req, res) => {
    return res.json({ status: "ok", ts: Date.now() });
};
const metadataHandler = async (req, res) => {
    const streamId = (req.params && req.params.id) || undefined;
    const adminSecret = process.env.SOCKET_ADMIN_SECRET || "";
    const provided = (req.get && req.get("x-admin-secret")) || "";
    if (!adminSecret || provided !== adminSecret) {
        return res.status(401).json({ error: "unauthorized" });
    }
    const payload = req.body || {};
    const metadata = {};
    if (typeof payload.status === "string")
        metadata.status = payload.status;
    if (typeof payload.recordingUrl === "string")
        metadata.recordingUrl = payload.recordingUrl;
    if (typeof payload.startedAt === "string")
        metadata.startedAt = payload.startedAt;
    if (typeof payload.endedAt === "string")
        metadata.endedAt = payload.endedAt;
    if (typeof payload.streamQuality === "string")
        metadata.streamQuality = payload.streamQuality;
    if (typeof payload.viewers === "number")
        metadata.viewers = payload.viewers;
    try {
        io.to(`stream:${streamId}`).emit("stream-metadata-updated", { streamId, metadata });
        return res.status(200).json({ ok: true, streamId, metadata });
    }
    catch (err) {
        console.error("Failed to emit stream-metadata-updated", err);
        return res.status(500).json({ error: "emit_failed" });
    }
};
app.get("/api/health", healthHandler);
app.post("/api/streams/:id/metadata", metadataHandler);
const server = http_1.default.createServer(app);
// Cast server/options to unknown to avoid Socket.IO type mismatches across environments
const io = new socket_io_1.Server(server, {
    path: "/api/socket",
    cors: {
        origin: process.env.SOCKET_ORIGIN || "*",
    },
});
// Stream state stored at module scope (single-process). For multi-process
// deployments use the Redis adapter to synchronize state across instances.
const streamBroadcasters = new Map();
const streamViewers = new Map();
// Determine production mode once for reuse in handlers
const isProd = process.env.NODE_ENV === "production";
// Create a small Redis client for revocation checks when REDIS_URL is available
let revocationClient = null;
async function getRevocationClient() {
    if (revocationClient)
        return revocationClient;
    if (!REDIS_URL)
        return null;
    try {
        const c = (0, redis_1.createClient)({ url: REDIS_URL });
        await c.connect();
        revocationClient = c;
        return revocationClient;
    }
    catch (err) {
        console.warn("Failed to initialize revocation Redis client:", err);
        return null;
    }
}
async function isJtiRevokedInRedis(jti) {
    try {
        const client = await getRevocationClient();
        if (!client)
            return false;
        const exists = await client.exists(`revoked_jti:${jti}`);
        return exists === 1;
    }
    catch (err) {
        if (process.env.NODE_ENV !== "production")
            console.warn("jti revocation check failed", err);
        return false;
    }
}
// Simple auth middleware for socket.io
io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token ||
        socket.handshake.query?.token;
    const isProdLocal = process.env.NODE_ENV === "production";
    if (!JWT_SECRET) {
        if (!isProdLocal)
            console.log("[socket auth] JWT_SECRET not set; skipping handshake auth");
        return next();
    }
    if (token) {
        const result = (0, jwt_1.verifyToken)(token, JWT_SECRET);
        if (result.payload) {
            if (!isProdLocal)
                console.log("[socket auth] handshake token verified");
            socket.data.user = result.payload;
            return next();
        }
        if (!isProdLocal) {
            const decoded = jsonwebtoken_1.default.decode(token);
            console.warn("[socket auth] handshake token verification failed", {
                error: result.error,
                decoded,
            });
        }
    }
    const streamAccess = socket.handshake.auth?.streamAccess || socket.handshake.query?.streamAccess;
    if (streamAccess) {
        const accessResult = (0, jwt_1.verifyAccessToken)(streamAccess);
        if (accessResult.payload) {
            try {
                const jti = accessResult.payload.jti;
                if (jti) {
                    const revoked = await isJtiRevokedInRedis(jti);
                    if (revoked) {
                        if (!isProdLocal)
                            console.warn("[socket auth] access token jti revoked", jti);
                        return next(new Error("invalid token"));
                    }
                }
            }
            catch (err) {
                if (!isProdLocal)
                    console.warn("[socket auth] jti revocation check failed", err);
            }
            if (!isProdLocal)
                console.log("[socket auth] stream-access token verified");
            socket.data.user = accessResult.payload;
            return next();
        }
        if (!isProdLocal)
            console.warn("[socket auth] stream-access token invalid", accessResult.error);
    }
    if (!isProdLocal)
        console.warn("[socket auth] allowing anonymous socket (will enforce on join)");
    socket.data.user = { anonymous: true };
    return next();
});
io.on("connection", (socket) => {
    console.log("socket connected", socket.id, socket.data.user?.userId || "anonymous");
    // Join a stream as broadcaster or viewer
    socket.on("join-stream", async (data) => {
        const { streamId, role } = data;
        socket.data.streamId = streamId;
        const room = `stream:${streamId}`;
        try {
            const user = socket.data.user;
            if (user?.anonymous && (role === "viewer" || !role)) {
                const appBase = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
                const url = `${appBase.replace(/\/$/, "")}/api/streams/${encodeURIComponent(streamId)}`;
                if (!isProd)
                    console.log("[socket auth] verifying public stream via:", url);
                const res = await fetch(url, { method: "GET" });
                if (!res.ok) {
                    if (!isProd)
                        console.warn("[socket auth] stream metadata fetch failed", res.status);
                    socket.emit("error", { message: "unauthorized" });
                    socket.disconnect();
                    return;
                }
                const body = await res.json().catch(() => null);
                const isPublic = !!body?.stream?.isPublic;
                if (!isPublic) {
                    if (!isProd) {
                        console.warn("[socket auth] anonymous viewer denied for private stream", streamId);
                    }
                    socket.emit("error", { message: "unauthorized: private stream" });
                    socket.disconnect();
                    return;
                }
            }
        }
        catch (err) {
            console.error("[socket auth] error during anonymous join validation:", err);
            socket.emit("error", { message: "unauthorized" });
            socket.disconnect();
            return;
        }
        socket.join(room);
        if (role === "broadcaster") {
            streamBroadcasters.set(streamId, socket.id);
            console.log(`broadcaster joined stream=${streamId} id=${socket.id}`);
            io.to(room).emit("stream-started", { streamId });
        }
        else {
            const viewers = streamViewers.get(streamId) || new Set();
            viewers.add(socket.id);
            streamViewers.set(streamId, viewers);
            const viewerCount = viewers.size;
            console.log(`viewer joined stream=${streamId} id=${socket.id} viewers=${viewerCount}`);
            const broadcasterId = streamBroadcasters.get(streamId);
            if (broadcasterId) {
                io.to(broadcasterId).emit("viewer-joined", { viewerId: socket.id, viewerCount });
            }
            io.to(room).emit("viewer-count", { count: viewerCount });
        }
    });
    socket.on("change-quality-request", ({ streamId, quality }) => {
        const broadcasterId = streamBroadcasters.get(streamId);
        if (broadcasterId) {
            io.to(broadcasterId).emit("change-quality-request", {
                quality,
                requesterId: socket.id,
            });
        }
    });
    socket.on("quality-applied", ({ streamId, quality }) => {
        const room = `stream:${streamId}`;
        console.log(`✅ Quality applied for stream ${streamId}:`, quality);
        io.to(room).emit("quality-applied", { quality });
    });
    socket.on("leave-stream", (data) => {
        const { streamId } = data;
        const room = `stream:${streamId}`;
        socket.leave(room);
        const viewers = streamViewers.get(streamId);
        if (viewers && viewers.has(socket.id)) {
            viewers.delete(socket.id);
            const viewerCount = viewers.size;
            streamViewers.set(streamId, viewers);
            const broadcasterId = streamBroadcasters.get(streamId);
            if (broadcasterId) {
                io.to(broadcasterId).emit("viewer-left", { viewerId: socket.id, viewerCount });
            }
            io.to(room).emit("viewer-count", { count: viewerCount });
        }
        if (streamBroadcasters.get(streamId) === socket.id) {
            streamBroadcasters.delete(streamId);
            io.to(room).emit("stream-ended", { streamId });
            streamViewers.delete(streamId);
        }
    });
    socket.on("disconnect", (reason) => {
        console.log("socket disconnected", socket.id, reason);
        const streamId = socket.data.streamId;
        if (streamId) {
            const room = `stream:${streamId}`;
            const viewers = streamViewers.get(streamId);
            if (viewers && viewers.has(socket.id)) {
                viewers.delete(socket.id);
                const viewerCount = viewers.size;
                streamViewers.set(streamId, viewers);
                const broadcasterId = streamBroadcasters.get(streamId);
                if (broadcasterId) {
                    io.to(broadcasterId).emit("viewer-left", { viewerId: socket.id, viewerCount });
                }
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
            const pubClient = (0, redis_1.createClient)({ url: REDIS_URL });
            const subClient = pubClient.duplicate();
            await Promise.all([pubClient.connect(), subClient.connect()]);
            // Type mismatch between installed adapter types and socket.io's expected AdapterConstructor
            // The adapter returned by createAdapter is runtime-compatible; suppress the type-check here.
            // @ts-expect-error - runtime adapter is compatible even if types differ between packages
            io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
        }
        catch (err) {
            console.warn("Failed to initialize Redis adapter:", err);
        }
    }
    server.listen(PORT, () => {
        console.log(`Signaling server listening on http://localhost:${PORT}`);
    });
}
startServer();
