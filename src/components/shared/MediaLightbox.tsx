"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";

export interface MediaItem {
  id: string;
  url: string;
  caption?: string;
  type: "image" | "video";
  title?: string;
  description?: string;
}

interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  items: MediaItem[];
  initialIndex?: number;
  showNavigation?: boolean;
  showCaptions?: boolean;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({
  isOpen,
  onClose,
  items,
  initialIndex = 0,
  showNavigation = true,
  showCaptions = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  const currentItem = items[currentIndex];

  // Reset video state when changing items
  useEffect(() => {
    setIsVideoPlaying(false);
    setVideoRef(null);
  }, [currentIndex]);

  // Update current index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  }, [items.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items.length]);

  const toggleVideoPlayback = useCallback(() => {
    if (!videoRef) return;

    if (isVideoPlaying) {
      videoRef.pause();
    } else {
      videoRef.play();
    }
    setIsVideoPlaying(!isVideoPlaying);
  }, [videoRef, isVideoPlaying]);

  const toggleVideoMute = useCallback(() => {
    if (!videoRef) return;
    videoRef.muted = !videoRef.muted;
    setIsVideoMuted(!isVideoMuted);
  }, [videoRef, isVideoMuted]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
        case " ":
          event.preventDefault();
          if (currentItem?.type === "video" && videoRef) {
            toggleVideoPlayback();
          }
          break;
      }
    },
    [isOpen, onClose, goToPrevious, goToNext, toggleVideoPlayback, currentItem, videoRef]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !currentItem) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors duration-200"
        aria-label="Close lightbox"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Navigation buttons */}
      {showNavigation && items.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors duration-200"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors duration-200"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Media content */}
      <div className="flex items-center justify-center h-full p-4">
        <div className="relative max-w-7xl max-h-full w-full">
          {currentItem.type === "image" ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={currentItem.url}
                alt={currentItem.caption || "Gallery image"}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                width={1200}
                height={800}
                priority
                quality={95}
              />
            </div>
          ) : (
            <div className="relative">
              <video
                ref={setVideoRef}
                src={currentItem.url}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                controls={false}
                muted={isVideoMuted}
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                onLoadedData={() => {
                  // Auto-play videos when loaded (muted by default)
                  if (videoRef) {
                    videoRef.currentTime = 0;
                  }
                }}
              />

              {/* Custom video controls */}
              <div className="absolute bottom-4 left-4 flex gap-2">
                <button
                  onClick={toggleVideoPlayback}
                  className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors duration-200"
                  aria-label={isVideoPlaying ? "Pause video" : "Play video"}
                >
                  {isVideoPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
                <button
                  onClick={toggleVideoMute}
                  className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors duration-200"
                  aria-label={isVideoMuted ? "Unmute video" : "Mute video"}
                >
                  {isVideoMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Caption */}
      {showCaptions && currentItem.caption && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-2xl">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg px-6 py-3 text-white text-center">
            <p className="text-lg font-medium">{currentItem.caption}</p>
            {currentItem.description && (
              <p className="text-sm text-white/80 mt-1">{currentItem.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Image counter */}
      {items.length > 1 && (
        <div className="absolute bottom-4 right-4">
          <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
            {currentIndex + 1} / {items.length}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} aria-label="Click to close" />
    </div>
  );
};
