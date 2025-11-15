"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FaUsers, FaCrown } from "react-icons/fa";
import { FaThumbtack } from "react-icons/fa";
import { FiRefreshCw } from "react-icons/fi";
import ViewerCard from "./ViewerCard";
import PrivateMessageDialog from "@/components/livestream/broadcaster/PrivateMessageDialog";
import toast from "react-hot-toast";

interface Viewer {
  id: string;
  userId?: string | null;
  user?: {
    name: string;
    email: string;
    image?: string | null;
  } | null;
  guestName?: string | null;
  isPinned: boolean;
  isVIP: boolean;
  isActive: boolean;
  watchTime: number;
  joinedAt: string;
}

interface ViewerListProps {
  streamId: string;
}

const ViewerList: React.FC<ViewerListProps> = ({ streamId }) => {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedViewerId, setSelectedViewerId] = useState<string | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  const fetchViewers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await fetch(`/api/streams/${streamId}/viewers`);
      if (response.ok) {
        const data = await response.json();
        setViewers(data.viewers || []);
      }
    } catch (error) {
      console.error("Failed to fetch viewers:", error);
      if (!isRefresh) {
        toast.error("Failed to load viewers");
      }
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchViewers();

    // Poll every 10 seconds for viewer updates
    const interval = setInterval(() => {
      fetchViewers(true);
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId]);

  const handlePin = async (viewerId: string) => {
    const response = await fetch(`/api/streams/${streamId}/viewers/${viewerId}/pin`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to pin viewer");
    await fetchViewers(true);
  };

  const handleUnpin = async (viewerId: string) => {
    const response = await fetch(`/api/streams/${streamId}/viewers/${viewerId}/pin`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to unpin viewer");
    await fetchViewers(true);
  };

  const handleVIP = async (viewerId: string) => {
    const response = await fetch(`/api/streams/${streamId}/viewers/${viewerId}/vip`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to make VIP");
    await fetchViewers(true);
  };

  const handleRemoveVIP = async (viewerId: string) => {
    const response = await fetch(`/api/streams/${streamId}/viewers/${viewerId}/vip`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to remove VIP");
    await fetchViewers(true);
  };

  const handleKick = async (viewerId: string) => {
    const response = await fetch(`/api/streams/${streamId}/viewers/${viewerId}/kick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Kicked by broadcaster" }),
    });
    if (!response.ok) throw new Error("Failed to kick viewer");
    await fetchViewers(true);
  };

  const handleBan = async (viewerId: string) => {
    const viewer = viewers.find((v) => v.id === viewerId);
    const userIdOrSession = viewer?.userId || viewerId;

    const response = await fetch(`/api/streams/${streamId}/moderation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ban",
        userId: userIdOrSession,
      }),
    });

    if (!response.ok) throw new Error("Failed to ban viewer");

    toast.success("Viewer banned permanently");
    await fetchViewers(true);
  };

  const handleMessage = (viewerId: string) => {
    setSelectedViewerId(viewerId);
    setMessageDialogOpen(true);
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedViewerId) return;

    try {
      const response = await fetch(`/api/streams/${streamId}/viewers/${selectedViewerId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      toast.success("Message sent");
      setMessageDialogOpen(false);
      setSelectedViewerId(null);
    } catch (error) {
      toast.error("Failed to send message");
      throw error;
    }
  };

  const pinnedViewers = viewers.filter((v) => v.isPinned);
  const vipViewers = viewers.filter((v) => v.isVIP && !v.isPinned);
  const regularViewers = viewers.filter((v) => !v.isPinned && !v.isVIP);
  const activeCount = viewers.filter((v) => v.isActive).length;

  if (loading) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FaUsers className="h-5 w-5" />
            Viewers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <FiRefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <FaUsers className="h-5 w-5" />
                Viewers ({activeCount})
              </CardTitle>
              <CardDescription>
                {viewers.length} total • {pinnedViewers.length} pinned • {vipViewers.length} VIP
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchViewers(true)}
              disabled={refreshing}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
            >
              <FiRefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {viewers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FaUsers className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No viewers yet</p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                <TabsTrigger value="all" className="text-xs">
                  All ({viewers.length})
                </TabsTrigger>
                <TabsTrigger value="pinned" className="text-xs">
                  <FaThumbtack className="h-3 w-3 mr-1" />
                  {pinnedViewers.length}
                </TabsTrigger>
                <TabsTrigger value="vip" className="text-xs">
                  <FaCrown className="h-3 w-3 mr-1" />
                  {vipViewers.length}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-2 mt-4 max-h-[400px] overflow-y-auto">
                {pinnedViewers.map((viewer) => (
                  <ViewerCard
                    key={viewer.id}
                    viewer={viewer}
                    onPin={handlePin}
                    onUnpin={handleUnpin}
                    onVIP={handleVIP}
                    onRemoveVIP={handleRemoveVIP}
                    onKick={handleKick}
                    onBan={handleBan}
                    onMessage={handleMessage}
                  />
                ))}
                {vipViewers.map((viewer) => (
                  <ViewerCard
                    key={viewer.id}
                    viewer={viewer}
                    onPin={handlePin}
                    onUnpin={handleUnpin}
                    onVIP={handleVIP}
                    onRemoveVIP={handleRemoveVIP}
                    onKick={handleKick}
                    onBan={handleBan}
                    onMessage={handleMessage}
                  />
                ))}
                {regularViewers.map((viewer) => (
                  <ViewerCard
                    key={viewer.id}
                    viewer={viewer}
                    onPin={handlePin}
                    onUnpin={handleUnpin}
                    onVIP={handleVIP}
                    onRemoveVIP={handleRemoveVIP}
                    onKick={handleKick}
                    onBan={handleBan}
                    onMessage={handleMessage}
                  />
                ))}
              </TabsContent>

              <TabsContent value="pinned" className="space-y-2 mt-4 max-h-[400px] overflow-y-auto">
                {pinnedViewers.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FaThumbtack className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No pinned viewers</p>
                  </div>
                ) : (
                  pinnedViewers.map((viewer) => (
                    <ViewerCard
                      key={viewer.id}
                      viewer={viewer}
                      onPin={handlePin}
                      onUnpin={handleUnpin}
                      onVIP={handleVIP}
                      onRemoveVIP={handleRemoveVIP}
                      onKick={handleKick}
                      onBan={handleBan}
                      onMessage={handleMessage}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="vip" className="space-y-2 mt-4 max-h-[400px] overflow-y-auto">
                {vipViewers.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FaCrown className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No VIP viewers</p>
                  </div>
                ) : (
                  vipViewers.map((viewer) => (
                    <ViewerCard
                      key={viewer.id}
                      viewer={viewer}
                      onPin={handlePin}
                      onUnpin={handleUnpin}
                      onVIP={handleVIP}
                      onRemoveVIP={handleRemoveVIP}
                      onKick={handleKick}
                      onBan={handleBan}
                      onMessage={handleMessage}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Private Message Dialog */}
      <PrivateMessageDialog
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        viewerName={
          viewers.find((v) => v.id === selectedViewerId)?.user?.name ||
          viewers.find((v) => v.id === selectedViewerId)?.guestName ||
          "Viewer"
        }
        onSend={handleSendMessage}
      />
    </>
  );
};

export default ViewerList;
