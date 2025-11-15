"use client";

import { useEffect, useState, useRef } from "react";
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
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerManagerRef = useRef<PeerConnectionManager | null>(null);

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
    if (!isLive) {
      // Cleanup if stream ends
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      if (peerManagerRef.current) {
        peerManagerRef.current.destroy();
        peerManagerRef.current = null;
      }
      setRemoteStream(null);
      setIsConnected(false);
      return;
    }

    console.log("🎥 Initializing WebRTC viewer for stream:", streamId);

    // Connect to Socket.io using helper that prefers NEXT_PUBLIC_SOCKET_URL or falls back to window.location.origin
    const socketInstance = io(getSocketUrl(), {
      path: "/api/socket",
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionAttempts: 10,
      timeout: 10000,
      transports: ["websocket", "polling"],
      forceNew: false,
      upgrade: true,
    });

    // Connection timeout handler - increased to 30 seconds
    const connectionTimeout = setTimeout(() => {
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
      console.log("✅ Socket connected:", socketInstance.id);
      clearTimeout(connectionTimeout);
      setIsConnected(true);

      // Join stream as viewer
      socketInstance.emit("join-stream", {
        streamId,
        role: "viewer",
        quality,
      });
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
      onErrorRef.current(""); // Clear any previous errors

      // Rejoin stream after reconnection
      socketInstance.emit("join-stream", {
        streamId,
        role: "viewer",
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
    socketInstance.on("stream-started", () => {
      console.log("📡 Stream started notification received");
    });

    // Handle stream ended notification
    socketInstance.on("stream-ended", (data) => {
      console.log("📡 Stream ended notification received:", data.streamId);
      // Cleanup WebRTC connection
      if (peerManagerRef.current) {
        peerManagerRef.current.destroy();
        peerManagerRef.current = null;
      }
      setRemoteStream(null);
      setIsConnected(false);
      onErrorRef.current("The stream has ended.");
    });

    // Handle stream status changed
    socketInstance.on("stream-status-changed", (data) => {
      console.log("📡 Stream status changed:", data.streamId, data.status);
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
    });

    // WebRTC signaling - receive offer from broadcaster
    socketInstance.on("offer", (data) => {
      console.log("📡 Received offer from broadcaster");

      // Create peer connection if not exists
      if (!peerManagerRef.current) {
        peerManagerRef.current = new PeerConnectionManager(
          false, // not initiator (viewer receives offer)
          (stream) => {
            console.log("📺 Received remote stream");
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
          socketInstance.emit("answer", {
            streamId,
            answer: signal,
            viewerId: socketInstance.id,
          });
        } else if ("candidate" in signal && signal.candidate) {
          // Send ICE candidate to broadcaster
          socketInstance.emit("ice-candidate", {
            streamId,
            candidate: signal.candidate,
            senderId: socketInstance.id,
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

    // Cleanup on unmount
    return () => {
      console.log("🧹 Cleaning up WebRTC viewer...");
      socketInstance.emit("leave-stream", { streamId });
      socketInstance.disconnect();

      if (peerManagerRef.current) {
        peerManagerRef.current.destroy();
        peerManagerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive, streamId]);

  // Handle quality changes
  useEffect(() => {
    if (socket && isLive) {
      console.log("🎨 Changing quality to:", quality);
      socket.emit("change-quality", {
        streamId,
        quality,
      });
    }
  }, [quality, socket, isLive, streamId]);

  return {
    isConnected,
    remoteStream,
    socket,
  };
}
