"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  FaPlay,
  FaPause,
  FaExpand,
  FaCompress,
  FaVolumeUp,
  FaVolumeMute,
  FaCog,
} from "react-icons/fa";
import { MdPictureInPictureAlt } from "react-icons/md";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StreamQuality } from "@/generated/prisma";

interface VideoPlayerProps {
  stream: MediaStream | null;
  videoUrl?: string; // For recordings
  isLive: boolean;
  currentQuality: StreamQuality;
  onQualityChange: (quality: StreamQuality) => void;
  className?: string;
}

const QUALITY_LABELS: Record<StreamQuality, string> = {
  LOWEST: "144p",
  LOW: "240p",
  MEDIUM: "360p",
  SD: "480p",
  HD: "720p",
  FULL_HD: "1080p",
};

export default function VideoPlayer({
  stream,
  videoUrl,
  isLive,
  currentQuality,
  onQualityChange,
  className = "",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  // Mute live streams by default so autoplay is allowed by browsers
  const [isMuted, setIsMuted] = useState<boolean>(() => (isLive ? true : false));
  const [volume, setVolume] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const hideControlsTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  // Attach stream/source to video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Debug: remember previous stream id for tracing
    const prevStreamId = (video.srcObject as MediaStream | null)?.id ?? null;

    if (stream) {
      try {
        // Force reattach to ensure we always play the latest MediaStream.
        const current = video.srcObject as MediaStream | null;
        if (!current || current.id !== stream.id) {
          console.log(
            "[VideoPlayer] reattaching MediaStream (prev -> new):",
            prevStreamId,
            "->",
            stream.id
          );

          // Stop tracks of previous stream if present to avoid the video element reusing old frames
          if (current) {
            try {
              current.getTracks().forEach((t) => {
                try {
                  t.stop();
                } catch {}
              });
            } catch {}
          }

          // detach previous and attach new stream
          try {
            video.srcObject = null;
          } catch {}
          // Clone tracks into a fresh MediaStream to avoid shared references keeping old frames
          try {
            const cloned = new MediaStream(stream.getTracks().map((t) => t.clone()));
            video.srcObject = cloned;
          } catch {
            // Fallback: attach original
            video.srcObject = stream;
          }
        } else {
          // already attached same stream id
          console.log("[VideoPlayer] MediaStream already attached, id:", stream.id);
        }
        console.log(
          "[VideoPlayer] attached MediaStream, tracks:",
          stream.getTracks().map((t) => `${t.kind}:${t.readyState}`)
        );
        // Attempt to play to surface autoplay permission errors
        video
          .play()
          .then(() => {
            console.log("[VideoPlayer] autoplay succeeded for MediaStream");
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn("[VideoPlayer] autoplay failed for MediaStream:", err);
            setIsPlaying(false);
          });
      } catch (err) {
        console.error("[VideoPlayer] failed to attach MediaStream:", err);
      }
    } else if (videoUrl) {
      try {
        video.srcObject = null;
        // When attaching a recording URL, clear any previous MediaStream to avoid conflicts
        if (video.srcObject) {
          try {
            video.srcObject = null;
          } catch {}
        }
        video.src = videoUrl;
        console.log("[VideoPlayer] attached videoUrl:", videoUrl);
        video
          .play()
          .then(() => {
            console.log("[VideoPlayer] autoplay succeeded for videoUrl");
            setIsPlaying(true);
          })
          .catch((err) => console.warn("[VideoPlayer] autoplay failed for videoUrl:", err));
      } catch (err) {
        console.error("[VideoPlayer] failed to attach videoUrl:", err);
      }
    } else {
      // No source
      try {
        video.srcObject = null;
        video.removeAttribute("src");
        console.log("[VideoPlayer] cleared source (no stream/videoUrl)");
      } catch {
        // ignore
      }
    }
  }, [stream, videoUrl]);

  // Dev-only overlay showing current stream metadata to help debugging old vs new streams
  const isDev = process.env.NODE_ENV !== "production";

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Handle PiP changes
  useEffect(() => {
    const video = videoRef.current;
    const handlePiPChange = () => {
      setIsPiP(document.pictureInPictureElement === video);
    };

    video?.addEventListener("enterpictureinpicture", handlePiPChange);
    video?.addEventListener("leavepictureinpicture", handlePiPChange);

    return () => {
      video?.removeEventListener("enterpictureinpicture", handlePiPChange);
      video?.removeEventListener("leavepictureinpicture", handlePiPChange);
    };
  }, []);

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying && !isPiP) {
        setShowControls(false);
      }
    }, 3000);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Keep the underlying video element's muted property in sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Track play/pause/waiting events to keep isPlaying accurate so overlays
  // (spinner / play button) only show when the player is truly not producing frames.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlaying = () => setIsPlaying(true);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsPlaying(false);

    video.addEventListener("playing", handlePlaying);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);

    return () => {
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
    };
    // Re-run if the ref changes
  }, []);

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
      if (newVolume === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  const togglePictureInPicture = async () => {
    if (!videoRef.current) return;

    try {
      if (!isPiP) {
        await videoRef.current.requestPictureInPicture();
      } else {
        await document.exitPictureInPicture();
      }
    } catch (error) {
      console.error("Picture-in-Picture error:", error);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-black group ${className} flex items-center justify-center`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying && !isPiP) {
          setShowControls(false);
        }
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        // Use object-cover to fill the player while keeping center crop
        className="w-full h-full object-cover bg-black z-0"
      />

      {/* Buffering overlay to avoid black flash when no frame yet */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 border-4 border-white/40 rounded-full animate-spin" />
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 z-20 pointer-events-none ${
          showControls || !isPlaying ? "opacity-100 pointer-events-auto" : "opacity-0"
        }`}
      >
        {/* Top Bar - Quality Selector */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="bg-black/50 hover:bg-black/70 text-white"
              >
                <FaCog className="mr-2 h-3 w-3" />
                {QUALITY_LABELS[currentQuality]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900 border-gray-700 text-white">
              <DropdownMenuItem
                onClick={() => onQualityChange("FULL_HD")}
                className={currentQuality === "FULL_HD" ? "bg-gray-700" : ""}
              >
                1080p (Full HD)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onQualityChange("HD")}
                className={currentQuality === "HD" ? "bg-gray-700" : ""}
              >
                720p (HD)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onQualityChange("SD")}
                className={currentQuality === "SD" ? "bg-gray-700" : ""}
              >
                480p (SD)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onQualityChange("MEDIUM")}
                className={currentQuality === "MEDIUM" ? "bg-gray-700" : ""}
              >
                360p (Medium)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onQualityChange("LOW")}
                className={currentQuality === "LOW" ? "bg-gray-700" : ""}
              >
                240p (Low)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onQualityChange("LOWEST")}
                className={currentQuality === "LOWEST" ? "bg-gray-700" : ""}
              >
                144p (Lowest)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Control Buttons */}
          <div className="flex items-center gap-2">
            {/* Play/Pause (only for recordings) */}
            {!isLive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlayPause}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <FaPause className="h-4 w-4" /> : <FaPlay className="h-4 w-4" />}
              </Button>
            )}

            {/* Volume */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
              >
                {isMuted || volume === 0 ? (
                  <FaVolumeMute className="h-4 w-4" />
                ) : (
                  <FaVolumeUp className="h-4 w-4" />
                )}
              </Button>
              <div className="w-20">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={handleVolumeChange}
                  min={0}
                  max={100}
                  step={1}
                  className="[&>span]:bg-white"
                />
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Live Badge */}
            {isLive && (
              <div className="bg-red-600 px-3 py-1 rounded-full flex items-center gap-2">
                <span className="animate-pulse">●</span>
                <span className="text-xs font-semibold text-white">LIVE</span>
              </div>
            )}

            {/* Picture-in-Picture */}
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePictureInPicture}
              className="text-white hover:bg-white/20"
            >
              <MdPictureInPictureAlt className="h-5 w-5" />
            </Button>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? <FaCompress className="h-4 w-4" /> : <FaExpand className="h-4 w-4" />}
            </Button>
          </div>

          {/* Center Play Button (when paused or autoplay blocked) */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-auto">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current
                      .play()
                      .then(() => setIsPlaying(true))
                      .catch((err) => console.warn("Play attempt failed:", err));
                  }
                }}
                className="w-20 h-20 rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                <FaPlay className="h-8 w-8 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
      {isDev && (
        <div className="absolute top-2 left-2 bg-black/60 text-xs text-white p-2 rounded z-40">
          <div>streamId: {stream?.id ?? "(none)"}</div>
          <div>tracks: {stream ? stream.getTracks().length : 0}</div>
        </div>
      )}
    </div>
  );
}
