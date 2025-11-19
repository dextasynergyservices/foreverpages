import SimplePeer from "simple-peer";
import { WEBRTC_CONFIG } from "./config";

/**
 * Extended SimplePeer instance with internal _pc property
 */
interface ExtendedSimplePeer extends SimplePeer.Instance {
  _pc?: RTCPeerConnection;
}

/**
 * WebRTC Peer Manager
 * Handles peer connections for broadcasting and viewing
 */

export class PeerConnectionManager {
  private peer: ExtendedSimplePeer | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private isConnected = false;
  private localStreamAttached = false;

  constructor(
    private isBroadcaster: boolean,
    private onStream?: (stream: MediaStream) => void,
    private onError?: (error: Error) => void,
    private onConnect?: () => void,
    private onDisconnect?: () => void
  ) {}

  /**
   * Create a new peer connection
   */
  createPeerConnection(initiator: boolean = false): ExtendedSimplePeer {
    if (this.peer) {
      this.peer.destroy();
    }

    // Clear any existing timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }

    this.peer = new SimplePeer({
      initiator,
      trickle: true,
      config: WEBRTC_CONFIG,
      stream: this.localStream || undefined,
      // Low-latency optimizations
      objectMode: false, // Binary mode for lower latency
      sdpTransform: (sdp: string) => {
        // Optimize SDP for lower latency
        return sdp
          .replace(
            /a=rtpmap:(\d+) opus\/48000\/2\r\n/g,
            "a=rtpmap:$1 opus/48000/2\r\na=fmtp:$1 maxplaybackrate=48000;stereo=1;useinbandfec=1\r\n"
          )
          .replace(/a=maxptime:60\r\n/g, "a=maxptime:20\r\n"); // Reduce max packet time for lower latency
      },
    });
    this.localStreamAttached = !!this.localStream;

    // Set connection timeout (60 seconds - increased for better reliability)
    this.connectionTimeout = setTimeout(() => {
      if (!this.isConnected) {
        console.error("⏰ WebRTC connection timeout");
        this.onError?.(
          new Error("Connection timeout. Please check your network connection and try again.")
        );
        this.destroy();
      }
    }, 60000); // Increased from 30s to 60s

    // Handle signals (for SDP and ICE candidates)
    this.peer.on("signal", (signal) => {
      console.log("📡 Signal:", signal.type);
      // Signal should be sent via Socket.io
    });

    // Handle incoming stream
    this.peer.on("stream", (stream) => {
      console.log("📺 Received remote stream");
      this.remoteStream = stream;
      this.onStream?.(stream);
    });

    // Handle connection
    this.peer.on("connect", () => {
      console.log("✅ Peer connected");
      this.isConnected = true;
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      this.onConnect?.();
    });

    // Handle errors
    this.peer.on("error", (err) => {
      console.error("❌ Peer error:", err);
      this.isConnected = false;
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      this.onError?.(err);
    });

    // Handle close
    this.peer.on("close", () => {
      console.log("🔌 Peer connection closed");
      this.isConnected = false;
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      this.onDisconnect?.();
    });

    return this.peer;
  }

  /**
   * Set local stream (broadcaster)
   */
  setLocalStream(stream: MediaStream): void {
    this.localStream = stream;
    if (!this.peer) return;

    // Prefer replacing tracks on existing RTCPeerConnection to avoid
    // calling addStream repeatedly which leads to "Track has already been added"
    const pc = this.peer._pc;
    if (pc) {
      try {
        const senders = pc.getSenders();

        // For each track in the new stream, replace an existing sender's track
        // of the same kind if present, otherwise add the track to the connection.
        stream.getTracks().forEach((track) => {
          const existing = senders.find((s) => s.track && s.track.kind === track.kind);
          if (existing && typeof existing.replaceTrack === "function") {
            try {
              existing.replaceTrack(track);
            } catch (_e) {
              console.warn("Failed to replace track, attempting to add track:", _e);
              // If replaceTrack fails, attempt to add track (addTrack will throw if duplicate)
              try {
                pc.addTrack(track, stream);
              } catch (_e) {
                console.warn("Failed to replace or add track:", _e);
              }
            }
          } else {
            try {
              pc.addTrack(track, stream);
            } catch (_e) {
              // Ignore failures adding duplicate tracks
              console.warn("Failed to add track to RTCPeerConnection:", _e);
            }
          }
        });
      } catch (e) {
        console.warn("Error updating RTCPeerConnection senders:", e);
      }
      return;
    }

    // If the RTCPeerConnection isn't ready yet but the peer exists, add the
    // stream once using peer.addStream — but guard against duplicates using
    // localStreamAttached flag.
    if (!pc) {
      if (!this.localStreamAttached) {
        try {
          this.peer.addStream(stream);
          this.localStreamAttached = true;
        } catch (e) {
          console.warn("peer.addStream failed (likely duplicate):", e);
        }
      }
      return;
    }

    // If we successfully used pc to add/replace tracks above, mark attached
    this.localStreamAttached = true;
  }

  /**
   * Signal remote peer
   */
  signal(data: SimplePeer.SignalData): void {
    if (this.peer) {
      this.peer.signal(data);
    }
  }

  /**
   * Get remote stream
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Get the underlying RTCPeerConnection
   */
  getRTCPeerConnection(): RTCPeerConnection | null {
    return this.peer?._pc || null;
  }

  /**
   * Get connection stats
   */
  async getStats(): Promise<RTCStatsReport | null> {
    if (!this.peer?._pc) {
      return null;
    }

    return await this.peer._pc.getStats();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    this.remoteStream = null;
    this.isConnected = false;
    this.localStreamAttached = false;
  }
}
