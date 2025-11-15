"use client";

import React from "react";
import { FaArrowUp } from "react-icons/fa";
import { Progress } from "@/components/ui/progress";

interface BitrateIndicatorProps {
  currentBitrate: number;
  avgBitrate: number;
  quality: "excellent" | "good" | "fair" | "poor";
}

const BitrateIndicator: React.FC<BitrateIndicatorProps> = ({
  currentBitrate,
  avgBitrate,
  quality,
}) => {
  const getProgressColor = () => {
    switch (quality) {
      case "excellent":
        return "bg-green-500";
      case "good":
        return "bg-blue-500";
      case "fair":
        return "bg-yellow-500";
      case "poor":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getProgressClass = () => {
    switch (quality) {
      case "excellent":
        return "[&>div]:bg-green-500";
      case "good":
        return "[&>div]:bg-blue-500";
      case "fair":
        return "[&>div]:bg-yellow-500";
      case "poor":
        return "[&>div]:bg-red-500";
      default:
        return "[&>div]:bg-gray-500";
    }
  };

  // Calculate percentage for visual representation (assuming max 10 Mbps = 10000 kbps)
  const maxBitrate = 10000;
  const percentage = Math.min((currentBitrate / maxBitrate) * 100, 100);

  const formatBitrate = (kbps: number) => {
    if (kbps >= 1000) {
      return `${(kbps / 1000).toFixed(1)} Mbps`;
    }
    return `${kbps} kbps`;
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaArrowUp className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-400">Upload Speed</span>
        </div>
        <span className="text-xs text-gray-400">Avg: {formatBitrate(avgBitrate)}</span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${getProgressColor().replace("bg-", "text-")}`}>
          {formatBitrate(currentBitrate)}
        </span>
      </div>

      <Progress value={percentage} className={`h-2 ${getProgressClass()}`} />

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>0 kbps</span>
        <span>10 Mbps</span>
      </div>
    </div>
  );
};

export default BitrateIndicator;
