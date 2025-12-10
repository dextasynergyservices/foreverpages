// contexts/MusicContext.jsx
"use client";

import { createContext, useContext, useState, useEffect } from "react";

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Auto-play when user first interacts (to handle browser restrictions)
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true);
        setIsPlaying(true);
      }
    };

    // Listen for user interactions
    document.addEventListener("click", handleFirstInteraction, { once: true });
    document.addEventListener("touchstart", handleFirstInteraction, { once: true });

    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [hasUserInteracted]);

  const togglePlay = () => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <MusicContext.Provider
      value={{
        isPlaying,
        setIsPlaying,
        isMuted,
        setIsMuted,
        togglePlay,
        toggleMute,
        hasUserInteracted,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
};
