"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  FaSpinner,
  FaChartLine,
  FaUsers,
  FaClock,
  FaComment,
  FaEye,
  FaGlobe,
  FaDownload,
  FaShare,
  FaFire,
  FaThumbsUp,
  FaThumbsDown,
  FaMeh,
} from "react-icons/fa";

interface Stream {
  id: string;
  title: string;
  description: string | null;
  scheduledFor: string | null;
  startedAt: string | null;
  endedAt: string | null;
  totalViews: number;
  peakViewers: number;
  recordingUrl: string | null;
  createdAt: string;
  memorial: {
    id: string;
    firstName: string;
    lastName: string;
    slug: string;
  };
}

interface StreamAnalytics {
  stream: {
    id: string;
    title: string;
    status: string;
    startedAt: string | null;
    endedAt: string | null;
    duration: number | null;
  };
  viewership: {
    peakViewers: number;
    totalViews: number;
    totalUniqueViewers: number;
    anonymousViewers: number;
    registeredViewers: number;
    averageWatchTime: number;
    replayViews: number;
  };
  engagement: {
    totalComments: number;
    totalReactions: number;
    engagementRate: number;
    reactionBreakdown: { type: string; count: number }[];
  };
  timeline: {
    timestamp: string;
    concurrentViewers: number;
    totalViewers: number;
    averageBitrate: number | null;
    bufferRatio: number | null;
  }[];
  topMoments?: {
    timestamp: string;
    engagementScore: number;
    viewers: number;
    comments: number;
    reactions: number;
    description: string;
  }[];
  sentiment?: {
    positive: number;
    neutral: number;
    negative: number;
    topPositiveComments: string[];
    topNegativeComments: string[];
  };
}

interface StreamAnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stream: Stream | null;
}

const StreamAnalyticsDialog: React.FC<StreamAnalyticsDialogProps> = ({
  open,
  onOpenChange,
  stream,
}) => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<StreamAnalytics | null>(null);
  const [localStream, setLocalStream] = useState<Stream | null>(stream);

  useEffect(() => {
    if (open && stream) {
      fetchAnalytics();
    }
    setLocalStream(stream);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stream]);

  // Listen for recording-ready events to update local stream
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      const updated = ce.detail as Stream | undefined | null;
      if (!updated) return;
      if (updated.id === stream?.id) {
        setLocalStream((prev) => ({ ...(prev || ({} as Stream)), ...updated }));
      }
    };

    window.addEventListener("stream:recording-ready", handler as EventListener);
    return () => window.removeEventListener("stream:recording-ready", handler as EventListener);
  }, [stream]);

  const displayStream = localStream ?? stream;

  const handleShareRecording = () => {
    if (!displayStream?.recordingUrl) return;
    const slug = displayStream.memorial?.slug;
    const shareUrl = slug
      ? `${window.location.origin}/${slug}/recording`
      : `${window.location.origin}/memorial-pages/${displayStream.id}/recording`;

    if (navigator.share) {
      navigator
        .share({
          title: `${displayStream.title} - Recording`,
          text: `Watch the recording of ${displayStream.title}`,
          url: shareUrl,
        })
        .then(() => toast.success("Shared successfully!"))
        .catch(() => {
          // Fallback to copy
          navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied to clipboard!");
        });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleDownloadPDF = async () => {
    try {
      toast.loading("Generating PDF report...");

      const response = await fetch(`/api/streams/${displayStream?.id}/analytics/export`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${displayStream?.title.replace(/[^a-z0-9]/gi, "_")}_analytics.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to download PDF report");
      console.error("PDF download error:", error);
    }
  };

  const fetchAnalytics = async () => {
    if (!displayStream) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/streams/${displayStream.id}/analytics`);

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!displayStream) return null;

  const duration =
    displayStream.startedAt && displayStream.endedAt
      ? Math.floor(
          (new Date(displayStream.endedAt).getTime() -
            new Date(displayStream.startedAt).getTime()) /
            1000
        )
      : 0;

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{displayStream.title} - Analytics</DialogTitle>
          <DialogDescription>Detailed engagement and viewership statistics</DialogDescription>
        </DialogHeader>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleShareRecording()}
            disabled={!displayStream.recordingUrl}
          >
            <FaShare className="h-4 w-4 mr-2" />
            Share Recording
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownloadPDF()}
            disabled={loading}
          >
            <FaDownload className="h-4 w-4 mr-2" />
            Download PDF Report
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="moments">Top Moments</TabsTrigger>
              <TabsTrigger value="sentiment">Feedback</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Viewers */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Viewers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {analytics?.viewership.totalViews || displayStream.totalViews}
                      </div>
                      <FaUsers className="h-8 w-8 text-blue-500 opacity-70" />
                    </div>
                  </CardContent>
                </Card>

                {/* Peak Viewers */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Peak Viewers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">{displayStream.peakViewers}</div>
                      <FaChartLine className="h-8 w-8 text-green-500 opacity-70" />
                    </div>
                  </CardContent>
                </Card>

                {/* Duration */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Duration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">{formatDuration(duration)}</div>
                      <FaClock className="h-8 w-8 text-purple-500 opacity-70" />
                    </div>
                  </CardContent>
                </Card>

                {/* Avg Watch Time */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Avg Watch Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {formatDuration(analytics?.viewership.averageWatchTime || 0)}
                      </div>
                      <FaEye className="h-8 w-8 text-orange-500 opacity-70" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stream Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Stream Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Started</span>
                    <span className="text-sm font-medium">
                      {displayStream.startedAt
                        ? format(new Date(displayStream.startedAt), "MMM d, yyyy 'at' h:mm a")
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Ended</span>
                    <span className="text-sm font-medium">
                      {displayStream.endedAt
                        ? format(new Date(displayStream.endedAt), "MMM d, yyyy 'at' h:mm a")
                        : "N/A"}
                    </span>
                  </div>
                  {(() => {
                    const hasRecording =
                      !!displayStream.recordingUrl ||
                      (displayStream as unknown as { recordingStatus?: string })
                        ?.recordingStatus === "READY";
                    return (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Recording</span>
                        <Badge variant={hasRecording ? "default" : "secondary"}>
                          {hasRecording ? "Available" : "Not Available"}
                        </Badge>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Engagement Tab */}
            <TabsContent value="engagement" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Comments */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Comments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {analytics?.engagement.totalComments || 0}
                      </div>
                      <FaComment className="h-8 w-8 text-blue-500 opacity-70" />
                    </div>
                  </CardContent>
                </Card>

                {/* Comments Per Minute */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Engagement Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {analytics?.engagement.engagementRate.toFixed(1) || "0.0"}%
                      </div>
                      <FaChartLine className="h-8 w-8 text-green-500 opacity-70" />
                    </div>
                  </CardContent>
                </Card>

                {/* Total Reactions */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Reactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {analytics?.engagement.totalReactions || 0}
                      </div>
                      <span className="text-2xl">❤️</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Reaction Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Reactions Breakdown</CardTitle>
                  <CardDescription>Types of reactions during the stream</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics?.engagement.reactionBreakdown &&
                  analytics.engagement.reactionBreakdown.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.engagement.reactionBreakdown.map((reaction, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium capitalize">{reaction.type}</span>
                            <span className="text-sm text-muted-foreground">{reaction.count}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{
                                width: `${(reaction.count / (analytics.engagement.totalReactions || 1)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No reaction data available
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audience Tab */}
            <TabsContent value="audience" className="space-y-4">
              {/* Viewer Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Unique Viewers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {analytics?.viewership.totalUniqueViewers || 0}
                      </div>
                      <FaUsers className="h-8 w-8 text-blue-500 opacity-70" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Anonymous Viewers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {analytics?.viewership.anonymousViewers || 0}
                      </div>
                      <FaGlobe className="h-8 w-8 text-green-500 opacity-70" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Registered Viewers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {analytics?.viewership.registeredViewers || 0}
                      </div>
                      <FaUsers className="h-8 w-8 text-purple-500 opacity-70" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Replay Views
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold">
                        {analytics?.viewership.replayViews || 0}
                      </div>
                      <FaEye className="h-8 w-8 text-orange-500 opacity-70" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Viewer Timeline</CardTitle>
                  <CardDescription>How viewership changed during the stream</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics?.timeline && analytics.timeline.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.timeline.map((point, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground w-20">
                            {format(new Date(point.timestamp), "HH:mm")}
                          </span>
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-6 relative">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-6 rounded-full flex items-center justify-center"
                                style={{
                                  width: `${(point.concurrentViewers / (displayStream.peakViewers || 1)) * 100}%`,
                                  minWidth: "40px",
                                }}
                              >
                                <span className="text-xs text-white font-medium">
                                  {point.concurrentViewers}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No timeline data available
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Top Moments Tab */}
            <TabsContent value="moments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Moments</CardTitle>
                  <CardDescription>Most engaged timestamps during the stream</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics?.topMoments && analytics.topMoments.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.topMoments.map((moment, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="default" className="bg-orange-500">
                                <FaFire className="h-3 w-3 mr-1" />#{index + 1}
                              </Badge>
                              <span className="text-sm font-medium">
                                {format(new Date(moment.timestamp), "HH:mm:ss")}
                              </span>
                            </div>
                            <Badge variant="outline">{moment.engagementScore} points</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{moment.description}</p>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <FaUsers className="h-4 w-4 text-blue-500" />
                              <span className="font-medium">{moment.viewers}</span>
                              <span className="text-muted-foreground">viewers</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FaComment className="h-4 w-4 text-green-500" />
                              <span className="font-medium">{moment.comments}</span>
                              <span className="text-muted-foreground">comments</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">❤️</span>
                              <span className="font-medium">{moment.reactions}</span>
                              <span className="text-muted-foreground">reactions</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No top moments identified. Engagement data needed.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sentiment Analysis Tab */}
            <TabsContent value="sentiment" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Positive Sentiment */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Positive Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-2xl font-bold">
                        {analytics?.sentiment?.positive || 0}%
                      </div>
                      <FaThumbsUp className="h-8 w-8 text-green-500 opacity-70" />
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${analytics?.sentiment?.positive || 0}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Neutral Sentiment */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Neutral Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-2xl font-bold">
                        {analytics?.sentiment?.neutral || 0}%
                      </div>
                      <FaMeh className="h-8 w-8 text-gray-500 opacity-70" />
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-gray-500 h-2 rounded-full"
                        style={{ width: `${analytics?.sentiment?.neutral || 0}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Negative Sentiment */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Negative Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-2xl font-bold">
                        {analytics?.sentiment?.negative || 0}%
                      </div>
                      <FaThumbsDown className="h-8 w-8 text-red-500 opacity-70" />
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${analytics?.sentiment?.negative || 0}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sample Comments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Positive Comments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FaThumbsUp className="h-4 w-4 text-green-500" />
                      Positive Comments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics?.sentiment?.topPositiveComments &&
                    analytics.sentiment.topPositiveComments.length > 0 ? (
                      <div className="space-y-2">
                        {analytics.sentiment.topPositiveComments.map((comment, index) => (
                          <div
                            key={index}
                            className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-lg"
                          >
                            <p className="text-sm">&quot;{comment}&quot;</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No positive comments found
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Negative Comments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FaThumbsDown className="h-4 w-4 text-red-500" />
                      Negative Comments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics?.sentiment?.topNegativeComments &&
                    analytics.sentiment.topNegativeComments.length > 0 ? (
                      <div className="space-y-2">
                        {analytics.sentiment.topNegativeComments.map((comment, index) => (
                          <div
                            key={index}
                            className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg"
                          >
                            <p className="text-sm">&quot;{comment}&quot;</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No negative comments found
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StreamAnalyticsDialog;
