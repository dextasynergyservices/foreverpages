"use client";

// components/MusicPlayer.jsx
import { useEffect, useRef } from "react";

interface MusicPlayerProps {
  externalIsPlaying: boolean;
  onTogglePlay: () => void;
  externalIsMuted: boolean;
  // onToggleMute not currently used but kept in type for future enhancement
}

const MusicPlayer = ({ externalIsPlaying, onTogglePlay, externalIsMuted }: MusicPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize audio settings
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
    }
  }, []);

  // Handle play/pause based on external state
  useEffect(() => {
    if (!audioRef.current) return;

    const handlePlayPause = async () => {
      if (!audioRef.current) return;
      try {
        if (externalIsPlaying) {
          // Only play if we have user interaction
          await audioRef.current.play();
        } else {
          audioRef.current.pause();
        }
      } catch (error) {
        console.log("Audio play error:", error);
        // If play fails, call onTogglePlay to update state
        if (onTogglePlay && externalIsPlaying) {
          onTogglePlay();
        }
      }
    };

    handlePlayPause();
  }, [externalIsPlaying, onTogglePlay]);

  // Handle mute based on external state
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = externalIsMuted;
  }, [externalIsMuted]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (audioRef.current) {
        if (document.hidden && !audioRef.current.paused) {
          audioRef.current.pause();
        } else if (!document.hidden && externalIsPlaying && audioRef.current.paused) {
          audioRef.current.play().catch(console.error);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [externalIsPlaying]);

  return (
    <audio ref={audioRef} loop preload="auto">
      <source
        src="https://res.cloudinary.com/dt7ozsctz/video/upload/v1764167122/bg-music_rfgkga.mp3"
        type="audio/mpeg"
      />
      Your browser does not support the audio element.
    </audio>
  );
};

export default MusicPlayer;
