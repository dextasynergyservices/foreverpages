"use client";

import React from "react";
import { Circle } from "lucide-react";

interface RecordingIndicatorProps {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // in seconds
  size: number; // in bytes
}

const RecordingIndicator: React.FC<RecordingIndicatorProps> = ({
  isRecording,
  isPaused,
  duration,
  size,
}) => {
  if (!isRecording) {
    return null;
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="flex items-center gap-3 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-red-500/30">
      {/* REC Badge with animated dot */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Circle
            className={`h-3 w-3 fill-red-500 text-red-500 ${isPaused ? "" : "animate-pulse"}`}
          />
          {!isPaused && (
            <Circle className="absolute inset-0 h-3 w-3 text-red-500 animate-ping opacity-75" />
          )}
        </div>
        <span className="text-red-500 font-bold text-sm tracking-wider">
          {isPaused ? "PAUSED" : "REC"}
        </span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-gray-600" />

      {/* Duration */}
      <div className="flex items-center gap-1">
        <span className="text-white font-mono text-sm">{formatDuration(duration)}</span>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-gray-600" />

      {/* Size */}
      <div className="flex items-center gap-1">
        <span className="text-gray-300 text-xs font-medium">{formatSize(size)}</span>
      </div>
    </div>
  );
};

export default RecordingIndicator;
