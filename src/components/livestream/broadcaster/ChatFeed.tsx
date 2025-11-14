"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FaComment,
  FaHeart,
  FaFire,
  FaThumbtack,
  FaTrash,
  FaEyeSlash,
  FaDownload,
} from "react-icons/fa6";
import { FaPrayingHands, FaDove, FaSeedling, FaHandHoldingHeart } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
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

interface ChatMessage {
  id: string;
  authorName: string;
  authorEmail: string | null;
  content: string;
  timestamp: number;
  isHidden: boolean;
  isPinned: boolean;
  moderationReason?: string | null;
}

interface Reaction {
  id: string;
  type: string;
  viewerName: string | null;
  timestamp: number;
}

interface ChatFeedProps {
  streamId: string;
  enableReactions: boolean;
  onViewerCountUpdate: (count: number) => void;
}

const ChatFeed: React.FC<ChatFeedProps> = ({ streamId, enableReactions, onViewerCountUpdate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/streams/${streamId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reactions
  const fetchReactions = async () => {
    try {
      const response = await fetch(`/api/streams/${streamId}/reactions`);
      if (response.ok) {
        const data = await response.json();
        setReactions(data.data?.recent || []);
      }
    } catch (error) {
      console.error("Failed to fetch reactions:", error);
    }
  };

  // Fetch viewers count
  const fetchViewers = async () => {
    try {
      const response = await fetch(`/api/streams/${streamId}/viewers`);
      if (response.ok) {
        const data = await response.json();
        onViewerCountUpdate(data.data?.length || 0);
      }
    } catch (error) {
      console.error("Failed to fetch viewers:", error);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMessages();
    fetchReactions();
    fetchViewers();

    // Poll for updates every 3 seconds
    const interval = setInterval(() => {
      fetchMessages();
      fetchReactions();
      fetchViewers();
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Moderation handlers
  const hideMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/streams/${streamId}/comments/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHidden: true, moderationReason: "Hidden by broadcaster" }),
      });

      if (!response.ok) throw new Error("Failed to hide message");

      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, isHidden: true } : msg))
      );
      toast.success("Message hidden");
    } catch (error) {
      console.error("Failed to hide message:", error);
      toast.error("Failed to hide message");
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/streams/${streamId}/comments/${messageId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete message");

      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      toast.success("Message deleted");
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast.error("Failed to delete message");
    }
  };

  const pinMessage = async (messageId: string, isPinned: boolean) => {
    try {
      const response = await fetch(`/api/streams/${streamId}/comments/${messageId}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned }),
      });

      if (!response.ok) throw new Error("Failed to pin/unpin message");

      setMessages((prev) =>
        prev.map((msg) => {
          // Unpin all other messages if pinning this one
          if (isPinned && msg.id !== messageId) {
            return { ...msg, isPinned: false };
          }
          if (msg.id === messageId) {
            return { ...msg, isPinned };
          }
          return msg;
        })
      );
      toast.success(isPinned ? "Message pinned" : "Message unpinned");
    } catch (error) {
      console.error("Failed to pin/unpin message:", error);
      toast.error("Failed to update message");
    }
  };

  const exportChat = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/streams/${streamId}/comments/export`);
      if (!response.ok) throw new Error("Failed to export chat");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-${streamId}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Chat exported successfully");
    } catch (error) {
      console.error("Failed to export chat:", error);
      toast.error("Failed to export chat");
    } finally {
      setExporting(false);
    }
  };

  const getReactionIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      HEART: <FaHeart className="h-4 w-4 text-red-400" />,
      PRAYER: <FaPrayingHands className="h-4 w-4 text-blue-400" />,
      CANDLE: <FaFire className="h-4 w-4 text-orange-400" />,
      FLOWER: <FaSeedling className="h-4 w-4 text-pink-400" />,
      DOVE: <FaDove className="h-4 w-4 text-white" />,
      APPLAUSE: <FaHandHoldingHeart className="h-4 w-4 text-yellow-400" />,
    };
    return icons[type] || null;
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800 h-[calc(100vh-180px)]">
      <CardHeader className="border-b border-gray-800 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FaComment className="h-5 w-5" />
            Live Chat
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={exportChat}
            disabled={exporting || messages.length === 0}
          >
            <FaDownload className="h-4 w-4 mr-2" />
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col h-[calc(100%-72px)]">
        {/* Recent Reactions */}
        {enableReactions && reactions.length > 0 && (
          <div className="border-b border-gray-800 p-3 bg-gray-950/50">
            <p className="text-xs text-gray-400 mb-2">Recent Reactions</p>
            <div className="flex flex-wrap gap-2">
              {reactions.slice(0, 10).map((reaction) => (
                <div
                  key={reaction.id}
                  className="flex items-center gap-1 bg-gray-800/50 rounded-full px-2 py-1"
                >
                  {getReactionIcon(reaction.type)}
                  <span className="text-xs text-gray-300">{reaction.viewerName || "Guest"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
              <p className="text-sm text-gray-400">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <FaComment className="h-12 w-12 mx-auto mb-3 text-gray-600" />
              <p className="text-sm text-gray-400">No messages yet</p>
              <p className="text-xs text-gray-500 mt-1">Messages from viewers will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Pinned Message */}
              {messages.find((msg) => msg.isPinned && !msg.isHidden) && (
                <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FaThumbtack className="h-4 w-4 text-purple-400" />
                    <p className="text-xs font-medium text-purple-400">Pinned Message</p>
                  </div>
                  {messages
                    .filter((msg) => msg.isPinned && !msg.isHidden)
                    .map((message) => (
                      <div key={message.id} className="group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-white truncate">
                                {message.authorName}
                              </p>
                              {message.authorEmail && (
                                <Badge variant="outline" className="text-xs">
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-200 break-words">{message.content}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100"
                            onClick={() => pinMessage(message.id, false)}
                          >
                            <FaThumbtack className="h-4 w-4 text-purple-400" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Regular Messages */}
              {messages
                .filter((msg) => !msg.isHidden && !msg.isPinned)
                .map((message) => (
                  <div
                    key={message.id}
                    className="bg-gray-800/30 rounded-lg p-3 hover:bg-gray-800/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-white truncate">
                            {message.authorName}
                          </p>
                          {message.authorEmail && (
                            <Badge variant="outline" className="text-xs">
                              Verified
                            </Badge>
                          )}
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                        <p className="text-sm text-gray-300 break-words">{message.content}</p>
                        {message.moderationReason && (
                          <p className="text-xs text-yellow-500 mt-1">
                            ⚠️ {message.moderationReason}
                          </p>
                        )}
                      </div>

                      {/* Moderation Buttons */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => pinMessage(message.id, true)}
                          title="Pin message"
                        >
                          <FaThumbtack className="h-4 w-4 text-gray-400 hover:text-purple-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => hideMessage(message.id)}
                          title="Hide message"
                        >
                          <FaEyeSlash className="h-4 w-4 text-gray-400 hover:text-yellow-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(message.id)}
                          title="Delete message"
                        >
                          <FaTrash className="h-4 w-4 text-gray-400 hover:text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="border-t border-gray-800 p-3 bg-gray-950/50">
          <p className="text-xs text-gray-500 text-center">
            Pin important messages, hide inappropriate content, or delete permanently.
          </p>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this message? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && deleteMessage(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ChatFeed;
