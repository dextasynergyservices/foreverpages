"use client";

import React, { useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MediaItem {
  id: number;
  url: string;
  title: string;
  type: "image" | "video";
}

interface MediaLightboxProps {
  selectedMedia: MediaItem | null;
  onClose: () => void;
  theme: string;
  photos?: MediaItem[];
  onSelect?: (m: MediaItem | null) => void;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({
  selectedMedia,
  onClose,
  theme,
  photos = [],
  onSelect,
}) => {
  const currentIndex = photos.findIndex((p) => p.id === selectedMedia?.id);
  const hasPhotos = photos.length > 0 && currentIndex !== -1;

  const goNext = useCallback(() => {
    if (!hasPhotos || !onSelect) return;
    const next = photos[(currentIndex + 1) % photos.length];
    onSelect(next);
  }, [hasPhotos, onSelect, photos, currentIndex]);

  const goPrev = useCallback(() => {
    if (!hasPhotos || !onSelect) return;
    const prevIndex = (currentIndex - 1 + photos.length) % photos.length;
    onSelect(photos[prevIndex]);
  }, [hasPhotos, onSelect, photos, currentIndex]);

  useEffect(() => {
    if (!selectedMedia) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedMedia, goNext, goPrev, onClose]);

  if (!selectedMedia) return null;

  return (
    <Dialog open={!!selectedMedia} onOpenChange={onClose}>
      {/* Ensure the content (image) appears above the overlay by using a higher z-index */}
      <DialogContent
        className={`max-w-4xl ${theme === "dark" ? "bg-black text-white border-white/10" : "bg-black text-white border-white/10"} z-60`}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{selectedMedia.title}</DialogTitle>
        </DialogHeader>
        <div className="aspect-video relative flex items-center justify-center z-50">
          {/* Render video or image based on type */}
          {selectedMedia.type === "video" ? (
            <video
              key={selectedMedia.url}
              src={selectedMedia.url}
              controls
              autoPlay
              className="w-full h-full object-contain"
              controlsList="nodownload"
              preload="auto"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <Image
              src={selectedMedia.url}
              alt={selectedMedia.title}
              className="w-full h-full object-contain"
              width={800}
              height={600}
              priority
            />
          )}

          {/* Previous / Next arrows */}
          {hasPhotos && (
            <>
              <button
                aria-label="Previous"
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-2 hover:bg-black/60 focus:outline-none z-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                aria-label="Next"
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-2 hover:bg-black/60 focus:outline-none z-10"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
