"use client";

import { useState } from "react";
import { StreamStatus, StreamQuality } from "@/generated/prisma";
import { Lock, Users, Wifi, WifiOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ViewerChat from "./ViewerChat";
import VideoPlayer from "@/components/livestream/viewer/VideoPlayer";
import { useWebRTCViewer } from "@/hooks/useWebRTCViewer";

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
  const [viewerCount, setViewerCount] = useState(initialStream.totalViews);
  const [selectedQuality, setSelectedQuality] = useState<StreamQuality>(
    initialStream.streamQuality
  );
  const [error, setError] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState(initialStream.status);

  const fullName = `${memorial.firstName} ${memorial.middleName ? memorial.middleName + " " : ""}${memorial.lastName}`;

  // Determine if this is a live stream or recording based on current status
  const isLive = (streamStatus === "LIVE" || streamStatus === "PAUSED") && !isLocked;
  const isRecording = streamStatus === "ENDED" && initialStream.recordingUrl;

  // WebRTC hook for live streams
  const { isConnected, remoteStream } = useWebRTCViewer({
    streamId: initialStream.id,
    isLive: isLive,
    quality: selectedQuality,
    onViewerCountChange: setViewerCount,
    onError: (errorMessage) => {
      setError(errorMessage);
      // If the error indicates stream ended, update status
      if (errorMessage.includes("ended")) {
        setStreamStatus("ENDED");
      }
    },
  });

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

              {/* Viewer Count */}
              <div className="flex items-center gap-2 text-white bg-white/10 rounded-full px-3 py-1">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">{viewerCount}</span>
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
                  {(remoteStream || isRecording) && (
                    <VideoPlayer
                      stream={remoteStream}
                      videoUrl={isRecording ? initialStream.recordingUrl || undefined : undefined}
                      isLive={isLive}
                      currentQuality={selectedQuality}
                      onQualityChange={setSelectedQuality}
                      className="w-full h-full"
                    />
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
                      <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-lg">Connecting to stream...</p>
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
