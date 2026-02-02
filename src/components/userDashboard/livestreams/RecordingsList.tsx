"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Video,
  Download,
  Trash2,
  Calendar,
  Clock,
  HardDrive,
  AlertTriangle,
  AlertCircle,
  Play,
  ExternalLink,
  Share2,
  Loader2,
  RefreshCw,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import toast from "react-hot-toast";
import { RecordingCardSkeleton } from "@/components/livestream/LivestreamSkeletons";

interface Recording {
  id: string;
  title: string;
  description: string | null;
  recordingUrl: string;
  recordingDuration: number | null;
  recordingSize: number | null;
  recordingStatus: string;
  recordingDeleteAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  totalViews: number;
  peakViewers: number;
  createdAt: string;
  memorial: {
    id: string;
    firstName: string;
    lastName: string;
    slug: string;
  };
}

interface RecordingsListProps {
  memorialId: string;
}

const RecordingsList: React.FC<RecordingsListProps> = ({ memorialId }) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteRecording, setDeleteRecording] = useState<Recording | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewRecording, setPreviewRecording] = useState<Recording | null>(null);

  const fetchRecordings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ memorialId, status: "ENDED" });
      const response = await fetch(`/api/streams?${params}`);
      if (!response.ok) {
        throw new Error("Failed to load recordings");
      }
      const data = await response.json();
      // Filter only streams that have recordings
      const streamsWithRecordings = (data.streams || []).filter(
        (stream: Recording) => stream.recordingUrl && stream.recordingStatus === "READY"
      );
      setRecordings(streamsWithRecordings);
    } catch (err) {
      console.error("Failed to fetch recordings:", err);
      setError(err instanceof Error ? err.message : "Failed to load recordings");
      toast.error("Failed to load recordings");
    } finally {
      setLoading(false);
    }
  }, [memorialId]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  // Listen for recording updates
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      const updated = ce.detail as Recording | undefined;
      if (!updated) return;

      if (updated.recordingUrl && updated.recordingStatus === "READY") {
        // Add or update recording
        setRecordings((prev) => {
          const exists = prev.find((r) => r.id === updated.id);
          if (exists) {
            return prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r));
          }
          return [updated, ...prev];
        });
      } else {
        // Remove if recording deleted
        setRecordings((prev) => prev.filter((r) => r.id !== updated.id));
      }
    };

    window.addEventListener("stream:recording-ready", handler as EventListener);
    return () => window.removeEventListener("stream:recording-ready", handler as EventListener);
  }, []);

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return "Unknown";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getDaysUntilDeletion = (deleteAt: string | null): number | null => {
    if (!deleteAt) return null;
    return differenceInDays(new Date(deleteAt), new Date());
  };

  const handleDownload = (recording: Recording) => {
    const link = document.createElement("a");
    link.href = recording.recordingUrl;
    link.download = `${recording.title.replace(/[^a-z0-9]/gi, "_")}_recording.mp4`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started");
  };

  const handleShare = async (recording: Recording) => {
    const shareUrl = `${window.location.origin}/${recording.memorial.slug}/recording/${recording.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${recording.title} - Recording`,
          text: `Watch the recording of ${recording.title}`,
          url: shareUrl,
        });
        toast.success("Shared successfully!");
      } catch {
        // Fallback to copy
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleDeleteRecording = async () => {
    if (!deleteRecording) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/streams/${deleteRecording.id}/recording`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete recording");
      }

      // Remove from local state
      setRecordings((prev) => prev.filter((r) => r.id !== deleteRecording.id));
      toast.success("Recording deleted successfully");
      setDeleteRecording(null);
    } catch (error) {
      console.error("Failed to delete recording:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete recording");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <RecordingCardSkeleton count={3} />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive opacity-70" />
            <p className="text-destructive font-medium mb-2">Failed to load recordings</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={fetchRecordings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recordings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Recordings Yet</h3>
            <p className="text-sm max-w-sm mx-auto">
              When you end a livestream with recording enabled, your recordings will appear here.
              You can download, share, or delete them at any time.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{recordings.length}</p>
                  <p className="text-xs text-muted-foreground">Total Recordings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {formatDuration(
                      recordings.reduce((acc, r) => acc + (r.recordingDuration || 0), 0)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {formatFileSize(recordings.reduce((acc, r) => acc + (r.recordingSize || 0), 0))}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Size</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {
                      recordings.filter((r) => {
                        const days = getDaysUntilDeletion(r.recordingDeleteAt);
                        return days !== null && days <= 7;
                      }).length
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Expiring Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recording Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recordings.map((recording) => {
            const daysUntilDeletion = getDaysUntilDeletion(recording.recordingDeleteAt);
            const isExpiringSoon = daysUntilDeletion !== null && daysUntilDeletion <= 7;

            return (
              <Card
                key={recording.id}
                className={isExpiringSoon ? "border-amber-500/50" : undefined}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2">{recording.title}</CardTitle>
                    <Badge variant="outline" className="shrink-0">
                      <Video className="h-3 w-3 mr-1" />
                      Recording
                    </Badge>
                  </div>
                  {recording.description && (
                    <CardDescription className="line-clamp-2">
                      {recording.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(recording.recordingDuration)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <HardDrive className="h-4 w-4" />
                      <span>{formatFileSize(recording.recordingSize)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {recording.endedAt
                          ? format(new Date(recording.endedAt), "MMM d, yyyy")
                          : "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Play className="h-4 w-4" />
                      <span>{recording.totalViews} views</span>
                    </div>
                  </div>

                  {/* Expiration Warning */}
                  {recording.recordingDeleteAt && (
                    <div
                      className={`flex items-center gap-2 text-sm p-2 rounded-md ${
                        isExpiringSoon
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>
                        {isExpiringSoon
                          ? `Expires in ${daysUntilDeletion} day${daysUntilDeletion === 1 ? "" : "s"}`
                          : `Auto-deletes ${formatDistanceToNow(new Date(recording.recordingDeleteAt), { addSuffix: true })}`}
                      </span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={() => handleDownload(recording)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPreviewRecording(recording)}>
                        <Play className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(recording)}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Link
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteRecording(recording)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Recording
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteRecording} onOpenChange={(open) => !open && setDeleteRecording(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recording</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the recording for &quot;{deleteRecording?.title}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg text-sm">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Warning</p>
                <p className="text-muted-foreground mt-1">
                  This will permanently delete the recording from cloud storage. Download the
                  recording first if you want to keep a copy.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteRecording(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRecording} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Recording
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewRecording} onOpenChange={(open) => !open && setPreviewRecording(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewRecording?.title}</DialogTitle>
            <DialogDescription>
              Recorded on{" "}
              {previewRecording?.endedAt
                ? format(new Date(previewRecording.endedAt), "MMMM d, yyyy 'at' h:mm a")
                : "Unknown date"}
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {previewRecording?.recordingUrl && (
              <video
                src={previewRecording.recordingUrl}
                controls
                autoPlay
                className="w-full h-full"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewRecording(null)}>
              Close
            </Button>
            {previewRecording && (
              <Button onClick={() => handleDownload(previewRecording)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RecordingsList;
