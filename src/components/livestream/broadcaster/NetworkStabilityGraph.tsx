"use client";

import React, { useEffect, useRef } from "react";
import { StreamHealthMetrics } from "@/hooks/useStreamHealth";

interface NetworkStabilityGraphProps {
  metrics: StreamHealthMetrics;
}

const NetworkStabilityGraph: React.FC<NetworkStabilityGraphProps> = ({ metrics }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataPointsRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Add current quality as data point (convert to 0-100 scale)
    const qualityValue =
      metrics.quality === "excellent"
        ? 100
        : metrics.quality === "good"
          ? 75
          : metrics.quality === "fair"
            ? 50
            : 25;

    dataPointsRef.current.push(qualityValue);

    // Keep only last 30 data points (30 seconds at 1 update/sec)
    if (dataPointsRef.current.length > 30) {
      dataPointsRef.current.shift();
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (canvas.height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw the line graph
    if (dataPointsRef.current.length > 1) {
      const spacing = canvas.width / (dataPointsRef.current.length - 1);

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "rgba(34, 197, 94, 0.5)"); // green
      gradient.addColorStop(0.25, "rgba(59, 130, 246, 0.5)"); // blue
      gradient.addColorStop(0.5, "rgba(234, 179, 8, 0.5)"); // yellow
      gradient.addColorStop(1, "rgba(239, 68, 68, 0.5)"); // red

      // Draw filled area
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);

      dataPointsRef.current.forEach((value, index) => {
        const x = index * spacing;
        const y = canvas.height - (value / 100) * canvas.height;
        if (index === 0) {
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw line
      ctx.beginPath();
      dataPointsRef.current.forEach((value, index) => {
        const x = index * spacing;
        const y = canvas.height - (value / 100) * canvas.height;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      // Determine line color based on current quality
      ctx.strokeStyle =
        metrics.quality === "excellent"
          ? "#22c55e"
          : metrics.quality === "good"
            ? "#3b82f6"
            : metrics.quality === "fair"
              ? "#eab308"
              : "#ef4444";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw dots
      dataPointsRef.current.forEach((value, index) => {
        const x = index * spacing;
        const y = canvas.height - (value / 100) * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      });
    }
  }, [metrics]);

  return (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">Network Stability (30s)</span>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-gray-400">Excellent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-gray-400">Poor</span>
          </div>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={300}
        height={80}
        className="w-full h-20 rounded"
        style={{ imageRendering: "crisp-edges" }}
      />
    </div>
  );
};

export default NetworkStabilityGraph;
