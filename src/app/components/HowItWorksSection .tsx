"use client";

import { useEffect, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/hooks/useTheme";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const HowItWorksSection: React.FC = () => {
  const { theme } = useTheme();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isMobileRef = useRef<boolean>(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsVideoModalOpen(false);
    };

    if (isVideoModalOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isVideoModalOpen]);

  useEffect(() => {
    isMobileRef.current = window.innerWidth < 768;
    if (isMobileRef.current) {
      const content = sectionRef.current;
      if (content) content.classList.add("animate-in");
      return;
    }

    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(
        ".how-it-works-title",
        { opacity: 0, y: 80, scale: 1.1 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".how-it-works-title",
            start: "top 80%",
            end: "top 20%",
            toggleActions: "play none none none",
            once: true,
          },
        }
      );

      // Step items animation
      gsap.fromTo(
        ".step-item",
        { opacity: 0, y: 60, scale: 0.5 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: { each: 0.3, from: "start" },
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: ".steps-grid",
            start: "top 70%",
            end: "top 20%",
            toggleActions: "play none none none",
            once: true,
          },
        }
      );

      // Step numbers (no color change)
      gsap.fromTo(
        ".step-number",
        { scale: 0, rotation: -180 },
        {
          scale: 1,
          rotation: 0,
          duration: 0.8,
          stagger: 0.3,
          ease: "elastic.out(1, 0.8)",
          scrollTrigger: {
            trigger: ".steps-grid",
            start: "top 70%",
            end: "top 20%",
            toggleActions: "play none none none",
            once: true,
          },
        }
      );

      // Demo button
      gsap.fromTo(
        ".demo-button",
        { opacity: 0, scale: 0, rotation: 90 },
        {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 1,
          ease: "elastic.out(1, 0.5)",
          scrollTrigger: {
            trigger: ".demo-button",
            start: "top 80%",
            end: "top 20%",
            toggleActions: "play none none none",
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const steps = [
    {
      number: "01",
      title: "Create Your Memorial",
      description:
        "Start by choosing a beautiful template and adding basic information about your loved one. Our intuitive interface makes it easy to get started in just minutes.",
      icon: "✍️",
    },
    {
      number: "02",
      title: "Add Photos & Stories",
      description:
        "Upload cherished photos, write meaningful stories, and organize memories in a way that truly honors their life and legacy.",
      icon: "📸",
    },
    {
      number: "03",
      title: "Share with Family",
      description:
        "Invite family and friends to contribute their own memories, photos, and tributes to create a comprehensive memorial together.",
      icon: "👥",
    },
    {
      number: "04",
      title: "Preserve Forever",
      description:
        "Your memorial is safely stored and will remain accessible for future generations to visit, remember, and cherish forever.",
      icon: "💝",
    },
  ];

  return (
    <>
      <section
        ref={sectionRef}
        className={cn(
          "scroll-section relative min-h-screen w-full py-16 px-4 sm:px-6 lg:px-8",
          "section-bg section-bg--stars"
        )}
      >
        {/* Enhanced Stars Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large stars */}
          <div className="absolute inset-0">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={`star-large-${i}`}
                className={cn(
                  "absolute rounded-full animate-pulse",
                  theme === "dark"
                    ? "bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.8)]"
                    : "bg-black shadow-[0_0_8px_2px_rgba(0,0,0,0.6)]"
                )}
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  width: `${Math.random() * 3 + 2}px`,
                  height: `${Math.random() * 3 + 2}px`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${Math.random() * 2 + 1}s`,
                }}
              />
            ))}
          </div>

          {/* Medium stars */}
          <div className="absolute inset-0">
            {Array.from({ length: 80 }).map((_, i) => (
              <div
                key={`star-medium-${i}`}
                className={cn(
                  "absolute rounded-full",
                  theme === "dark"
                    ? "bg-white shadow-[0_0_6px_1px_rgba(255,255,255,0.6)]"
                    : "bg-black shadow-[0_0_6px_1px_rgba(0,0,0,0.5)]"
                )}
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  width: `${Math.random() * 2 + 1}px`,
                  height: `${Math.random() * 2 + 1}px`,
                }}
              />
            ))}
          </div>

          {/* Small stars */}
          <div className="absolute inset-0">
            {Array.from({ length: 120 }).map((_, i) => (
              <div
                key={`star-small-${i}`}
                className={cn(
                  "absolute rounded-full",
                  theme === "dark" ? "bg-white shadow-[0_0_4px_0.5px_rgba(255,255,255,0.4)]" : ""
                )}
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  width: `${Math.random() * 1 + 0.5}px`,
                  height: `${Math.random() * 1 + 0.5}px`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          {/* Title */}
          <div className="text-center mb-12 sm:mb-16">
            <h3 className="how-it-works-title text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground mb-3 sm:mb-4">
              How It Works
            </h3>
            <p className="how-it-works-description text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4">
              Creating a beautiful memorial is simple and takes just a few minutes
            </p>
          </div>

          {/* Steps */}
          <div className="steps-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
            {steps.map((step, index) => (
              <div
                key={index}
                className={cn(
                  "step-item text-center border-2 rounded-lg p-4 backdrop-blur-sm",
                  theme === "dark"
                    ? "border-white/20 bg-black/40 text-white"
                    : "border-black/20 bg-white/80 text-black"
                )}
              >
                {/* Step icon bubble */}
                <div
                  className={cn(
                    "step-number rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl transition-colors duration-300 border-2",
                    theme === "dark"
                      ? "bg-white text-black border-white/30"
                      : "bg-black text-white border-black/30"
                  )}
                >
                  {step.icon}
                </div>

                {/* Step number */}
                <div
                  className={cn(
                    "font-bold text-sm mb-2 font-mono",
                    theme === "dark" ? "text-white/90" : "text-black/90"
                  )}
                >
                  {step.number}
                </div>

                {/* Step title & description */}
                <h4
                  className={cn(
                    "text-lg font-serif font-semibold mb-3",
                    theme === "dark" ? "text-white" : "text-black"
                  )}
                >
                  {step.title}
                </h4>
                <p
                  className={cn(
                    "text-sm leading-relaxed",
                    theme === "dark" ? "text-white/80" : "text-black/80"
                  )}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* Button */}
          <div className="text-center">
            <Button
              className={cn(
                "demo-button px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105",
                theme === "dark"
                  ? "bg-white text-black hover:bg-white/90 shadow-lg hover:shadow-xl"
                  : "bg-black text-white hover:bg-black/90 shadow-lg hover:shadow-xl"
              )}
              size="lg"
              onClick={() => setIsVideoModalOpen(true)}
            >
              <Play
                className={cn("w-5 h-5 mr-2", theme === "dark" ? "text-black" : "text-white")}
              />
              Watch Demo Video
            </Button>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsVideoModalOpen(false)}
        >
          <div
            className={cn(
              "relative w-full max-w-4xl rounded-lg overflow-hidden shadow-2xl",
              theme === "dark" ? "bg-black" : "bg-white"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className={cn(
                "absolute top-4 right-4 z-10 p-2 rounded-full transition-colors duration-200 hover:scale-110",
                theme === "dark"
                  ? "bg-white/20 text-white hover:bg-white/30"
                  : "bg-black/20 text-black hover:bg-black/30"
              )}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Video Container */}
            <div className="relative pt-[56.25%]">
              {" "}
              {/* 16:9 Aspect Ratio */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={cn(
                    "w-full h-full flex items-center justify-center",
                    theme === "dark" ? "bg-black" : "bg-"
                  )}
                >
                  {/* Replace this with your actual video embed */}
                  <div className="text-center p-8">
                    <Play
                      className={cn(
                        "w-16 h-16 mx-auto mb-4 opacity-50",
                        theme === "dark" ? "text-white" : "text-black"
                      )}
                    />
                    <p
                      className={cn(
                        "text-lg font-semibold mb-2",
                        theme === "dark" ? "text-white" : "text-black"
                      )}
                    >
                      Demo Video
                    </p>
                    <p
                      className={cn(
                        "text-sm",
                        theme === "dark" ? "text-white/70" : "text-black/70"
                      )}
                    >
                      Replace this with your video player component
                    </p>
                    {/* Example: <YouTube videoId="your-video-id" /> */}
                    {/* Example: <Vimeo videoId="your-video-id" /> */}
                    {/* Example: <video src="/demo-video.mp4" controls className="w-full h-full" /> */}
                  </div>
                </div>
              </div>
            </div>

            {/* Video Info */}
            <div
              className={cn(
                "p-6 border-t",
                theme === "dark"
                  ? "bg-black border-white/10 text-white"
                  : "bg-white border-black/10 text-black"
              )}
            >
              <h3
                className={cn(
                  "text-xl font-serif font-bold mb-2",
                  theme === "dark" ? "text-white" : "text-black"
                )}
              >
                How It Works - Demo
              </h3>
              <p className={cn("text-sm", theme === "dark" ? "text-white/70" : "text-black/70")}>
                Watch this quick demo to see how easy it is to create a beautiful memorial page
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
