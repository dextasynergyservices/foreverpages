"use client";

import React, { useState } from "react";
import { Youtube, Film, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VideoEmbedDialogProps {
  memorialId: string;
  onEmbed?: (videoData: unknown) => void;
  trigger?: React.ReactNode;
}

export function VideoEmbedDialog({ memorialId, onEmbed, trigger }: VideoEmbedDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const extractVideoId = (url: string) => {
    // YouTube patterns
    const youtubePatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];

    for (const pattern of youtubePatterns) {
      const match = url.match(pattern);
      if (match) {
        return { platform: "youtube", id: match[1] };
      }
    }

    // Vimeo patterns
    const vimeoPattern = /vimeo\.com\/(?:video\/)?(\d+)/;
    const vimeoMatch = url.match(vimeoPattern);
    if (vimeoMatch) {
      return { platform: "vimeo", id: vimeoMatch[1] };
    }

    return null;
  };

  const handleEmbed = async () => {
    if (!url.trim()) {
      alert("Please enter a video URL");
      return;
    }

    const videoData = extractVideoId(url);
    if (!videoData) {
      alert("Invalid YouTube or Vimeo URL");
      return;
    }

    setLoading(true);

    try {
      // Create a special upload entry for embedded videos
      const response = await fetch(`/api/memorials/${memorialId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "VIDEO",
          embedData: videoData,
          title: title || `${videoData.platform} Video`,
          url: url,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert("Video embedded successfully");
        setOpen(false);
        setUrl("");
        setTitle("");
        onEmbed?.(result.data);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to embed video");
      }
    } catch (error) {
      console.error("Failed to embed video:", error);
      alert("Failed to embed video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <LinkIcon className="mr-2 h-4 w-4" />
            Embed Video
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Embed Video</DialogTitle>
          <DialogDescription>
            Add videos from YouTube or Vimeo to your memorial page
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-4 rounded-lg border p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
              <Youtube className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">YouTube</p>
              <p className="text-sm text-muted-foreground">
                youtube.com/watch?v=... or youtu.be/...
              </p>
            </div>
          </div>
          <div className="flex gap-4 rounded-lg border p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Film className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Vimeo</p>
              <p className="text-sm text-muted-foreground">vimeo.com/...</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="video-url">Video URL</Label>
            <Input
              id="video-url"
              placeholder="https://youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="video-title">Title (Optional)</Label>
            <Input
              id="video-title"
              placeholder="Enter video title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleEmbed} disabled={loading}>
            {loading ? "Embedding..." : "Embed Video"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
