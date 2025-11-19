"use client";

import { useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { StreamMeta } from "@/hooks/useStreamMetadata";
import { io, Socket } from "socket.io-client";
import { StreamQuality } from "@/generated/prisma";
import { PeerConnectionManager } from "@/lib/webrtc/peerManager";
import { getSocketUrl } from "@/lib/socket/getSocketUrl";

interface UseWebRTCViewerProps {
  streamId: string;
  isLive: boolean;
  quality: StreamQuality;
  onViewerCountChange: (count: number) => void;
  onError: (error: string) => void;
}

export function useWebRTCViewer({
  streamId,
  isLive,
  quality,
  onViewerCountChange,
  onError,
}: UseWebRTCViewerProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerManagerRef = useRef<PeerConnectionManager | null>(null);
  const broadcasterIdRef = useRef<string | null>(null);
  const [restartCounter, setRestartCounter] = useState(0);
  const queryClient = useQueryClient();

  // Stable references to prevent unnecessary re-renders
  const onViewerCountChangeRef = useRef(onViewerCountChange);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onViewerCountChangeRef.current = onViewerCountChange;
    onErrorRef.current = onError;
  }, [onViewerCountChange, onError]);

  // Initialize socket and WebRTC connection
  useEffect(() => {
    console.log(
      "🎥 Initializing WebRTC viewer for stream:",
      streamId,
      "(viewer will connect to receive stream events)"
    );

    let socketInstance: Socket | null = null;
    let connectionTimeout: number | undefined;

    const start = async () => {
      // Fetch token
      let token: string | null = null;
      try {
        console.log("[viewer hook] requesting /api/signaling/token (sending credentials)");
        // Include streamId so server can enforce stream privacy rules
        const url = new URL(`/api/signaling/token`, window.location.origin);
        url.searchParams.set("streamId", streamId);

        // If a stream accessToken is stored locally (after password verification), send it in a header
        const accessToken =
          typeof window !== "undefined" ? localStorage.getItem(`streamAccess:${streamId}`) : null;

        const res = await fetch(url.toString(), {
          credentials: "include",
          headers: accessToken ? { "x-stream-access": accessToken } : undefined,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.warn("[viewer hook] token endpoint error body:", body, "status", res.status);
          throw new Error(body?.error || `token endpoint returned ${res.status}`);
        }
        const b = await res.json();
        token = b.token;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("❌ Failed to fetch signaling token:", message);
        onErrorRef.current("Failed to obtain signaling token. Please ensure you're signed in.");
        return;
      }

      if (!token) return;

      // Connect to Socket.io using helper that prefers NEXT_PUBLIC_SOCKET_URL or falls back to window.location.origin
      socketInstance = io(getSocketUrl(), {
        path: "/api/socket",
        auth: { token },
        reconnection: true,
        reconnectionDelay: 500,
        reconnectionAttempts: 10,
        timeout: 10000,
        transports: ["websocket", "polling"],
        forceNew: false,
        upgrade: true,
      });

      // Connection timeout handler - increased to 30 seconds
      connectionTimeout = window.setTimeout(() => {
        if (!isConnected) {
          console.error("⏰ Socket connection timeout");
          onErrorRef.current(
            "Connection timeout. Please check your internet connection and try again."
          );
          setIsConnected(false);
        }
      }, 30000); // Increased from 15s to 30s

      // Socket connection handlers
      socketInstance.on("connect", () => {
        console.log("✅ Socket connected:", socketInstance!.id);
        if (connectionTimeout !== undefined) clearTimeout(connectionTimeout);
        setIsConnected(true);
        // Clear any in-progress reconnect state
        setIsReconnecting(false);

        // Join stream (public memorial visitors should not send a role)
        socketInstance?.emit("join-stream", {
          streamId,
          quality,
        });
        // Emit a 'viewer-ready' fallback and retry a few times in case the broadcaster
        // missed the initial join-stream forwarding. This helps recover from races.
        try {
          socketInstance?.emit("viewer-ready", { streamId, viewerId: socketInstance.id });
        } catch (err) {
          console.warn("Failed to emit initial viewer-ready fallback:", err);
        }

        let viewerReadyAttempts = 0;
        const maxAttempts = 5;
        const viewerReadyInterval = window.setInterval(() => {
          if (viewerReadyAttempts >= maxAttempts || peerManagerRef.current || remoteStream) {
            clearInterval(viewerReadyInterval);
            return;
          }
          try {
            socketInstance?.emit("viewer-ready", { streamId, viewerId: socketInstance.id });
            console.log("📣 viewer-ready retry emitted (#", viewerReadyAttempts + 1, ")");
          } catch (err) {
            console.warn("viewer-ready retry failed:", err);
          }
          viewerReadyAttempts += 1;
        }, 3000);
        // Fallback: let broadcaster know we're ready (in case server forwarding misses viewer-joined)
        try {
          socketInstance?.emit("viewer-ready", { streamId, viewerId: socketInstance.id });
          console.log("📣 Emitted viewer-ready as fallback");
        } catch (err) {
          console.warn("Failed to emit viewer-ready fallback:", err);
        }
      });

      socketInstance.on("disconnect", (reason) => {
        console.log("🔌 Socket disconnected:", reason);
        setIsConnected(false);

        // If disconnected due to error, show user-friendly message
        if (reason === "io server disconnect" || reason === "io client disconnect") {
          onErrorRef.current("Connection lost. Attempting to reconnect...");
        }
      });

      socketInstance.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
        clearTimeout(connectionTimeout);
        onErrorRef.current(
          `Connection failed: ${error.message}. Please check your internet connection.`
        );
        setIsConnected(false);
      });

      socketInstance.on("reconnect", (attemptNumber) => {
        console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
        setIsReconnecting(false);
        onErrorRef.current(""); // Clear any previous errors

        // Rejoin stream after reconnection (no role for public viewers)
        socketInstance?.emit("join-stream", {
          streamId,
          quality,
        });
      });

      socketInstance.on("reconnect_error", (error) => {
        console.error("❌ Socket reconnection error:", error);
        onErrorRef.current(`Reconnection failed: ${error.message}`);
      });

      socketInstance.on("reconnect_failed", () => {
        console.error("❌ Socket reconnection failed completely");
        onErrorRef.current("Unable to reconnect. Please refresh the page and try again.");
      });

      // Handle stream started notification
      socketInstance.on("stream-started", (data: { streamId: string; startedAt?: string }) => {
        console.log("📡 Stream started notification received", data);
        // update stream metadata cache
        try {
          queryClient.setQueryData(["stream", data.streamId], (old: unknown) => ({
            ...((old as StreamMeta | undefined) ?? {}),
            status: "LIVE",
            startedAt: data.startedAt,
          }));
        } catch (err) {
          console.warn("Failed to update query cache on stream-started", err);
        }
      });

      // Handle stream ended notification
      socketInstance.on("stream-ended", (data: { streamId: string; endedAt?: string }) => {
        console.log("📡 Stream ended notification received:", data.streamId);
        // Cleanup WebRTC connection
        if (peerManagerRef.current) {
          peerManagerRef.current.destroy();
          peerManagerRef.current = null;
        }
        setRemoteStream(null);
        setIsConnected(false);
        onErrorRef.current("The stream has ended.");
        try {
          queryClient.setQueryData(["stream", data.streamId], (old: unknown) => ({
            ...((old as StreamMeta | undefined) ?? {}),
            status: "ENDED",
            endedAt: data.endedAt,
          }));
        } catch (err) {
          console.warn("Failed to update query cache on stream-ended", err);
        }
      });

      // Handle stream status changed
      socketInstance.on("stream-status-changed", (data: { streamId: string; status: string }) => {
        console.log("📡 Stream status changed:", data.streamId, data.status);
        try {
          queryClient.setQueryData(["stream", data.streamId], (old: unknown) => ({
            ...((old as StreamMeta | undefined) ?? {}),
            status: data.status,
          }));
        } catch (err) {
          console.warn("Failed to update query cache on stream-status-changed", err);
        }
        if (data.status === "ENDED") {
          // Cleanup WebRTC connection
          if (peerManagerRef.current) {
            peerManagerRef.current.destroy();
            peerManagerRef.current = null;
          }
          setRemoteStream(null);
          setIsConnected(false);
          onErrorRef.current("The stream has ended.");
        }
      });

      // Handle viewer count updates
      socketInstance.on("viewer-count", (data) => {
        console.log("👥 Viewer count:", data.count);
        onViewerCountChangeRef.current(data.count);
        try {
          queryClient.setQueryData(["stream", streamId], (old: unknown) => ({
            ...((old as StreamMeta | undefined) ?? {}),
            viewers: data.count,
          }));
        } catch (err) {
          console.warn("Failed to update query cache for viewer-count", err);
        }
      });

      // Listen for metadata updates from the server (e.g. recordingUrl or status changes)
      socketInstance.on(
        "stream-metadata-updated",
        (data: { streamId: string; metadata: Partial<StreamMeta> }) => {
          console.log("🛰️ stream-metadata-updated received:", data);
          try {
            queryClient.setQueryData(["stream", data.streamId], (old: unknown) => ({
              ...((old as StreamMeta | undefined) ?? {}),
              ...(data.metadata as Partial<StreamMeta>),
            }));
          } catch (err) {
            console.warn("Failed to update query cache for stream-metadata-updated", err);
          }
        }
      );

      // Listen for quality-applied acknowledgement from broadcaster
      socketInstance.on("quality-applied", async (data: { quality: string }) => {
        console.log("🎨 Quality applied:", data.quality);
        // show toast to user using dynamic ESM import to satisfy lint/SSG rules
        try {
          const mod = await import("react-hot-toast");
          const toast = mod.default ?? mod;
          toast.success(`Quality set to ${data.quality}`);
        } catch (err) {
          console.warn("Toast not available:", err);
        }
        try {
          queryClient.setQueryData(["stream", streamId], (old: unknown) => ({
            ...((old as StreamMeta | undefined) ?? {}),
            streamQuality: data.quality,
          }));
        } catch (err) {
          console.warn("Failed to update query cache for quality-applied", err);
        }
      });

      // WebRTC signaling - receive offer from broadcaster
      socketInstance.on("offer", (data) => {
        console.log("📡 Received offer from broadcaster");

        // Remember broadcasterId so we can target our answer/ICE messages back
        broadcasterIdRef.current = data.broadcasterId ?? null;

        // Create peer connection if not exists
        if (!peerManagerRef.current) {
          peerManagerRef.current = new PeerConnectionManager(
            false, // not initiator (viewer receives offer)
            (stream) => {
              console.log(
                "📺 Received remote stream",
                stream.getTracks().map((t) => `${t.kind}:${t.readyState}`)
              );
              setRemoteStream(stream);
            },
            (error) => {
              console.error("❌ Peer error:", error);
              onErrorRef.current(`Connection error: ${error.message}`);
            },
            () => {
              // onConnect - connection established
              console.log("✅ Viewer peer connection established");
              setIsConnected(true);
            },
            () => {
              // onDisconnect - connection lost
              console.log("🔌 Viewer peer connection lost");
              setRemoteStream(null);
            }
          );
        }

        // Create peer connection (as receiver)
        const peer = peerManagerRef.current.createPeerConnection(false);

        // Handle signal events (answer and ICE candidates)
        peer.on("signal", (signal) => {
          console.log("📡 Sending signal to broadcaster:", signal.type);

          if (signal.type === "answer") {
            // Send answer back to broadcaster
            socketInstance?.emit("answer", {
              streamId,
              answer: signal,
              targetId: broadcasterIdRef.current ?? socketInstance?.id ?? "",
            });
          } else if ("candidate" in signal && signal.candidate) {
            // Send ICE candidate to broadcaster
            socketInstance?.emit("ice-candidate", {
              streamId,
              candidate: signal.candidate,
              targetId: broadcasterIdRef.current ?? socketInstance?.id ?? "",
            });
          }
        });

        // Signal the offer to our peer
        peerManagerRef.current.signal(data.offer);
      });

      // Handle ICE candidates from broadcaster
      socketInstance.on("ice-candidate", (data) => {
        console.log("🧊 Received ICE candidate from broadcaster");
        if (peerManagerRef.current) {
          peerManagerRef.current.signal({
            type: "candidate",
            candidate: data.candidate,
          });
        }
      });

      // Handle errors from server
      socketInstance.on("error", (data) => {
        console.error("❌ Server error:", data.message);
        onErrorRef.current(data.message);
      });

      setSocket(socketInstance);
    };

    start();

    // Cleanup on unmount or restart
    return () => {
      console.log("🧹 Cleaning up WebRTC viewer...");
      if (socketInstance) {
        socketInstance.emit("leave-stream", { streamId });
        socketInstance.disconnect();
      }

      if (peerManagerRef.current) {
        peerManagerRef.current.destroy();
        peerManagerRef.current = null;
      }
      if (connectionTimeout !== undefined) clearTimeout(connectionTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive, streamId, restartCounter]);

  // Handle quality changes
  useEffect(() => {
    if (socket && isLive) {
      console.log("🎨 Changing quality to:", quality);
      socket.emit("change-quality-request", {
        streamId,
        quality,
      });
    }
  }, [quality, socket, isLive, streamId]);

  // Allow callers to force a silent reconnect (no full page reload)
  const reconnect = () => {
    console.log("🔁 Viewer requested silent reconnect");
    setIsReconnecting(true);
    // Clean up existing socket and peer manager
    try {
      if (socket) {
        socket.emit("leave-stream", { streamId });
        socket.disconnect();
        setSocket(null);
      }
    } catch (err) {
      console.warn("Error while disconnecting socket during reconnect:", err);
    }

    if (peerManagerRef.current) {
      peerManagerRef.current.destroy();
      peerManagerRef.current = null;
    }
    broadcasterIdRef.current = null;
    setIsConnected(false);
    setRemoteStream(null);

    // bump counter to re-run effect and recreate socket/peers
    setRestartCounter((c) => c + 1);
  };

  return {
    isConnected,
    remoteStream,
    socket,
    reconnect,
    isReconnecting,
  };
}
