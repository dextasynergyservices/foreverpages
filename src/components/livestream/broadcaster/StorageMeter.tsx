"use client";

import React from "react";
import { HardDrive, AlertTriangle } from "lucide-react";

interface StorageMeterProps {
  usedBytes: number;
  totalBytes: number;
  loading?: boolean;
}

const StorageMeter: React.FC<StorageMeterProps> = ({ usedBytes, totalBytes, loading = false }) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const percentage = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 95;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <HardDrive className="h-4 w-4 animate-pulse" />
        <span>Loading storage...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 bg-gray-900/50 border border-gray-800 rounded-lg p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Storage</span>
        </div>
        {(isWarning || isCritical) && (
          <AlertTriangle className={`h-4 w-4 ${isCritical ? "text-red-500" : "text-yellow-500"}`} />
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-full transition-all ${isCritical ? "bg-red-500" : isWarning ? "bg-yellow-500" : "bg-blue-500"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">
          {formatBytes(usedBytes)} / {formatBytes(totalBytes)}
        </span>
        <span
          className={`font-medium ${
            isCritical ? "text-red-500" : isWarning ? "text-yellow-500" : "text-gray-400"
          }`}
        >
          {percentage.toFixed(1)}% used
        </span>
      </div>

      {/* Warning Message */}
      {isCritical && (
        <div className="text-xs text-red-400 bg-red-900/20 border border-red-500/30 rounded px-2 py-1">
          ⚠️ Storage almost full! Delete old recordings to free space.
        </div>
      )}
      {isWarning && !isCritical && (
        <div className="text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-500/30 rounded px-2 py-1">
          Storage getting low. Consider upgrading your plan.
        </div>
      )}
    </div>
  );
};

export default StorageMeter;
