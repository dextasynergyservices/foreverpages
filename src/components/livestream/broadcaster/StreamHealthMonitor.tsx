"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FaWifi, FaVideo, FaTachometerAlt } from "react-icons/fa";
import { MdSpeed } from "react-icons/md";
import { StreamHealthMetrics } from "@/hooks/useStreamHealth";
import BitrateIndicator from "./BitrateIndicator";
import NetworkStabilityGraph from "@/components/livestream/broadcaster/NetworkStabilityGraph";
import HealthWarnings from "@/components/livestream/broadcaster/HealthWarnings";

interface StreamHealthMonitorProps {
  metrics: StreamHealthMetrics;
  isStreaming: boolean;
}

const StreamHealthMonitor: React.FC<StreamHealthMonitorProps> = ({ metrics, isStreaming }) => {
  if (!isStreaming) {
    return null;
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "bg-green-500/10 text-green-500 border-green-500/30";
      case "good":
        return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "fair":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
      case "poor":
        return "bg-red-500/10 text-red-500 border-red-500/30";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/30";
    }
  };

  const dropRate =
    metrics.totalFrames > 0
      ? ((metrics.droppedFrames / metrics.totalFrames) * 100).toFixed(1)
      : "0.0";

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <FaWifi className="h-5 w-5" />
            Stream Health
          </CardTitle>
          <Badge variant="outline" className={getQualityColor(metrics.quality)}>
            {metrics.quality.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warnings */}
        {metrics.warnings.length > 0 && <HealthWarnings warnings={metrics.warnings} />}

        {/* Bitrate Indicator */}
        <BitrateIndicator
          currentBitrate={metrics.bitrate}
          avgBitrate={metrics.avgBitrate}
          quality={metrics.quality}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* FPS */}
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FaVideo className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-400">Frame Rate</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">{metrics.fps}</span>
              <span className="text-sm text-gray-400">fps</span>
            </div>
          </div>

          {/* RTT */}
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <MdSpeed className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-400">Latency</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">{metrics.rtt}</span>
              <span className="text-sm text-gray-400">ms</span>
            </div>
          </div>

          {/* Packet Loss */}
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FaTachometerAlt className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-400">Packet Loss</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-2xl font-bold ${
                  metrics.packetLoss > 5
                    ? "text-red-500"
                    : metrics.packetLoss > 2
                      ? "text-yellow-500"
                      : "text-green-500"
                }`}
              >
                {metrics.packetLoss.toFixed(1)}
              </span>
              <span className="text-sm text-gray-400">%</span>
            </div>
          </div>

          {/* Dropped Frames */}
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FaVideo className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-400">Dropped</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-2xl font-bold ${
                  parseFloat(dropRate) > 10
                    ? "text-red-500"
                    : parseFloat(dropRate) > 5
                      ? "text-yellow-500"
                      : "text-green-500"
                }`}
              >
                {dropRate}
              </span>
              <span className="text-sm text-gray-400">%</span>
            </div>
          </div>
        </div>

        {/* Network Stability Graph */}
        <NetworkStabilityGraph metrics={metrics} />
      </CardContent>
    </Card>
  );
};

export default StreamHealthMonitor;
