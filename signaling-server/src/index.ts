import express, { Request, Response } from "express";
import http from "http";
import { Server as IOServer } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { verifyToken } from "./jwt";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient, RedisClientType } from "redis";

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const REDIS_URL = process.env.REDIS_URL || "";
const JWT_SECRET = process.env.JWT_SECRET || "";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  return res.json({ status: "ok", ts: Date.now() });
});

const server = http.createServer(app);

const io = new IOServer(server, {
  path: "/api/socket",
  cors: {
    origin: process.env.SOCKET_ORIGIN || "*",
  },
});

// Simple auth middleware for socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!JWT_SECRET) return next();
  if (!token) return next(new Error("unauthorized"));
  const payload = verifyToken(token, JWT_SECRET);
  if (!payload) return next(new Error("invalid token"));
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
      const pubClient: RedisClientType = createClient({ url: REDIS_URL });
      const subClient: RedisClientType = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);

      // Cast to the parameter types expected by createAdapter to avoid using 'any'
      io.adapter(
        createAdapter(
          pubClient as unknown as Parameters<typeof createAdapter>[0],
          subClient as unknown as Parameters<typeof createAdapter>[1]
        )
      );
      console.log("Redis adapter enabled");
    } catch (err) {
      console.warn("Failed to initialize Redis adapter:", err);
    }
  }

  server.listen(PORT, () => {
    console.log(`Signaling server listening on http://localhost:${PORT}`);
  });
}

startServer();
