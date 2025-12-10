// components/MobileNavigation.jsx
import { useState, useEffect, useRef } from "react";
import {
  Cross,
  Camera,
  Book,
  Flame,
  Heart,
  Menu,
  X,
  Music,
  Volume2,
  VolumeX,
  Pen,
} from "lucide-react";
import MusicPlayer from "./MusicPlayer.tsx";
import { useMusic } from "./MusicContext.jsx";

const MobileNavigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Use shared music state
  const { isPlaying, isMuted, togglePlay, toggleMute } = useMusic();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobileMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const scrollToSection = (sectionId) => {
    const element =
      sectionId === "hero" ? document.getElementById("root") : document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  const navItems = [
    { id: "hero", icon: Cross, label: "Memorial" },
    { id: "journey", icon: Book, label: "Journey" },
    { id: "gallery", icon: Camera, label: "Gallery" },
    { id: "condolences", icon: Heart, label: "Condolences" },
    { id: "candles", icon: Flame, label: "Candles" },
    { id: "tributes", icon: Pen, label: "Tributes" },
  ];

  return (
    <>
      <MusicPlayer
        externalIsPlaying={isPlaying}
        onTogglePlay={togglePlay}
        externalIsMuted={isMuted}
        onToggleMute={toggleMute}
      />

      {/* Fixed Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="flex flex-col items-end px-4 pb-4">
          {/* Expanded Menu with Smooth Transition */}
          <div
            ref={menuRef}
            className={`
              w-full max-w-sm ml-auto mb-3
              transition-all duration-300 ease-in-out
              transform
              ${
                isMobileMenuOpen
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-4 scale-95 pointer-events-none"
              }
            `}
          >
            <div className="bg-black/70 backdrop-blur-sm border border-primary/50 rounded-2xl p-3 shadow-2xl">
              <div className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className="flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-200 text-white/90 hover:bg-white/10 hover:text-white whitespace-nowrap active:scale-95"
                      aria-label={item.label}
                    >
                      <Icon size={18} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Control Buttons - Always visible at bottom */}
          <div className="flex gap-2 bg-black/80 backdrop-blur-sm border-2 border-primary/50 rounded-2xl p-2 shadow-2xl">
            {/* Music Play/Pause */}
            <button
              onClick={togglePlay}
              className={`p-3 rounded-xl transition-all duration-300 ${
                isPlaying
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/50"
                  : "bg-primary/20 text-primary hover:bg-primary/30"
              }`}
              aria-label={isPlaying ? "Pause music" : "Play music"}
            >
              <Music size={20} className={isPlaying ? "animate-pulse" : ""} />
            </button>

            {/* Mute/Unmute */}
            <button
              onClick={toggleMute}
              className={`p-3 rounded-xl transition-all duration-300 ${
                isMuted
                  ? "bg-amber-500 text-white"
                  : "bg-primary/20 text-primary hover:bg-primary/30"
              }`}
              aria-label={isMuted ? "Unmute music" : "Mute music"}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            {/* Menu Toggle */}
            <button
              ref={buttonRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-3 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-all duration-300"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;
