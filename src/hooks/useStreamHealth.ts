"use client";

import { useState, useEffect, useRef } from "react";

export interface StreamHealthMetrics {
  // Bitrate (upload speed)
  bitrate: number; // kbps
  avgBitrate: number; // kbps

  // Frame rate
  fps: number;
  targetFps: number;

  // Dropped frames
  droppedFrames: number;
  totalFrames: number;

  // Network
  packetLoss: number; // percentage
  jitter: number; // ms
  rtt: number; // round trip time in ms

  // Connection quality
  quality: "excellent" | "good" | "fair" | "poor";

  // Warnings
  warnings: HealthWarning[];
}

export interface HealthWarning {
  id: string;
  type: "connection" | "cpu" | "memory" | "battery" | "bandwidth";
  severity: "info" | "warning" | "critical";
  message: string;
  timestamp: number;
}

interface UseStreamHealthProps {
  peerConnection: RTCPeerConnection | null;
  enabled: boolean;
}

export function useStreamHealth({ peerConnection, enabled }: UseStreamHealthProps) {
  const [metrics, setMetrics] = useState<StreamHealthMetrics>({
    bitrate: 0,
    avgBitrate: 0,
    fps: 0,
    targetFps: 30,
    droppedFrames: 0,
    totalFrames: 0,
    packetLoss: 0,
    jitter: 0,
    rtt: 0,
    quality: "good",
    warnings: [],
  });

  const previousStatsRef = useRef<RTCStatsReport | null>(null);
  const bitrateHistoryRef = useRef<number[]>([]);
  const warningsRef = useRef<Map<string, HealthWarning>>(new Map());

  useEffect(() => {
    if (!enabled || !peerConnection) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const stats = await peerConnection.getStats();
        const previousStats = previousStatsRef.current;

        let bitrate = 0;
        let fps = 0;
        let droppedFrames = 0;
        let totalFrames = 0;
        let packetLoss = 0;
        let jitter = 0;
        let rtt = 0;

        stats.forEach((report) => {
          // Outbound RTP (video)
          if (report.type === "outbound-rtp" && report.kind === "video") {
            if (previousStats) {
              const prevReport = Array.from(previousStats.values()).find(
                (r) =>
                  r.type === "outbound-rtp" &&
                  (r as RTCOutboundRtpStreamStats).kind === "video" &&
                  r.id === report.id
              ) as RTCOutboundRtpStreamStats | undefined;

              if (
                prevReport &&
                prevReport.bytesSent !== undefined &&
                prevReport.framesSent !== undefined
              ) {
                // Calculate bitrate
                const bytesSent = report.bytesSent - prevReport.bytesSent;
                const timeDiff = (report.timestamp - prevReport.timestamp) / 1000; // seconds
                bitrate = Math.round((bytesSent * 8) / timeDiff / 1000); // kbps

                // Calculate FPS
                const framesSent = report.framesSent - prevReport.framesSent;
                fps = Math.round(framesSent / timeDiff);

                // Track dropped frames
                droppedFrames = report.framesDropped || 0;
                totalFrames = report.framesSent || 0;
              }
            }
          }

          // Remote inbound RTP (for RTT and packet loss)
          if (report.type === "remote-inbound-rtp" && report.kind === "video") {
            rtt = report.roundTripTime ? Math.round(report.roundTripTime * 1000) : 0;
            packetLoss = report.packetsLost
              ? Math.round(
                  (report.packetsLost / (report.packetsReceived + report.packetsLost)) * 100
                )
              : 0;
            jitter = report.jitter ? Math.round(report.jitter * 1000) : 0;
          }
        });

        // Update bitrate history (keep last 30 samples)
        bitrateHistoryRef.current.push(bitrate);
        if (bitrateHistoryRef.current.length > 30) {
          bitrateHistoryRef.current.shift();
        }

        // Calculate average bitrate
        const avgBitrate =
          bitrateHistoryRef.current.length > 0
            ? Math.round(
                bitrateHistoryRef.current.reduce((sum, val) => sum + val, 0) /
                  bitrateHistoryRef.current.length
              )
            : 0;

        // Determine connection quality
        let quality: "excellent" | "good" | "fair" | "poor" = "excellent";
        if (packetLoss > 5 || rtt > 200 || bitrate < 500) {
          quality = "poor";
        } else if (packetLoss > 2 || rtt > 100 || bitrate < 1000) {
          quality = "fair";
        } else if (packetLoss > 0.5 || rtt > 50) {
          quality = "good";
        }

        // Generate warnings
        const newWarnings: HealthWarning[] = [];

        // Poor connection warning
        if (quality === "poor") {
          const warning: HealthWarning = {
            id: "poor-connection",
            type: "connection",
            severity: "critical",
            message: "Poor network connection detected. Stream quality may be affected.",
            timestamp: Date.now(),
          };
          warningsRef.current.set(warning.id, warning);
          newWarnings.push(warning);
        } else {
          warningsRef.current.delete("poor-connection");
        }

        // Low bitrate warning
        if (bitrate > 0 && bitrate < 500) {
          const warning: HealthWarning = {
            id: "low-bitrate",
            type: "bandwidth",
            severity: "warning",
            message: `Low upload speed (${bitrate} kbps). Consider lowering stream quality.`,
            timestamp: Date.now(),
          };
          warningsRef.current.set(warning.id, warning);
          newWarnings.push(warning);
        } else {
          warningsRef.current.delete("low-bitrate");
        }

        // High packet loss warning
        if (packetLoss > 2) {
          const warning: HealthWarning = {
            id: "packet-loss",
            type: "connection",
            severity: packetLoss > 5 ? "critical" : "warning",
            message: `High packet loss (${packetLoss}%). Network unstable.`,
            timestamp: Date.now(),
          };
          warningsRef.current.set(warning.id, warning);
          newWarnings.push(warning);
        } else {
          warningsRef.current.delete("packet-loss");
        }

        // Dropped frames warning
        const dropRate = totalFrames > 0 ? (droppedFrames / totalFrames) * 100 : 0;
        if (dropRate > 5) {
          const warning: HealthWarning = {
            id: "dropped-frames",
            type: "cpu",
            severity: dropRate > 10 ? "critical" : "warning",
            message: `High frame drop rate (${dropRate.toFixed(1)}%). CPU may be overloaded.`,
            timestamp: Date.now(),
          };
          warningsRef.current.set(warning.id, warning);
          newWarnings.push(warning);
        } else {
          warningsRef.current.delete("dropped-frames");
        }

        setMetrics({
          bitrate,
          avgBitrate,
          fps,
          targetFps: 30,
          droppedFrames,
          totalFrames,
          packetLoss,
          jitter,
          rtt,
          quality,
          warnings: Array.from(warningsRef.current.values()),
        });

        previousStatsRef.current = stats;
      } catch (error) {
        console.error("Error collecting stream health metrics:", error);
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [enabled, peerConnection]);

  return metrics;
}
