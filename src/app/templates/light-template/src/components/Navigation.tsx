// components/Navigation.jsx
import { useState, useEffect } from "react";
import {
  Cross,
  Camera,
  Book,
  Flame,
  Heart,
  Music,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMusic } from "./MusicContext.jsx";

const Navigation = () => {
  const [activeSection, setActiveSection] = useState("hero");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Use shared music state
  const { isPlaying, isMuted, togglePlay, toggleMute } = useMusic();

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["hero", "journey", "gallery", "prayers", "candles"];
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      for (const section of sections) {
        const element = document.getElementById(section === "hero" ? "root" : section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element =
      sectionId === "hero" ? document.getElementById("root") : document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navItems = [
    { id: "hero", icon: Cross, label: "Memorial" },
    { id: "journey", icon: Book, label: "Journey" },
    { id: "gallery", icon: Camera, label: "Gallery" },
    { id: "prayers", icon: Heart, label: "Prayers" },
    { id: "candles", icon: Flame, label: "Candles" },
  ];

  return (
    <>
      <nav className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block">
        <div
          className={`bg-card/80 backdrop-blur-sm border-2 border-primary rounded-2xl p-2 space-y-4 transition-all duration-300 ${
            isCollapsed ? "w-14" : "w-auto"
          }`}
        >
          {/* Collapse Toggle Button */}
          <button
            onClick={toggleCollapse}
            className="block p-2 rounded-full text-primary hover:bg-primary/20 transition-all duration-300 w-full"
            aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>

          {/* Music Controls - Show labels when expanded */}
          <div className="space-y-2 pb-2 border-b border-primary/30">
            <button
              onClick={togglePlay}
              className={`flex items-center gap-3 p-3 rounded-full transition-all duration-300 w-full ${
                isPlaying
                  ? "bg-green-500 text-white shadow-lg shadow-green-500/50"
                  : "text-primary hover:bg-primary/20"
              } ${isCollapsed ? "justify-center" : ""}`}
              aria-label={isPlaying ? "Pause music" : "Play music"}
              title={isPlaying ? "Pause music" : "Play music"}
            >
              <Music size={24} className={isPlaying ? "animate-pulse" : ""} />
              {!isCollapsed && (
                <span className="text-sm font-medium whitespace-nowrap">
                  {isPlaying ? "Pause" : "Play"}
                </span>
              )}
            </button>

            <button
              onClick={toggleMute}
              className={`flex items-center gap-3 p-3 rounded-full transition-all duration-300 w-full ${
                isMuted
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/50"
                  : "text-primary hover:bg-primary/20"
              } ${isCollapsed ? "justify-center" : ""}`}
              aria-label={isMuted ? "Unmute music" : "Mute music"}
              title={isMuted ? "Unmute music" : "Mute music"}
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              {!isCollapsed && (
                <span className="text-sm font-medium whitespace-nowrap">
                  {isMuted ? "Unmute" : "Mute"}
                </span>
              )}
            </button>
          </div>

          {/* Navigation Items - Show labels when expanded */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`flex items-center gap-3 p-3 rounded-full transition-all duration-300 w-full ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/50"
                    : "text-primary hover:bg-primary/20"
                } ${isCollapsed ? "justify-center" : ""}`}
                aria-label={item.label}
                title={item.label}
              >
                <Icon size={24} className={isActive ? "animate-gold-glow" : ""} />
                {!isCollapsed && (
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Expanded State Indicator (optional) */}
        {isCollapsed && (
          <div className="mt-2 text-center">
            <div className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
              {navItems.find((item) => item.id === activeSection)?.label || "Menu"}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navigation;
