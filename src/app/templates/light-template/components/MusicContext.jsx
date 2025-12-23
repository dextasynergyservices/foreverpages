// contexts/MusicContext.jsx
"use client";

import { createContext, useContext, useState, useEffect } from "react";

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Removed autoplay - music will only play when user explicitly clicks play

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
