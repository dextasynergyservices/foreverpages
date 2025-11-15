"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const jwt_1 = require("./jwt");
const redis_adapter_1 = require("@socket.io/redis-adapter");
// Local lightweight AdapterConstructor alias to avoid depending on separate types in CI
const redis_1 = require("redis");
dotenv_1.default.config();
const PORT = Number(process.env.PORT || 3000);
const REDIS_URL = process.env.REDIS_URL || "";
const JWT_SECRET = process.env.JWT_SECRET || "";
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/api/health", (_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", ts: Date.now() }));
});
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    path: "/api/socket",
    cors: {
        origin: process.env.SOCKET_ORIGIN || "*",
    },
});
// Simple auth middleware for socket.io
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!JWT_SECRET)
        return next();
    if (!token)
        return next(new Error("unauthorized"));
    const payload = (0, jwt_1.verifyToken)(token, JWT_SECRET);
    if (!payload)
        return next(new Error("invalid token"));
    socket.data.user = payload;
    next();
});
io.on("connection", (socket) => {
    console.log("socket connected", socket.id, socket.data?.user?.userId || "anonymous");
    socket.on("join", (room) => {
        socket.join(room);
        socket.emit("joined", room);
    });
    socket.on("signal", ({ to, data }) => {
        io.to(to).emit("signal", { from: socket.id, data });
    });
    socket.on("disconnect", (reason) => {
        console.log("socket disconnected", socket.id, reason);
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
