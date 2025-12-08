"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textArea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Video } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export interface VideoItem {
  id: string;
  mediaId?: string;
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
}

export interface VideoGalleryData {
  videos: VideoItem[];
}

interface VideoGalleryEditorProps {
  data: VideoGalleryData;
  onChange: (data: VideoGalleryData) => void;
  onOpenMediaPicker?: () => void;
}

export const VideoGalleryEditor: React.FC<VideoGalleryEditorProps> = ({
  data,
  onChange,
  onOpenMediaPicker,
}) => {
  const { theme } = useTheme();
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";

  const updateVideo = (videoId: string, field: keyof VideoItem, value: string) => {
    const updatedVideos = data.videos.map((video) =>
      video.id === videoId ? { ...video, [field]: value } : video
    );
    onChange({ videos: updatedVideos });
  };

  const removeVideo = (videoId: string) => {
    const updatedVideos = data.videos.filter((video) => video.id !== videoId);
    onChange({ videos: updatedVideos });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Video Gallery</h3>
        <p className={`text-sm mb-4 ${textMuted}`}>Share video memories and tributes</p>
      </div>

      <Button onClick={onOpenMediaPicker} className="w-full" variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Add Videos from Gallery
      </Button>

      <div className="space-y-4">
        {data.videos.length === 0 ? (
          <div
            className={`text-center py-12 border-2 border-dashed rounded-lg ${
              theme === "dark" ? "border-white/10" : "border-gray-200"
            }`}
          >
            <Video className={`h-12 w-12 mx-auto mb-3 ${textMuted}`} />
            <p className={textMuted}>No videos added yet</p>
          </div>
        ) : (
          data.videos.map((video) => (
            <div
              key={video.id}
              className={`p-6 rounded-lg border ${
                theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex gap-4">
                {/* Video Preview */}
                <div className="flex-shrink-0">
                  <video src={video.url} className="w-32 h-24 object-cover rounded" controls />
                </div>

                {/* Video Details */}
                <div className="flex-1 space-y-3">
                  <div>
                    <Label htmlFor={`video-title-${video.id}`}>Title (Optional)</Label>
                    <Input
                      id={`video-title-${video.id}`}
                      placeholder="Video title..."
                      value={video.title || ""}
                      onChange={(e) => updateVideo(video.id, "title", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`video-description-${video.id}`}>Description (Optional)</Label>
                    <Textarea
                      id={`video-description-${video.id}`}
                      placeholder="Describe this video..."
                      rows={2}
                      value={video.description || ""}
                      onChange={(e) => updateVideo(video.id, "description", e.target.value)}
                    />
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeVideo(video.id)}
                  className={`self-start p-2 rounded-md transition-colors ${
                    theme === "dark"
                      ? "hover:bg-red-500/20 text-red-400"
                      : "hover:bg-red-100 text-red-600"
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
