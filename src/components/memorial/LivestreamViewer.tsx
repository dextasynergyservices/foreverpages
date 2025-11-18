"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { StreamStatus, StreamQuality } from "@/generated/prisma";
import { Lock, Users, Wifi, WifiOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ViewerChat from "./ViewerChat";
import VideoPlayer from "@/components/livestream/viewer/VideoPlayer";
import { useWebRTCViewer } from "@/hooks/useWebRTCViewer";
import { useStreamMetadata } from "@/hooks/useStreamMetadata";

interface Memorial {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
}

interface Stream {
  id: string;
  title: string;
  description: string | null;
  status: StreamStatus;
  isPublic: boolean;
  allowComments: boolean;
  allowAnonymous: boolean;
  recordStream: boolean;
  streamQuality: StreamQuality;
  scheduledFor: string | null;
  startedAt: string | null;
  endedAt: string | null;
  recordingUrl: string | null;
  password: string | null;
  peakViewers: number;
  totalViews: number;
}

interface LivestreamViewerProps {
  memorial: Memorial;
  stream: Stream;
  isLocked?: boolean;
}

export default function LivestreamViewer({
  memorial,
  stream: initialStream,
  isLocked = false,
}: LivestreamViewerProps) {
  // uniqueViews: total unique views for the memorial stream (persistent)
  // stored on the server; display this value in the header
  const [uniqueViews] = useState(initialStream.totalViews);
  // active viewers reported by the signaling server (current concurrent viewers)
  const [activeViewerCount, setActiveViewerCount] = useState<number>(0);
  const [selectedQuality, setSelectedQuality] = useState<StreamQuality>(
    initialStream.streamQuality
  );
  const [error, setError] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState(initialStream.status);
  const [playRecording, setPlayRecording] = useState(false);
  const [connectingTimeoutExceeded, setConnectingTimeoutExceeded] = useState(false);

  const fullName = `${memorial.firstName} ${memorial.middleName ? memorial.middleName + " " : ""}${memorial.lastName}`;

  // NextAuth session to detect whether visitor is authenticated
  const { data: session } = useSession();

  // Derive authoritative stream metadata via TanStack Query when available
  const { data: streamData } = useStreamMetadata(initialStream.id);

  // Determine if this is a live stream or recording based on query data (fallback to initial props)
  const effectiveStatus = streamData?.status ?? streamStatus;
  const recordingUrl = streamData?.recordingUrl ?? initialStream.recordingUrl;
  const isLive = effectiveStatus === "LIVE" && !isLocked;
  const isRecording = effectiveStatus === "ENDED" && !!recordingUrl;
  // Only allow recording playback for authenticated users — anonymous visitors see live only
  const canPlayRecording = !!session?.user && isRecording;

  // WebRTC hook for live streams
  const { isConnected, remoteStream, reconnect, isReconnecting } = useWebRTCViewer({
    streamId: initialStream.id,
    isLive: isLive,
    quality: selectedQuality,
    onViewerCountChange: setActiveViewerCount,
    onError: (errorMessage) => {
      setError(errorMessage);
      // If the error indicates stream ended, update status
      if (errorMessage.includes("ended")) {
        setStreamStatus("ENDED");
      }
    },
  });

  // Some signaling flows may provide a MediaStream object that has no tracks
  // yet (or whose tracks are ended). Treat streams with zero live tracks as
  // effectively "no stream" so the UI keeps showing the connecting placeholder
  // until a playable stream is available.
  const hasRemoteStream = !!remoteStream && (remoteStream.getTracks?.().length ?? 0) > 0;

  // Show a friendly timeout message if still not connected after 20 seconds
  useEffect(() => {
    if (!isLive) return;
    setConnectingTimeoutExceeded(false);
    const t = setTimeout(() => {
      // consider zero-track streams as not connected yet
      if (!isConnected && !hasRemoteStream) {
        setConnectingTimeoutExceeded(true);
      }
    }, 20000);
    return () => clearTimeout(t);
  }, [isLive, isConnected, remoteStream, hasRemoteStream]);

  // If a live remoteStream appears, cancel any pending recording playback
  // Use effect to avoid updating state during render
  useEffect(() => {
    if (hasRemoteStream && playRecording) {
      setPlayRecording(false);
    }
  }, [hasRemoteStream, playRecording]);

  // Sync local state with live metadata so controls reflect the latest values
  useEffect(() => {
    if (!streamData) return;
    if (streamData.status && streamData.status !== streamStatus) {
      setStreamStatus(streamData.status as StreamStatus);
    }
    if (streamData.streamQuality && streamData.streamQuality !== selectedQuality) {
      setSelectedQuality(streamData.streamQuality as StreamQuality);
    }
  }, [streamData, selectedQuality, streamStatus]);

  // Stream and recording handling is now done by VideoPlayer component

  return (
    <section className="relative w-full bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Stream Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2">
                {initialStream.title}
              </h1>
              <p className="text-gray-400">
                Memorial for {fullName}
                {!initialStream.isPublic && (
                  <Badge variant="secondary" className="ml-2">
                    <Lock className="h-3 w-3 mr-1" />
                    Private
                  </Badge>
                )}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Live Badge */}
              {isLive && (
                <Badge variant="destructive" className="text-sm px-3 py-1">
                  <span className="animate-pulse mr-2">●</span>
                  LIVE
                </Badge>
              )}

              {/* Recording Badge */}
              {isRecording && (
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  Recording
                </Badge>
              )}

              {/* Unique viewer count (total unique views) and active viewers */}
              <div className="flex items-center gap-2 text-white bg-white/10 rounded-full px-3 py-1">
                <Users className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{uniqueViews}</span>
                  <span className="text-xs text-gray-300">unique views</span>
                </div>
                {/* Active viewers badge (concurrent) */}
                <div className="ml-3 text-xs text-gray-300">{activeViewerCount} live</div>
              </div>

              {/* Connection Status (for live streams) */}
              {isLive && (
                <div
                  className={`flex items-center gap-2 rounded-full px-3 py-1 ${
                    isConnected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                  <span className="text-sm font-medium">
                    {isConnected ? "Connected" : "Connecting..."}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Video Player & Chat Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Video Player */}
          <div className="lg:col-span-3">
            <Card className="relative aspect-video bg-black overflow-hidden">
              {isLocked ? (
                // Locked state (password required)
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                  <div className="text-center text-white">
                    <Lock className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                    <h3 className="text-xl font-semibold mb-2">Password Required</h3>
                    <p className="text-gray-400">
                      This stream is private. Enter the password to watch.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Enhanced Video Player with PiP and Quality Controls */}
                  {/* Prefer live stream. Only play a recording if the user explicitly requests it. */}
                  {(hasRemoteStream || playRecording) && (
                    <VideoPlayer
                      stream={remoteStream}
                      videoUrl={
                        !remoteStream && playRecording ? recordingUrl || undefined : undefined
                      }
                      isLive={isLive}
                      currentQuality={selectedQuality}
                      onQualityChange={setSelectedQuality}
                      className="w-full h-full"
                    />
                  )}

                  {/* Play Recording CTA when there's a recording but no live stream currently */}
                  {/* Only show Play Recording CTA to authenticated users */}
                  {!hasRemoteStream && canPlayRecording && !playRecording && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900/70 to-black/70 z-10">
                      <div className="text-center">
                        <h3 className="text-white text-xl mb-2">This event has a recording</h3>
                        <p className="text-gray-300 mb-4">Click to play the recorded stream.</p>
                        <button
                          className="px-4 py-2 bg-white text-black rounded"
                          onClick={() => setPlayRecording(true)}
                        >
                          Play recording
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Error Banner */}
                  {error && (
                    <div className="absolute top-4 left-4 right-4 z-10 bg-red-500/90 text-white px-4 py-2 rounded-lg">
                      {error}
                    </div>
                  )}

                  {/* No Stream Placeholder */}
                  {!remoteStream && isLive && !isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                      <div className="text-center text-white px-6">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-lg">Connecting to stream...</p>
                        {connectingTimeoutExceeded && (
                          <div className="mt-4 text-sm text-gray-300">
                            <p>Still connecting. It might be a temporary network issue.</p>
                            <p className="mt-2">You can try to reconnect or come back shortly.</p>
                            <div className="mt-3">
                              <button
                                className={`px-3 py-1 bg-white text-black rounded ${
                                  isReconnecting ? "opacity-60 cursor-not-allowed" : ""
                                }`}
                                onClick={() => reconnect?.()}
                                disabled={!!isReconnecting}
                              >
                                {isReconnecting ? "Reconnecting..." : "Reconnect"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>

            {/* Stream Description */}
            {initialStream.description && (
              <Card className="mt-4 p-4 bg-white/5 border-white/10">
                <p className="text-white/80">{initialStream.description}</p>
              </Card>
            )}
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-1">
            <ViewerChat
              streamId={initialStream.id}
              memorialName={fullName}
              allowComments={initialStream.allowComments}
              isLocked={isLocked}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
