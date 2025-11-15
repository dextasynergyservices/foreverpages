"use client";

import React, { useState, useEffect } from "react";
import { StreamStatus, StreamQuality } from "@/generated/prisma";
import BroadcastControls from "@/components/livestream/broadcaster/BroadcastControls";
import MediaPreview from "@/components/livestream/broadcaster/MediaPreview";
import ViewerCount from "@/components/livestream/broadcaster/ViewerCount";
import ChatFeed from "@/components/livestream/broadcaster/ChatFeed";
import ConnectionStatus from "@/components/livestream/broadcaster/ConnectionStatus";
import StreamSettingsPanel from "@/components/livestream/broadcaster/StreamSettingsPanel";
import RecordingIndicator from "@/components/livestream/broadcaster/RecordingIndicator";
import RecordingControls from "@/components/livestream/broadcaster/RecordingControls";
import StorageMeter from "@/components/livestream/broadcaster/StorageMeter";
import StreamHealthMonitor from "@/components/livestream/broadcaster/StreamHealthMonitor";
import ViewerList from "@/components/livestream/broadcaster/ViewerList";
import QuickActionsPanel from "@/components/livestream/broadcaster/QuickActionsPanel";
import CountdownTimer from "@/components/livestream/broadcaster/CountdownTimer";
import StreamDurationTimer from "@/components/livestream/broadcaster/StreamDurationTimer";
import ScheduleManager from "@/components/livestream/broadcaster/ScheduleManager";
import { Card } from "@/components/ui/card";
import { useWebRTCBroadcast } from "@/hooks/useWebRTCBroadcast";
import { useMediaRecorder, RecordingQuality } from "@/hooks/useMediaRecorder";
import { useStreamHealth } from "@/hooks/useStreamHealth";
import toast from "react-hot-toast";

interface BroadcasterInterfaceProps {
  streamId: string;
  streamTitle: string;
  streamStatus: StreamStatus;
  memorialName: string;
  memorialSlug: string;
  enableChat: boolean;
  enableReactions: boolean;
  quality: StreamQuality;
  scheduledFor?: Date | null;
  scheduledEnd?: Date | null;
  autoStart?: boolean;
  autoEnd?: boolean;
}

const BroadcasterInterface: React.FC<BroadcasterInterfaceProps> = ({
  streamId,
  streamTitle,
  streamStatus: initialStatus,
  memorialName,
  memorialSlug,
  enableChat: initialEnableChat,
  enableReactions: initialEnableReactions,
  quality: initialQuality,
  scheduledFor: initialScheduledFor,
  scheduledEnd: initialScheduledEnd,
  autoStart: initialAutoStart = false,
  autoEnd: initialAutoEnd = false,
}) => {
  const [status, setStatus] = useState<StreamStatus>(initialStatus);
  const [quality, setQuality] = useState<StreamQuality>(initialQuality);
  const [error, setError] = useState<string | null>(null);

  // Chat & Reactions state (controlled by settings panel)
  const [enableChat, setEnableChat] = useState(initialEnableChat);
  const [enableReactions, setEnableReactions] = useState(initialEnableReactions);

  // Media state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMediaReady, setIsMediaReady] = useState(false);

  // Stream stats
  const [viewerCount, setViewerCount] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);

  // Recording state
  const [recordingQuality, setRecordingQuality] = useState<RecordingQuality>("high");
  const [autoDownload, setAutoDownload] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal, setStorageTotal] = useState(0);
  const [storageLoading, setStorageLoading] = useState(true);

  // Quick actions state
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isEmergencyPaused, setIsEmergencyPaused] = useState(false);
  const [originalStream, setOriginalStream] = useState<MediaStream | null>(null);

  // Convert scheduling props to Date objects (schedule times don't change during broadcast)
  const scheduledFor = initialScheduledFor ? new Date(initialScheduledFor) : null;
  const scheduledEnd = initialScheduledEnd ? new Date(initialScheduledEnd) : null;

  // Scheduling state (only for toggleable settings)
  const [autoStart, setAutoStart] = useState(initialAutoStart);
  const [autoEnd, setAutoEnd] = useState(initialAutoEnd);

  // MediaRecorder hook
  const {
    isRecording,
    isPaused,
    duration: recordingDuration,
    size: recordingSize,
    error: recordingError,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  } = useMediaRecorder({
    streamId,
    stream: localStream,
    quality: recordingQuality,
    autoDownload,
    onRecordingComplete: async (recording) => {
      // Upload recording to Cloudinary
      try {
        const formData = new FormData();
        formData.append("video", recording.blob, `stream-${streamId}.webm`);

        const response = await fetch(`/api/streams/${streamId}/upload-recording`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload recording");
        }

        // Parse server response and notify other UI parts that the recording is ready
        try {
          const json = await response.json();
          const updatedStream = json?.stream || null;
          if (updatedStream && typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("stream:recording-ready", { detail: updatedStream })
            );
          }
        } catch (e) {
          // Non-fatal: ignore JSON parse failures
          console.warn("Could not parse upload response JSON", e);
        }

        toast.success("Recording uploaded successfully");
        // Refresh storage usage
        fetchStorageUsage();
      } catch (err) {
        console.error("Recording upload error:", err);
        toast.error("Failed to upload recording");
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // Fetch storage usage on mount
  const fetchStorageUsage = async () => {
    try {
      const response = await fetch("/api/user/storage");
      if (response.ok) {
        const data = await response.json();
        setStorageUsed(data.usedBytes);
        setStorageTotal(data.totalBytes);
      }
    } catch (err) {
      console.error("Failed to fetch storage:", err);
    } finally {
      setStorageLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageUsage();
  }, []);

  // WebRTC broadcast connection
  const { isConnected, getFirstPeerConnection } = useWebRTCBroadcast({
    streamId,
    localStream,
    isLive: status === "LIVE",
    onViewerCountChange: setViewerCount,
    onError: setError,
    onConnectionChange: (connected) => {
      console.log("🔌 Connection status changed:", connected);
    },
  });

  // Stream health monitoring
  const healthMetrics = useStreamHealth({
    peerConnection: getFirstPeerConnection(),
    enabled: status === "LIVE" && isConnected,
  });

  useEffect(() => {
    // Start duration timer if stream is LIVE
    if (status === "LIVE") {
      const interval = setInterval(() => {
        setStreamDuration((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status]);

  const handleStatusChange = (newStatus: StreamStatus) => {
    setStatus(newStatus);
  };

  const handleQualityChange = (newQuality: StreamQuality) => {
    setQuality(newQuality);
    // TODO: Implement quality change in WebRTC
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // Settings Panel Callbacks
  const handleChatToggle = (enabled: boolean) => {
    setEnableChat(enabled);
    toast.success(enabled ? "Chat enabled" : "Chat disabled");
  };

  const handleReactionsToggle = (enabled: boolean) => {
    setEnableReactions(enabled);
    toast.success(enabled ? "Reactions enabled" : "Reactions disabled");
  };

  const handleCameraChange = async (deviceId: string) => {
    try {
      // Stop current video track
      localStream?.getVideoTracks().forEach((track) => track.stop());

      // Get new video stream with selected camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false,
      });

      // Replace video track in localStream
      if (localStream) {
        const newVideoTrack = newStream.getVideoTracks()[0];
        const oldVideoTrack = localStream.getVideoTracks()[0];
        localStream.removeTrack(oldVideoTrack);
        localStream.addTrack(newVideoTrack);
      }

      toast.success("Camera switched successfully");
    } catch (err) {
      console.error("Failed to switch camera:", err);
      toast.error("Failed to switch camera");
    }
  };

  const handleAudioChange = async (deviceId: string) => {
    try {
      // Stop current audio track
      localStream?.getAudioTracks().forEach((track) => track.stop());

      // Get new audio stream with selected microphone
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: { deviceId: { exact: deviceId } },
      });

      // Replace audio track in localStream
      if (localStream) {
        const newAudioTrack = newStream.getAudioTracks()[0];
        const oldAudioTrack = localStream.getAudioTracks()[0];
        localStream.removeTrack(oldAudioTrack);
        localStream.addTrack(newAudioTrack);
      }

      toast.success("Microphone switched successfully");
    } catch (err) {
      console.error("Failed to switch microphone:", err);
      toast.error("Failed to switch microphone");
    }
  };

  const handleBackgroundBlurToggle = (enabled: boolean) => {
    // Background blur would require Canvas API or MediaPipe/TensorFlow.js
    // This is a placeholder for future implementation
    toast(enabled ? "Background blur enabled (Coming soon)" : "Background blur disabled");
  };

  const handleAspectRatioChange = (ratio: string) => {
    // Aspect ratio change would update video constraints
    // This is a placeholder for future implementation
    toast(`Aspect ratio changed to ${ratio} (Coming soon)`);
  };

  // Quick Actions Handlers
  const handleScreenShareToggle = async () => {
    if (!localStream) return;

    try {
      if (isScreenSharing) {
        // Switch back to camera
        if (originalStream) {
          const videoTrack = originalStream.getVideoTracks()[0];
          const oldVideoTrack = localStream.getVideoTracks()[0];
          localStream.removeTrack(oldVideoTrack);
          localStream.addTrack(videoTrack);
          oldVideoTrack.stop();
          setIsScreenSharing(false);
          setOriginalStream(null);
          toast.success("Switched back to camera");
        }
      } else {
        // Switch to screen sharing
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "monitor",
          },
          audio: false,
        });

        const screenTrack = displayStream.getVideoTracks()[0];
        const cameraTrack = localStream.getVideoTracks()[0];

        // Save original camera stream
        setOriginalStream(new MediaStream([cameraTrack, ...localStream.getAudioTracks()]));

        // Replace video track with screen
        localStream.removeTrack(cameraTrack);
        localStream.addTrack(screenTrack);

        setIsScreenSharing(true);
        toast.success("Screen sharing started");

        // Listen for when user stops screen share from browser UI
        screenTrack.onended = () => {
          handleScreenShareToggle();
        };
      }
    } catch (err) {
      console.error("Screen share error:", err);
      toast.error("Failed to toggle screen sharing");
    }
  };

  const handleEmergencyPause = async () => {
    try {
      if (isEmergencyPaused) {
        // Resume stream
        setIsEmergencyPaused(false);
        // Unpause media tracks
        localStream?.getTracks().forEach((track) => {
          track.enabled = true;
        });
        toast.success("Stream resumed");
      } else {
        // Pause stream
        setIsEmergencyPaused(true);
        // Mute/disable all tracks temporarily
        localStream?.getTracks().forEach((track) => {
          track.enabled = false;
        });
        toast("Stream paused - Viewers see waiting screen", {
          icon: "⏸️",
          duration: 4000,
        });
      }
    } catch (err) {
      console.error("Emergency pause error:", err);
      toast.error("Failed to pause stream");
    }
  };

  const handleBroadcasterPiP = async () => {
    try {
      const videoElement = document.querySelector("video") as HTMLVideoElement;
      if (!videoElement) {
        toast.error("Video element not found");
        return;
      }

      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        toast("Exited Picture-in-Picture");
      } else {
        await videoElement.requestPictureInPicture();
        toast.success("Entered Picture-in-Picture mode");
      }
    } catch (err) {
      console.error("PiP error:", err);
      toast.error("Failed to toggle Picture-in-Picture");
    }
  };

  // Scheduling handlers
  const handleAutoStartChange = async (enabled: boolean) => {
    try {
      const response = await fetch(`/api/streams/${streamId}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoStart: enabled }),
      });

      if (!response.ok) throw new Error("Failed to update auto-start");

      setAutoStart(enabled);
      toast.success(enabled ? "Auto-start enabled" : "Auto-start disabled");
    } catch (err) {
      console.error("Auto-start toggle error:", err);
      toast.error("Failed to update auto-start setting");
    }
  };

  const handleAutoEndChange = async (enabled: boolean) => {
    try {
      const response = await fetch(`/api/streams/${streamId}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoEnd: enabled }),
      });

      if (!response.ok) throw new Error("Failed to update auto-end");

      setAutoEnd(enabled);
      toast.success(enabled ? "Auto-end enabled" : "Auto-end disabled");
    } catch (err) {
      console.error("Auto-end toggle error:", err);
      toast.error("Failed to update auto-end setting");
    }
  };

  const handleManualStart = async () => {
    // Triggered by auto-start countdown or manual button
    if (!isMediaReady) {
      toast.error("Media not ready. Please enable camera and microphone.");
      return;
    }

    try {
      const response = await fetch(`/api/streams/${streamId}/start`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start stream");
      }

      setStatus("LIVE");
      toast.success("Stream started!");
    } catch (error) {
      console.error("Failed to start stream:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start stream");
    }
  };

  const handleDurationWarning = (minutesRemaining: number) => {
    toast(`⏰ ${minutesRemaining} minutes remaining`, {
      duration: 5000,
      icon: "⚠️",
    });
  };

  const handleTimeUp = async () => {
    // Auto-end triggered
    toast("Scheduled end time reached. Ending stream...", {
      icon: "⏰",
      duration: 4000,
    });

    try {
      const response = await fetch(`/api/streams/${streamId}/end`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to end stream");
      }

      setStatus("ENDED");
      toast.success("Stream ended");
    } catch (error) {
      console.error("Failed to end stream:", error);
      toast.error("Failed to end stream");
    }
  };

  // Generate stream URL using memorial slug
  const streamUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${memorialSlug}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{streamTitle}</h1>
              <p className="text-sm text-gray-400">{memorialName}</p>
            </div>
            <div className="flex items-center gap-4">
              <RecordingIndicator
                isRecording={isRecording}
                isPaused={isPaused}
                duration={recordingDuration}
                size={recordingSize}
              />
              <ViewerCount count={viewerCount} />
              <ConnectionStatus isConnected={isConnected} />
              <StreamSettingsPanel
                streamId={streamId}
                enableChat={enableChat}
                enableReactions={enableReactions}
                localStream={localStream}
                onChatToggle={handleChatToggle}
                onReactionsToggle={handleReactionsToggle}
                onCameraChange={handleCameraChange}
                onAudioChange={handleAudioChange}
                onBackgroundBlurToggle={handleBackgroundBlurToggle}
                onAspectRatioChange={handleAspectRatioChange}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Error Banners */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        {recordingError && (
          <div className="mb-4 bg-red-500/10 border border-red-500 rounded-lg p-4">
            <p className="text-red-400 text-sm">Recording Error: {recordingError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Media Preview & Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Media Preview */}
            <MediaPreview
              localStream={localStream}
              setLocalStream={setLocalStream}
              isMediaReady={isMediaReady}
              setIsMediaReady={setIsMediaReady}
              onError={handleError}
            />

            {/* Broadcast Controls */}
            <Card className="bg-gray-900/50 border-gray-800">
              <BroadcastControls
                streamId={streamId}
                status={status}
                quality={quality}
                isMediaReady={isMediaReady}
                streamDuration={streamDuration}
                onStatusChange={handleStatusChange}
                onQualityChange={handleQualityChange}
                onError={handleError}
              />
            </Card>

            {/* Quick Actions Panel */}
            <QuickActionsPanel
              streamId={streamId}
              streamUrl={streamUrl}
              isStreaming={status === "LIVE"}
              isPaused={isEmergencyPaused}
              isScreenSharing={isScreenSharing}
              onScreenShareToggle={handleScreenShareToggle}
              onPauseToggle={handleEmergencyPause}
              onPictureInPicture={handleBroadcasterPiP}
            />
          </div>

          {/* Right Column - Chat & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Countdown Timer for Scheduled Streams */}
            {status === "SCHEDULED" && scheduledFor && (
              <CountdownTimer
                scheduledFor={scheduledFor}
                onCountdownComplete={autoStart ? handleManualStart : undefined}
                showDate
              />
            )}

            {/* Duration Timer for Live Streams */}
            {status === "LIVE" && scheduledEnd && (
              <StreamDurationTimer
                startedAt={new Date()}
                scheduledEndTime={scheduledEnd}
                warningThresholds={[5, 15, 30]}
                onWarning={handleDurationWarning}
                onTimeUp={autoEnd ? handleTimeUp : undefined}
              />
            )}

            {/* Schedule Manager */}
            {scheduledFor && (
              <ScheduleManager
                streamId={streamId}
                scheduledFor={scheduledFor}
                scheduledEnd={scheduledEnd || null}
                autoStart={autoStart}
                autoEnd={autoEnd}
                onAutoStartChange={handleAutoStartChange}
                onAutoEndChange={handleAutoEndChange}
                onManualStart={handleManualStart}
              />
            )}

            {/* Stream Health Monitor */}
            <StreamHealthMonitor metrics={healthMetrics} isStreaming={status === "LIVE"} />

            {/* Viewer List */}
            {status === "LIVE" && <ViewerList streamId={streamId} />}

            {/* Storage Meter */}
            <StorageMeter
              usedBytes={storageUsed}
              totalBytes={storageTotal}
              loading={storageLoading}
            />

            {/* Recording Controls */}
            <RecordingControls
              isRecording={isRecording}
              isPaused={isPaused}
              quality={recordingQuality}
              autoDownload={autoDownload}
              onQualityChange={setRecordingQuality}
              onAutoDownloadChange={setAutoDownload}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
              onPauseRecording={pauseRecording}
              onResumeRecording={resumeRecording}
              disabled={!isMediaReady || status !== "LIVE"}
            />

            {/* Chat Feed */}
            {enableChat && (
              <ChatFeed
                streamId={streamId}
                enableReactions={enableReactions}
                onViewerCountUpdate={setViewerCount}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BroadcasterInterface;
