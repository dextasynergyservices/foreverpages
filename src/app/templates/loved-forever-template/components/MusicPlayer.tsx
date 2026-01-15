"use client";

import { useEffect, useRef, useState } from "react";

const MusicPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    // Try to play automatically when component mounts
    const playAudio = async () => {
      try {
        if (audioRef.current) {
          audioRef.current.volume = 0.3; // Set volume to 30%
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } catch {
        console.log('Autoplay prevented. User interaction required.');
        // Autoplay was prevented, we'll wait for user interaction
      }
    };

    playAudio();
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
      setUserInteracted(true);
    } catch (error) {
      console.log('Play failed:', error);
    }
  };

  const handleUserInteraction = async () => {
    if (!userInteracted && audioRef.current && !isPlaying) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setUserInteracted(true);
      } catch (error) {
        console.log('Play failed after interaction:', error);
      }
    }
  };

  return (
    <>
      {/* Hidden audio element */}
      <audio ref={audioRef} loop preload="auto">
        <source src='https://res.cloudinary.com/dxoorukfj/video/upload/v1764855706/Don_Williams_-_I_Believe_In_You_Roger_Cook_Sam_Hogin_1980__mp3.pm_kfxbjf.mp3' type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      {/* Music control button */}
      <div className="fixed bottom-6 right-6 z-50" onClick={handleUserInteraction}>
        <button
          onClick={togglePlay}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg hover:bg-white/30 transition-all duration-300 group"
          aria-label={isPlaying ? 'Pause background music' : 'Play background music'}
        >
          {isPlaying ? (
            <span className="text-white text-lg">⏸️</span>
          ) : (
            <span className="text-white text-lg">🎵</span>
          )}
        </button>

        {/* Visual indicator when playing */}
        {isPlaying && (
          <div className="absolute -top-1 -right-1">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </>
  );
};

export default MusicPlayer;
