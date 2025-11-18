"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { PeerConnectionManager } from "@/lib/webrtc/peerManager";
import { getSocketUrl } from "@/lib/socket/getSocketUrl";

interface UseWebRTCBroadcastProps {
  streamId: string;
  localStream: MediaStream | null;
  isLive: boolean;
  onViewerCountChange: (count: number) => void;
  onError: (error: string) => void;
  onConnectionChange: (isConnected: boolean) => void;
}

interface Peer {
  id: string;
  peerConnection: PeerConnectionManager;
}

export function useWebRTCBroadcast({
  streamId,
  localStream,
  isLive,
  onViewerCountChange,
  onError,
  onConnectionChange,
}: UseWebRTCBroadcastProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const peersRef = useRef<Map<string, Peer>>(new Map());

  // Keep ref in sync with state
  useEffect(() => {
    peersRef.current = peers;
  }, [peers]);

  // Initialize socket connection
  useEffect(() => {
    if (!isLive) return;

    console.log("🔌 Connecting to Socket.io server...");

    let socketInstance: Socket | null = null;
    let connectionTimeout: ReturnType<typeof setTimeout> | null = null;

    const start = async () => {
      // Fetch short-lived signaling token
      let token: string | null = null;
      try {
        console.log("[broadcast hook] requesting /api/signaling/token (sending credentials)");
        const res = await fetch("/api/signaling/token", { credentials: "include" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.warn("[broadcast hook] token endpoint error body:", body, "status", res.status);
          throw new Error(body?.error || `token endpoint returned ${res.status}`);
        }
        const b = await res.json();
        token = b.token;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("❌ Failed to fetch signaling token:", message);
        onError("Failed to obtain signaling token. Please ensure you're signed in.");
        return;
      }

      if (!token) return;

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

      // Connection timeout handler
      connectionTimeout = setTimeout(() => {
        if (!isConnected) {
          console.error("⏰ Socket connection timeout");
          onError("Connection timeout. Please check your internet connection and try again.");
          setIsConnected(false);
          onConnectionChange(false);
        }
      }, 15000); // 15 second timeout

      // Connection events
      socketInstance.on("connect", () => {
        console.log("✅ Socket connected:", socketInstance!.id);
        if (connectionTimeout) clearTimeout(connectionTimeout);
        setIsConnected(true);
        onConnectionChange(true);

        // Join stream as broadcaster
        socketInstance!.emit("join-stream", {
          streamId,
          role: "broadcaster",
        });
      });

      socketInstance.on("disconnect", (reason) => {
        console.log("🔌 Socket disconnected:", reason);
        setIsConnected(false);
        onConnectionChange(false);

        // If disconnected due to error, show user-friendly message
        if (reason === "io server disconnect" || reason === "io client disconnect") {
          onError("Connection lost. Attempting to reconnect...");
        }
      });

      socketInstance.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
        if (connectionTimeout) clearTimeout(connectionTimeout);
        onError(`Connection failed: ${error.message}. Please check your internet connection.`);
        setIsConnected(false);
        onConnectionChange(false);
      });

      socketInstance.on("reconnect", (attemptNumber) => {
        console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
        onConnectionChange(true);
        onError(""); // Clear any previous errors
      });

      socketInstance.on("reconnect_error", (error) => {
        console.error("❌ Socket reconnection error:", error);
        onError(`Reconnection failed: ${error.message}`);
      });

      socketInstance.on("reconnect_failed", () => {
        console.error("❌ Socket reconnection failed completely");
        onError("Unable to reconnect. Please refresh the page and try again.");
      });

      // Viewer joined - create peer connection
      socketInstance.on("viewer-joined", (data) => {
        console.log("👤 Viewer joined:", data.viewerId);
        onViewerCountChange(data.viewerCount);

        // Create peer connection for this viewer
        createPeerConnection(data.viewerId, socketInstance!);
      });

      // Fallback: viewer indicates readiness to receive an offer (in case server missed forwarding)
      socketInstance.on("viewer-ready", (data) => {
        console.log("📣 Viewer ready received (fallback):", data.viewerId);
        // If we don't already have a peer for this viewer, create one
        if (!peersRef.current.has(data.viewerId)) {
          createPeerConnection(data.viewerId, socketInstance!);
        }
      });

      // Handle explicit quality change requests from viewers
      socketInstance.on(
        "change-quality-request",
        async (data: { quality: string; requesterId?: string }) => {
          console.log("🔔 Received quality change request:", data.quality);

          // Map quality to approximate constraints
          const qualityMap: Record<string, MediaTrackConstraints> = {
            FULL_HD: { width: { ideal: 1920 }, height: { ideal: 1080 } },
            HD: { width: { ideal: 1280 }, height: { ideal: 720 } },
            SD: { width: { ideal: 854 }, height: { ideal: 480 } },
            MEDIUM: { width: { ideal: 640 }, height: { ideal: 360 } },
            LOW: { width: { ideal: 426 }, height: { ideal: 240 } },
            LOWEST: { width: { ideal: 256 }, height: { ideal: 144 } },
          };

          const constraints = qualityMap[data.quality] || qualityMap.FULL_HD;

          try {
            if (localStream) {
              const tracks = localStream.getVideoTracks();
              for (const track of tracks) {
                try {
                  await track.applyConstraints(constraints);
                } catch (err) {
                  console.warn("⚠️ Failed to apply constraints on track:", err);
                }
              }

              // Notify viewers that quality has been applied
              socketInstance?.emit("quality-applied", { streamId, quality: data.quality });
              console.log("✅ Emitted quality-applied to viewers", data.quality);
            }
          } catch (err) {
            console.warn("Error handling quality request:", err);
          }
        }
      );

      // Viewer left
      socketInstance.on("viewer-left", (data) => {
        console.log("👤 Viewer left:", data.viewerId);
        onViewerCountChange(data.viewerCount);

        // Remove peer connection
        removePeerConnection(data.viewerId);
      });

      // Viewer count update
      socketInstance.on("viewer-count", (data) => {
        onViewerCountChange(data.count);
      });

      // Handle answer from viewer
      socketInstance.on("answer", (data) => {
        console.log("📡 Received answer from:", data.viewerId);
        const peer = peersRef.current.get(data.viewerId);
        if (peer) {
          peer.peerConnection.signal(data.answer);
        }
      });

      // Handle ICE candidate from viewer
      socketInstance.on("ice-candidate", (data) => {
        console.log("🧊 Received ICE candidate from:", data.senderId);
        const peer = peersRef.current.get(data.senderId);
        if (peer) {
          peer.peerConnection.signal({
            type: "candidate",
            candidate: data.candidate,
          });
        }
      });

      // Error from server
      socketInstance.on("error", (data) => {
        console.error("❌ Server error:", data.message);
        onError(data.message);
      });

      // Handle quality change requests from viewers
      socketInstance.on("quality-changed", async (data: { quality: string }) => {
        console.log("🔁 Received quality change request:", data.quality);

        // Map quality to approximate resolution constraints
        const qualityMap: Record<string, MediaTrackConstraints> = {
          FULL_HD: { width: { ideal: 1920 }, height: { ideal: 1080 } },
          HD: { width: { ideal: 1280 }, height: { ideal: 720 } },
          SD: { width: { ideal: 854 }, height: { ideal: 480 } },
          MEDIUM: { width: { ideal: 640 }, height: { ideal: 360 } },
          LOW: { width: { ideal: 426 }, height: { ideal: 240 } },
          LOWEST: { width: { ideal: 256 }, height: { ideal: 144 } },
        };

        const constraints = qualityMap[data.quality] || qualityMap.FULL_HD;

        try {
          if (localStream) {
            // Attempt to apply constraints to existing tracks
            localStream.getVideoTracks().forEach(async (track) => {
              // applyConstraints may not be supported by all browsers; try-catch
              try {
                await track.applyConstraints(constraints);
                console.log("✅ Applied new constraints to local track", constraints);
              } catch (err) {
                console.warn("⚠️ Failed to apply constraints to track:", err);
              }
            });
          }
        } catch (err) {
          console.warn("Error changing quality:", err);
        }
      });

      // Handle stream ended notification
      socketInstance.on("stream-ended", (data) => {
        console.log("📡 Stream ended notification received:", data.streamId);
        // Cleanup all peer connections
        peersRef.current.forEach((peer) => {
          peer.peerConnection.destroy();
        });
        peersRef.current.clear();
        setPeers(new Map());
        setIsConnected(false);
        onConnectionChange(false);
      });

      // Handle stream status changed
      socketInstance.on("stream-status-changed", (data) => {
        console.log("📡 Stream status changed:", data.streamId, data.status);
        if (data.status === "ENDED") {
          // Cleanup all peer connections
          peersRef.current.forEach((peer) => {
            peer.peerConnection.destroy();
          });
          peersRef.current.clear();
          setPeers(new Map());
          setIsConnected(false);
          onConnectionChange(false);
        }
      });

      setSocket(socketInstance);
    };

    start();

    return () => {
      console.log("🔌 Cleaning up socket connection...");
      if (socketInstance) {
        socketInstance.emit("leave-stream", { streamId });
        socketInstance.disconnect();
      }

      // Cleanup all peer connections
      peersRef.current.forEach((peer) => {
        peer.peerConnection.destroy();
      });
      peersRef.current.clear();
      if (connectionTimeout) clearTimeout(connectionTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive, streamId]);

  // Update local stream for all peers when it changes
  useEffect(() => {
    if (!localStream) return;

    console.log("📹 Updating local stream for all peers...");
    peers.forEach((peer) => {
      peer.peerConnection.setLocalStream(localStream);
    });
  }, [localStream, peers]);

  // Remove peer connection
  const removePeerConnection = useCallback((viewerId: string) => {
    const peer = peersRef.current.get(viewerId);
    if (peer) {
      console.log("🗑️ Removing peer connection for:", viewerId);
      peer.peerConnection.destroy();
      setPeers((prev) => {
        const updated = new Map(prev);
        updated.delete(viewerId);
        return updated;
      });
    }
  }, []);

  // Create peer connection for a viewer
  const createPeerConnection = useCallback(
    (viewerId: string, socketInstance: Socket) => {
      if (peersRef.current.has(viewerId)) {
        console.log("⚠️ Peer connection already exists for:", viewerId);
        return;
      }

      console.log("🔗 Creating peer connection for viewer:", viewerId);

      const peerConnection = new PeerConnectionManager(
        true, // isBroadcaster
        undefined, // onStream (not needed for broadcaster)
        (error) => {
          console.error("❌ Peer error for", viewerId, error);
          onError(`Peer connection error: ${error.message}`);
          removePeerConnection(viewerId);
        },
        () => {
          // onConnect - peer connection established
          console.log("✅ Peer connection established for:", viewerId);
        },
        () => {
          // onDisconnect - peer connection lost
          console.log("🔌 Peer connection lost for:", viewerId);
          removePeerConnection(viewerId);
        }
      );

      // Set local stream
      if (localStream) {
        peerConnection.setLocalStream(localStream);
      }

      // Create peer (broadcaster initiates)
      const peer = peerConnection.createPeerConnection(true);

      // Handle signal events (SDP offer and ICE candidates)
      peer.on("signal", (signal) => {
        console.log("📡 Sending signal to viewer:", viewerId, signal.type);

        if (signal.type === "offer") {
          // Send offer to specific viewer
          socketInstance.emit("offer", {
            streamId,
            offer: signal,
            targetId: viewerId,
          });
        } else if ("candidate" in signal && signal.candidate) {
          // Send ICE candidate to specific viewer
          socketInstance.emit("ice-candidate", {
            streamId,
            candidate: signal.candidate,
            targetId: viewerId,
          });
        }
      });

      // Store peer connection
      const newPeer: Peer = {
        id: viewerId,
        peerConnection,
      };

      setPeers((prev) => {
        const updated = new Map(prev);
        updated.set(viewerId, newPeer);
        return updated;
      });

      console.log("✅ Peer connection created for:", viewerId);
    },
    [localStream, streamId, onError, removePeerConnection]
  );

  // Get connection stats
  const getConnectionStats = useCallback(async () => {
    const stats = [];
    for (const [viewerId, peer] of peers) {
      const peerStats = await peer.peerConnection.getStats();
      if (peerStats) {
        stats.push({
          viewerId,
          stats: peerStats,
        });
      }
    }
    return stats;
  }, [peers]);

  // Get first peer connection for health monitoring
  const getFirstPeerConnection = useCallback((): RTCPeerConnection | null => {
    const firstPeer = Array.from(peersRef.current.values())[0];
    return firstPeer?.peerConnection?.getRTCPeerConnection() || null;
  }, []);

  return {
    isConnected,
    peerCount: peers.size,
    socket,
    getConnectionStats,
    getFirstPeerConnection,
  };
}
