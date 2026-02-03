"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Heart, MessageCircle, Sparkles, Flame, Smile, HandHeart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
  isVerified?: boolean;
}

interface Reaction {
  id: string;
  type: string;
  count: number;
}

interface ViewerChatProps {
  streamId: string;
  memorialName: string;
  allowComments: boolean;
  isLocked?: boolean;
}

const reactionIcons: Record<string, { icon: typeof Heart; label: string }> = {
  heart: { icon: Heart, label: "Heart" },
  prayer: { icon: HandHeart, label: "Prayer" },
  candle: { icon: Flame, label: "Candle" },
  flower: { icon: Sparkles, label: "Flower" },
  dove: { icon: MessageCircle, label: "Dove" },
  applause: { icon: Smile, label: "Applause" },
};

export default function ViewerChat({
  streamId,
  memorialName,
  allowComments,
  isLocked = false,
}: ViewerChatProps) {
  const [newComment, setNewComment] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // TanStack Query: Fetch comments with polling
  const { data: commentsData } = useQuery({
    queryKey: ["viewer-comments", streamId],
    queryFn: async () => {
      const response = await fetch(`/api/streams/${streamId}/comments`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
    refetchInterval: 3000,
    staleTime: 2000,
    enabled: !isLocked,
  });

  // TanStack Query: Fetch reactions with polling
  const { data: reactionsData } = useQuery({
    queryKey: ["viewer-reactions", streamId],
    queryFn: async () => {
      const response = await fetch(`/api/streams/${streamId}/reactions`);
      if (!response.ok) throw new Error("Failed to fetch reactions");
      return response.json();
    },
    refetchInterval: 3000,
    staleTime: 2000,
    enabled: !isLocked,
  });

  // Derive state from queries (memoized to prevent unnecessary re-renders)
  const comments: Comment[] = useMemo(() => commentsData?.comments || [], [commentsData?.comments]);
  const reactions: Reaction[] = reactionsData?.reactions || [];

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  // Mutation: Submit comment
  const submitCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/streams/${streamId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to post comment");
      }
      return response.json();
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["viewer-comments", streamId] });
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to post comment. Please try again.");
    },
  });

  // Mutation: Send reaction
  const sendReactionMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await fetch(`/api/streams/${streamId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!response.ok) throw new Error("Failed to send reaction");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viewer-reactions", streamId] });
    },
  });

  // Handler: Submit comment
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitCommentMutation.isPending) return;
    submitCommentMutation.mutate(newComment.trim());
  };

  // Handler: Send reaction
  const handleReaction = (type: string) => {
    if (isLocked) return;
    sendReactionMutation.mutate(type);
  };

  if (isLocked) {
    return (
      <Card className="h-full bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-8">
            Chat is locked. Enter password to participate.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[calc(100vh-200px)] flex flex-col bg-black/40 border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg">Live Chat</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden p-4">
        {/* Reactions */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(reactionIcons).map(([type, { icon: Icon }]) => {
            const reactionCount = reactions.find((r) => r.type === type)?.count || 0;
            return (
              <Button
                key={type}
                variant="ghost"
                size="sm"
                onClick={() => handleReaction(type)}
                className="text-white hover:bg-white/10 gap-1"
              >
                <Icon className="h-4 w-4" />
                {reactionCount > 0 && <span className="text-xs">{reactionCount}</span>}
              </Button>
            );
          })}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {comments.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Be the first to share your thoughts</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="font-medium text-white text-sm">{comment.authorName}</span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-white/90 text-sm">{comment.content}</p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {allowComments && (
          <form onSubmit={handleSubmitComment} className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`Share your memories of ${memorialName}...`}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              maxLength={500}
              disabled={submitCommentMutation.isPending}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newComment.trim() || submitCommentMutation.isPending}
              className="bg-white/20 hover:bg-white/30"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}

        {!allowComments && (
          <p className="text-center text-gray-400 text-sm">Comments are disabled for this stream</p>
        )}
      </CardContent>
    </Card>
  );
}
