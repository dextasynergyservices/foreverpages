"use client";

import React, { useState, useEffect } from "react";
import { StreamStatus, StreamQuality } from "@/generated/prisma";
import {
  Calendar,
  Clock,
  Users,
  Video,
  Play,
  Edit,
  Trash2,
  BarChart3,
  Loader2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import EditStreamDialog from "./EditStreamDialog";
import DeleteStreamDialog from "./DeleteStreamDialog";
import StreamAnalyticsDialog from "./StreamAnalyticsDialog";

interface Stream {
  id: string;
  title: string;
  description: string | null;
  status: StreamStatus;
  scheduledFor: string | null;
  startedAt: string | null;
  endedAt: string | null;
  totalViews: number;
  peakViewers: number;
  hasPassword: boolean;
  recordingUrl: string | null;
  createdAt: string;
  quality: StreamQuality;
  enableRecording: boolean;
  enableChat: boolean;
  enableReactions: boolean;
  memorial: {
    id: string;
    firstName: string;
    lastName: string;
    slug: string;
  };
}

interface StreamListProps {
  memorialId: string;
  refreshKey: number;
}

const StreamList: React.FC<StreamListProps> = ({ memorialId, refreshKey }) => {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "live" | "ended">("all");
  const [editStream, setEditStream] = useState<Stream | null>(null);
  const [deleteStream, setDeleteStream] = useState<Stream | null>(null);
  const [analyticsStream, setAnalyticsStream] = useState<Stream | null>(null);
  const [startingStreamId, setStartingStreamId] = useState<string | null>(null);

  useEffect(() => {
    fetchStreams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memorialId, refreshKey]);

  // Listen for cross-window events when a recording becomes available
  useEffect(() => {
    const handler = (e: Event) => {
      // Expect CustomEvent with updated stream in detail
      const ce = e as CustomEvent;
      const updatedStream = ce.detail as Stream | undefined | null;
      if (!updatedStream) return;

      setStreams((prev) => {
        const found = prev.find((s) => s.id === updatedStream.id);
        if (!found) return prev;
        return prev.map((s) => (s.id === updatedStream.id ? { ...s, ...updatedStream } : s));
      });
    };

    window.addEventListener("stream:recording-ready", handler as EventListener);
    window.addEventListener("stream:status-changed", handler as EventListener);
    return () => {
      window.removeEventListener("stream:recording-ready", handler as EventListener);
      window.removeEventListener("stream:status-changed", handler as EventListener);
    };
  }, []);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ memorialId });
      // Don't send status filter to API - we'll filter client-side for more flexibility

      const response = await fetch(`/api/streams?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStreams(data.streams || []);
      }
    } catch (error) {
      console.error("Failed to fetch streams:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartStream = async (streamId: string) => {
    try {
      setStartingStreamId(streamId);

      const response = await fetch(`/api/streams/${streamId}/start`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start stream");
      }

      // Navigate to broadcaster page
      window.location.href = `/stream/broadcast/${streamId}`;
    } catch (error) {
      console.error("Failed to start stream:", error);
      alert(error instanceof Error ? error.message : "Failed to start stream");
      setStartingStreamId(null);
    }
  };

  const handleJoinStream = (streamId: string) => {
    // Navigate to broadcaster page (for host to join their own stream)
    window.location.href = `/stream/broadcast/${streamId}`;
  };

  const handleDownloadRecording = (recordingUrl: string, streamTitle: string) => {
    // Create a temporary link and trigger download
    const link = document.createElement("a");
    link.href = recordingUrl;
    link.download = `${streamTitle.replace(/[^a-z0-9]/gi, "_")}_recording.mp4`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: StreamStatus) => {
    const variants: Record<
      StreamStatus,
      { variant: "default" | "destructive" | "outline" | "secondary"; label: string }
    > = {
      SCHEDULED: { variant: "outline", label: "Scheduled" },
      STARTING: { variant: "secondary", label: "Starting..." },
      LIVE: { variant: "destructive", label: "● LIVE" },
      PAUSED: { variant: "secondary", label: "Paused" },
      ENDING: { variant: "secondary", label: "Ending..." },
      ENDED: { variant: "default", label: "Ended" },
      CANCELLED: { variant: "outline", label: "Cancelled" },
      FAILED: { variant: "destructive", label: "Failed" },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant} className="font-medium">
        {config.label}
      </Badge>
    );
  };

  const filteredStreams = streams.filter((stream) => {
    if (filter === "all") return true;
    if (filter === "upcoming") return ["SCHEDULED", "STARTING"].includes(stream.status);
    if (filter === "live") return ["LIVE", "PAUSED"].includes(stream.status);
    if (filter === "ended") return ["ENDED", "CANCELLED", "FAILED"].includes(stream.status);
    return true;
  });

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All Streams</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="ended">Ended</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stream Cards */}
      {filteredStreams.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No streams found.</p>
              <p className="text-sm mt-1">Create your first livestream to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStreams.map((stream) => (
            <Card key={stream.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">{stream.title}</CardTitle>
                  {getStatusBadge(stream.status)}
                </div>
                {stream.description && (
                  <CardDescription className="line-clamp-2">{stream.description}</CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Scheduled Time */}
                {stream.scheduledFor && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(new Date(stream.scheduledFor), { addSuffix: true })}
                    </span>
                  </div>
                )}

                {/* Started Time */}
                {stream.startedAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Started {formatDistanceToNow(new Date(stream.startedAt), { addSuffix: true })}
                    </span>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{stream.totalViews}</span>
                    <span className="text-muted-foreground">views</span>
                  </div>
                  {stream.peakViewers > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Peak:</span>
                      <span className="font-medium">{stream.peakViewers}</span>
                    </div>
                  )}
                </div>

                {/* Recording Badge */}
                {stream.recordingUrl && (
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <Video className="h-3 w-3" />
                    Recording Available
                  </Badge>
                )}
              </CardContent>

              <CardFooter className="flex gap-2">
                {/* Download Recording Button */}
                {stream.recordingUrl && stream.status === "ENDED" && (
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={() => handleDownloadRecording(stream.recordingUrl!, stream.title)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                )}

                {/* Start/Join Button for LIVE streams */}
                {stream.status === "LIVE" && (
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={() => handleJoinStream(stream.id)}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Join
                  </Button>
                )}

                {/* Start Button for SCHEDULED streams */}
                {stream.status === "SCHEDULED" && (
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={() => handleStartStream(stream.id)}
                    disabled={startingStreamId === stream.id}
                  >
                    {startingStreamId === stream.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </>
                    )}
                  </Button>
                )}

                {/* Edit Button */}
                {["SCHEDULED", "ENDED"].includes(stream.status) && (
                  <Button size="sm" variant="outline" onClick={() => setEditStream(stream)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}

                {/* Analytics Button */}
                {stream.status === "ENDED" && (
                  <Button size="sm" variant="outline" onClick={() => setAnalyticsStream(stream)}>
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                )}

                {/* Delete Button */}
                <Button size="sm" variant="ghost" onClick={() => setDeleteStream(stream)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Stream Dialog */}
      <EditStreamDialog
        open={!!editStream}
        onOpenChange={(open) => !open && setEditStream(null)}
        stream={editStream}
        onSuccess={() => {
          setEditStream(null);
          fetchStreams();
        }}
      />

      {/* Delete Stream Dialog */}
      <DeleteStreamDialog
        open={!!deleteStream}
        onOpenChange={(open) => !open && setDeleteStream(null)}
        stream={deleteStream}
        onSuccess={() => {
          // Optimistically remove the stream from local state immediately
          if (deleteStream) {
            setStreams((prev) => prev.filter((s) => s.id !== deleteStream.id));
          }
          setDeleteStream(null);
          // Still fetch from server to ensure consistency
          fetchStreams();
        }}
      />

      {/* Analytics Dialog */}
      <StreamAnalyticsDialog
        open={!!analyticsStream}
        onOpenChange={(open) => !open && setAnalyticsStream(null)}
        stream={analyticsStream}
      />
    </div>
  );
};

export default StreamList;
