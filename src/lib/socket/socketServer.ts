import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";

interface SocketServer extends HTTPServer {
  io?: SocketIOServer;
}

// Global socket server instance
let globalSocketServer: SocketIOServer | null = null;

/**
 * Socket.io Event Types for Livestream
 */
export interface ServerToClientEvents {
  // Stream lifecycle
  "stream-started": (data: { streamId: string }) => void;
  "stream-ended": (data: { streamId: string }) => void;
  "stream-status-changed": (data: { streamId: string; status: string }) => void;

  // Viewer events
  "viewer-joined": (data: { viewerId: string; viewerCount: number }) => void;
  "viewer-left": (data: { viewerId: string; viewerCount: number }) => void;
  "viewer-count": (data: { count: number }) => void;

  // WebRTC signaling
  offer: (data: { broadcasterId: string; offer: RTCSessionDescriptionInit }) => void;
  answer: (data: { viewerId: string; answer: RTCSessionDescriptionInit }) => void;
  "ice-candidate": (data: { senderId: string; candidate: RTCIceCandidateInit }) => void;

  // Chat & reactions
  "chat-message": (data: ChatMessage) => void;
  reaction: (data: StreamReaction) => void;

  // Stream quality
  "quality-changed": (data: { quality: string }) => void;

  // Errors
  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  // Join/leave stream
  "join-stream": (data: { streamId: string; role: "broadcaster" | "viewer" }) => void;
  "leave-stream": (data: { streamId: string }) => void;

  // WebRTC signaling
  offer: (data: { streamId: string; offer: RTCSessionDescriptionInit; targetId?: string }) => void;
  answer: (data: { streamId: string; answer: RTCSessionDescriptionInit; targetId: string }) => void;
  "ice-candidate": (data: {
    streamId: string;
    candidate: RTCIceCandidateInit;
    targetId?: string;
  }) => void;

  // Chat & reactions
  "chat-message": (data: {
    streamId: string;
    message: Omit<ChatMessage, "id" | "timestamp">;
  }) => void;
  reaction: (data: {
    streamId: string;
    reaction: Omit<StreamReaction, "id" | "timestamp">;
  }) => void;

  // Stream controls
  "change-quality": (data: { streamId: string; quality: string }) => void;
}

export interface ChatMessage {
  id: string;
  streamId: string;
  authorId?: string;
  authorName: string;
  content: string;
  timestamp: number;
}

export interface StreamReaction {
  id: string;
  streamId: string;
  userId?: string;
  sessionId: string;
  type: "HEART" | "PRAYER" | "CANDLE" | "FLOWER" | "DOVE" | "APPLAUSE";
  timestamp: number;
}

/**
 * Initialize Socket.io server for WebRTC signaling
 */
export function initializeSocketServer(httpServer: HTTPServer): SocketIOServer {
  const socketServer = httpServer as SocketServer;

  // Return existing instance if already initialized
  if (socketServer.io) {
    console.log("✅ Socket.io server already initialized");
    return socketServer.io;
  }

  // Create new Socket.io server
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    path: "/api/socket",
    cors: {
      // Allow overriding the origin for Socket.io (useful in dev/prod where frontend may be hosted separately)
      origin: process.env.SOCKET_ORIGIN || process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Optimized for low-latency real-time performance
    pingTimeout: 20000, // Reduced from 60000ms to 20000ms
    pingInterval: 8000, // Reduced from 25000ms to 8000ms for faster heartbeat
    transports: ["websocket", "polling"], // Prefer websocket for lower latency
    allowEIO3: true, // Allow Engine.IO v3 for better compatibility
    maxHttpBufferSize: 1e6, // 1MB buffer for media data
  });

  // Track viewer counts per stream
  const viewerCounts = new Map<string, Set<string>>();

  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    // Join stream room
    socket.on("join-stream", ({ streamId, role }) => {
      console.log(`👤 ${role} joined stream ${streamId}:`, socket.id);

      socket.join(`stream:${streamId}`);

      if (role === "broadcaster") {
        socket.join(`stream:${streamId}:broadcaster`);
        console.log(`📡 Broadcaster set for stream ${streamId}`);
      } else {
        // Track viewers
        if (!viewerCounts.has(streamId)) {
          viewerCounts.set(streamId, new Set());
        }
        viewerCounts.get(streamId)!.add(socket.id);

        const viewerCount = viewerCounts.get(streamId)!.size;

        // Notify everyone about new viewer
        io.to(`stream:${streamId}`).emit("viewer-joined", {
          viewerId: socket.id,
          viewerCount,
        });

        // Send current viewer count to new viewer
        socket.emit("viewer-count", { count: viewerCount });
      }
    });

    // Leave stream
    socket.on("leave-stream", ({ streamId }) => {
      handleViewerLeave(socket.id, streamId);
    });

    // WebRTC Signaling: Offer
    socket.on("offer", ({ streamId, offer, targetId }) => {
      console.log(`📤 Offer received for stream ${streamId}`);

      if (targetId) {
        // Send to specific viewer
        io.to(targetId).emit("offer", {
          broadcasterId: socket.id,
          offer,
        });
      } else {
        // Broadcast to all viewers
        socket.to(`stream:${streamId}`).emit("offer", {
          broadcasterId: socket.id,
          offer,
        });
      }
    });

    // WebRTC Signaling: Answer
    socket.on("answer", ({ streamId, answer, targetId }) => {
      console.log(`📤 Answer received for stream ${streamId}`);

      io.to(targetId).emit("answer", {
        viewerId: socket.id,
        answer,
      });
    });

    // WebRTC Signaling: ICE Candidate
    socket.on("ice-candidate", ({ streamId, candidate, targetId }) => {
      if (targetId) {
        // Send to specific peer
        io.to(targetId).emit("ice-candidate", {
          senderId: socket.id,
          candidate,
        });
      } else {
        // Broadcast to all in stream
        socket.to(`stream:${streamId}`).emit("ice-candidate", {
          senderId: socket.id,
          candidate,
        });
      }
    });

    // Chat message
    socket.on("chat-message", async ({ streamId, message }) => {
      console.log(`💬 Chat message in stream ${streamId}:`, message.content);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { streamId: _msgStreamId, ...messageData } = message;
      const chatMessage: ChatMessage = {
        id: `msg-${Date.now()}-${socket.id}`,
        streamId,
        ...messageData,
        timestamp: Date.now(),
      };

      // Broadcast to all in stream
      io.to(`stream:${streamId}`).emit("chat-message", chatMessage);

      // TODO: Save to database
      // await prisma.streamComment.create({ ... })
    });

    // Reaction
    socket.on("reaction", ({ streamId, reaction }) => {
      console.log(`❤️ Reaction in stream ${streamId}:`, reaction.type);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { streamId: _reactStreamId, ...reactionData } = reaction;
      const streamReaction: StreamReaction = {
        id: `reaction-${Date.now()}-${socket.id}`,
        streamId,
        ...reactionData,
        sessionId: socket.id,
        timestamp: Date.now(),
      };

      // Broadcast to all in stream
      io.to(`stream:${streamId}`).emit("reaction", streamReaction);

      // TODO: Save to database
      // await prisma.streamReaction.create({ ... })
    });

    // Quality change
    socket.on("change-quality", ({ streamId, quality }) => {
      console.log(`🎥 Quality changed in stream ${streamId}:`, quality);

      // Notify all viewers
      io.to(`stream:${streamId}`).emit("quality-changed", { quality });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("🔌 Client disconnected:", socket.id);

      // Remove from all streams
      viewerCounts.forEach((viewers, streamId) => {
        if (viewers.has(socket.id)) {
          handleViewerLeave(socket.id, streamId);
        }
      });
    });

    // Helper function to handle viewer leaving
    function handleViewerLeave(socketId: string, streamId: string) {
      const viewers = viewerCounts.get(streamId);
      if (viewers && viewers.has(socketId)) {
        viewers.delete(socketId);
        const viewerCount = viewers.size;

        io.to(`stream:${streamId}`).emit("viewer-left", {
          viewerId: socketId,
          viewerCount,
        });

        console.log(`👋 Viewer left stream ${streamId}, remaining: ${viewerCount}`);

        // Clean up empty stream
        if (viewerCount === 0) {
          viewerCounts.delete(streamId);
        }
      }

      socket.leave(`stream:${streamId}`);
    }
  });

  // Save instance
  socketServer.io = io;
  globalSocketServer = io;

  console.log("✅ Socket.io server initialized");
  return io;
}

/**
 * Notify all viewers in a stream that it has ended
 */
export function notifyStreamEnded(streamId: string, io: SocketIOServer): void {
  console.log(`📡 Notifying viewers that stream ${streamId} has ended`);
  io.to(`stream:${streamId}`).emit("stream-ended", { streamId });
  io.to(`stream:${streamId}`).emit("stream-status-changed", { streamId, status: "ENDED" });
}

/**
 * Notify all viewers in a stream that it has started
 */
export function notifyStreamStarted(streamId: string, io: SocketIOServer): void {
  console.log(`📡 Notifying viewers that stream ${streamId} has started`);
  io.to(`stream:${streamId}`).emit("stream-started", { streamId });
  io.to(`stream:${streamId}`).emit("stream-status-changed", { streamId, status: "LIVE" });
}

/**
 * Get global Socket.io server instance
 */
export function getGlobalSocketServer(): SocketIOServer | null {
  return globalSocketServer;
}
