"use client";

import React, { useState } from "react";
import { StreamStatus, StreamQuality } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardContent } from "@/components/ui/card";
import { Play, Pause, Square, Loader2, Clock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BroadcastControlsProps {
  streamId: string;
  status: StreamStatus;
  quality: StreamQuality;
  isMediaReady: boolean;
  streamDuration: number;
  onStatusChange: (status: StreamStatus) => void;
  onQualityChange: (quality: StreamQuality) => void;
  onError: (error: string) => void;
}

const BroadcastControls: React.FC<BroadcastControlsProps> = ({
  streamId,
  status,
  quality,
  isMediaReady,
  streamDuration,
  onStatusChange,
  onQualityChange,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const [showEndOverlay, setShowEndOverlay] = useState(false);

  // Format duration as HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [hrs, mins, secs].map((v) => String(v).padStart(2, "0")).join(":");
  };

  // Start stream
  const handleStart = async () => {
    if (!isMediaReady) {
      onError("Media not ready. Please enable camera and microphone.");
      return;
    }

    try {
      setLoading(true);
      onError("");

      const response = await fetch(`/api/streams/${streamId}/start`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start stream");
      }

      onStatusChange("LIVE");
    } catch (error) {
      console.error("Failed to start stream:", error);
      onError(error instanceof Error ? error.message : "Failed to start stream");
    } finally {
      setLoading(false);
    }
  };

  // Pause stream
  const handlePause = async () => {
    try {
      setLoading(true);
      onError("");

      const response = await fetch(`/api/streams/${streamId}/pause`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to pause stream");
      }

      const data = await response.json();
      onStatusChange("PAUSED");
      // Optionally notify other parts of app
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("stream:status-changed", { detail: data.stream }));
      }
    } catch (error) {
      console.error("Failed to pause stream:", error);
      onError(error instanceof Error ? error.message : "Failed to pause stream");
    } finally {
      setLoading(false);
    }
  };

  // Resume stream
  const handleResume = async () => {
    try {
      setLoading(true);
      onError("");

      const response = await fetch(`/api/streams/${streamId}/resume`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to resume stream");
      }

      const data = await response.json();
      onStatusChange("LIVE");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("stream:status-changed", { detail: data.stream }));
      }
    } catch (error) {
      console.error("Failed to resume stream:", error);
      onError(error instanceof Error ? error.message : "Failed to resume stream");
    } finally {
      setLoading(false);
    }
  };

  // End stream
  const handleEnd = async () => {
    try {
      setLoading(true);
      setShowEndOverlay(true);
      setEndError(null);
      onError("");

      const response = await fetch(`/api/streams/${streamId}/end`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to end stream");
      }

      const data = await response.json();
      onStatusChange("ENDED");

      // Dispatch status change event for real-time updates
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("stream:status-changed", { detail: data.stream }));
        localStorage.setItem("streamEnded", "true");
      }

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        setShowEndOverlay(false);
        window.location.href = "/user-dashboard?section=livestreams";
      }, 2000);
    } catch (error) {
      console.error("Failed to end stream:", error);
      setEndError(error instanceof Error ? error.message : "Failed to end stream");
      setShowEndOverlay(false);
      onError(error instanceof Error ? error.message : "Failed to end stream");
    } finally {
      setLoading(false);
    }
  };

  const canStart = status === "SCHEDULED" && isMediaReady;
  const canPause = status === "LIVE";
  const canResume = status === "PAUSED";
  const canEnd = ["LIVE", "PAUSED"].includes(status);

  return (
    <>
      {/* Ending Stream Overlay */}
      {showEndOverlay && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-purple-400" />
            <p className="text-xl font-semibold text-white">Ending stream...</p>
            <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-purple-500 animate-pulse" style={{ width: "100%" }} />
            </div>
          </div>
        </div>
      )}
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Stream Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Stream Status</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={status} />
                {status === "LIVE" && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="h-4 w-4" />
                    {formatDuration(streamDuration)}
                  </div>
                )}
              </div>
            </div>

            {/* Quality Selector */}
            <div className="w-48">
              <Select
                value={quality}
                onValueChange={(value) => onQualityChange(value as StreamQuality)}
                disabled={status === "LIVE"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOWEST">144p - Lowest</SelectItem>
                  <SelectItem value="LOW">240p - Low</SelectItem>
                  <SelectItem value="MEDIUM">360p - Medium</SelectItem>
                  <SelectItem value="HIGH">480p - High</SelectItem>
                  <SelectItem value="HD">720p - HD</SelectItem>
                  <SelectItem value="FULL_HD">1080p - Full HD</SelectItem>
                </SelectContent>
              </Select>
              {status === "LIVE" && (
                <p className="text-xs text-gray-500 mt-1">Cannot change quality while streaming</p>
              )}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-3">
            {/* Start Button */}
            {canStart && (
              <Button
                onClick={handleStart}
                disabled={loading}
                size="lg"
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Go Live
                  </>
                )}
              </Button>
            )}

            {/* Pause Button */}
            {canPause && (
              <Button onClick={handlePause} variant="secondary" size="lg" className="flex-1">
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </Button>
            )}

            {/* Resume Button */}
            {canResume && (
              <Button
                onClick={handleResume}
                size="lg"
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Play className="h-5 w-5 mr-2" />
                Resume
              </Button>
            )}

            {/* End Button */}
            {canEnd && (
              <Button
                onClick={() => setShowEndConfirm(true)}
                variant="destructive"
                size="lg"
                disabled={loading}
              >
                <Square className="h-5 w-5 mr-2" />
                End Stream
              </Button>
            )}
          </div>

          {/* Help Text */}
          {status === "SCHEDULED" && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-sm text-blue-400">
                {isMediaReady
                  ? "Ready to go live! Click 'Go Live' to start broadcasting."
                  : "Please enable your camera and microphone to start streaming."}
              </p>
            </div>
          )}
        </div>

        {/* End Confirmation Dialog */}
        <AlertDialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>End Livestream?</AlertDialogTitle>
              <AlertDialogDescription>
                This will end the livestream for all viewers. The recording will be saved and
                available for 6 months. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {endError && (
              <div className="bg-red-600/20 text-red-400 rounded p-2 mb-2 text-sm">{endError}</div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleEnd} className="bg-red-600 hover:bg-red-700">
                End Stream
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* End fragment intentionally removed to fix JSX error */}
      </CardContent>
    </>
  );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: StreamStatus }> = ({ status }) => {
  const variants: Record<
    StreamStatus,
    { bg: string; text: string; label: string; animate?: boolean }
  > = {
    SCHEDULED: { bg: "bg-gray-500", text: "text-gray-100", label: "Scheduled" },
    STARTING: { bg: "bg-yellow-500", text: "text-yellow-100", label: "Starting..." },
    LIVE: {
      bg: "bg-red-500",
      text: "text-white",
      label: "● LIVE",
      animate: true,
    },
    PAUSED: { bg: "bg-orange-500", text: "text-orange-100", label: "Paused" },
    ENDING: { bg: "bg-gray-500", text: "text-gray-100", label: "Ending..." },
    ENDED: { bg: "bg-gray-700", text: "text-gray-300", label: "Ended" },
    CANCELLED: { bg: "bg-gray-600", text: "text-gray-300", label: "Cancelled" },
    FAILED: { bg: "bg-red-700", text: "text-red-100", label: "Failed" },
  };

  const config = variants[status];

  return (
    <div
      className={`${config.bg} ${config.text} text-sm font-bold px-3 py-1 rounded-full ${
        config.animate ? "animate-pulse" : ""
      }`}
    >
      {config.label}
    </div>
  );
};

export default BroadcastControls;
