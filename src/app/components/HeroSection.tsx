// components/HeroSection.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@/app/hooks/useTheme";
import { Button } from "@/app/components/ui/button";
import { ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import { useRouter } from "next/navigation";

export const HeroSection: React.FC = () => {
  const { theme } = useTheme();
  const heroRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  // Choose the background image based on theme
  const backgroundImage = theme === "dark" ? "/assets/darkmode.png" : "/assets/lightmode.png";

  useEffect(() => {
    const percentageTl = gsap.timeline({
      onUpdate: () => {
        const progress = percentageTl.progress() * 100;
        setLoadingProgress(progress);
      },
      onComplete: () => {
        startMainAnimation();
      },
    });

    percentageTl.to(
      {},
      {
        duration: 1.5,
        onUpdate: function () {
          setLoadingProgress(Math.min(100, this.progress() * 120));
        },
        ease: "power2.out",
      }
    );

    // Continuous background movement
    if (backgroundRef.current) {
      gsap.to(backgroundRef.current, {
        backgroundPosition: "100% 100%",
        duration: 25,
        ease: "none",
        repeat: -1,
        yoyo: true,
      });
    }

    function startMainAnimation() {
      setIsLoaded(true);

      const mainTl = gsap.timeline();

      // 1. Background fade in (smooth)
      mainTl.fromTo(
        backgroundRef.current,
        {
          opacity: 0,
        },
        {
          opacity: 1,
          duration: 1.2,
          ease: "power2.out",
        }
      );

      // 2. "Honor" word animation (smoother)
      const honorText = contentRef.current?.querySelector(".honor-text");
      if (honorText) {
        const text = honorText.textContent || "";
        honorText.innerHTML = text
          .split("")
          .map(
            (char) => `<span class="char" style="display: inline-block; opacity: 0;">${char}</span>`
          )
          .join("");

        mainTl.fromTo(
          honorText.querySelectorAll(".char"),
          {
            opacity: 0,
            y: 20,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.04,
            ease: "power2.out",
          },
          "+=0.2"
        );
      }

      // 3. "Their" word animation (smoother)
      const theirText = contentRef.current?.querySelector(".their-text");
      if (theirText) {
        const text = theirText.textContent || "";
        theirText.innerHTML = text
          .split("")
          .map(
            (char) => `<span class="char" style="display: inline-block; opacity: 0;">${char}</span>`
          )
          .join("");

        mainTl.fromTo(
          theirText.querySelectorAll(".char"),
          {
            opacity: 0,
            y: 15,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.03,
            ease: "power2.out",
          },
          "-=0.3"
        );
      }

      // 4. "Memory" word animation (smoother)
      const memoryText = contentRef.current?.querySelector(".memory-text");
      if (memoryText) {
        mainTl.fromTo(
          memoryText,
          {
            opacity: 0,
            y: 20,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
          },
          "-=0.2"
        );
      }

      // 5. Subtitle line 1 animation
      const subtitle1 = contentRef.current?.querySelector(".subtitle-line-1");
      if (subtitle1) {
        mainTl.fromTo(
          subtitle1,
          {
            opacity: 0,
            y: 15,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
          },
          "+=0.2"
        );
      }

      // 6. Subtitle line 2 animation
      const subtitle2 = contentRef.current?.querySelector(".subtitle-line-2");
      if (subtitle2) {
        mainTl.fromTo(
          subtitle2,
          {
            opacity: 0,
            y: 15,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
          },
          "-=0.2"
        );
      }

      // 7. First button animation (smoother)
      const button1 = contentRef.current?.querySelector(".hero-button-1");
      if (button1) {
        mainTl.fromTo(
          button1,
          {
            opacity: 0,
            y: 20,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power2.out",
          },
          "+=0.2"
        );
      }

      // 8. Second button animation (smoother)
      const button2 = contentRef.current?.querySelector(".hero-button-2");
      if (button2) {
        mainTl.fromTo(
          button2,
          {
            opacity: 0,
            y: 15,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
          },
          "-=0.3"
        );
      }
    }
  }, []);

  const handleCreateMemorial = () => {
    router.push("/create-memorial");
  };

  const handleViewSample = () => {
    router.push("/memorial/sample");
  };

  return (
    <section
      ref={heroRef}
      className="scroll-section relative min-h-screen flex items-center justify-center overflow-hidden section-bg"
    >
      {/* Fast Percentage Loading Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="text-5xl font-light text-foreground mb-3 font-mono tracking-tighter">
              {Math.round(loadingProgress)}%
            </div>
            <div className="w-32 h-0.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-foreground transition-all duration-100 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Animated Background - DIFFERENT IMAGES FOR DARK/LIGHT MODE */}
      <div
        ref={backgroundRef}
        className="absolute inset-0 opacity-90"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.1)), url(${backgroundImage})`,
          backgroundSize: "400% 400%, 120% 120%",
          backgroundPosition: "0% 50%, 25% 50%",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Overlay gradient - DIFFERENT FOR DARK/LIGHT MODE */}
      <div
        className={`absolute inset-0 ${
          theme === "dark"
            ? "bg-gradient-to-br from-black/40 via-transparent to-primary/20"
            : "bg-gradient-to-br from-white/20 via-transparent to-gray-300/30"
        }`}
      />

      {/* Main Content */}
      <div ref={contentRef} className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <div className={isLoaded ? "block" : "opacity-0"}>
          {/* Heading - TEXT COLORS FOR BETTER CONTRAST */}
          <h1 className="text-2xl md:text-7xl font-serif font-bold mb-6 leading-tight">
            <span
              className={`honor-text mr-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              Honor
            </span>
            <span
              className={`their-text mr-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
            >
              Their
            </span>
            <span className={`memory-text ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Memory
            </span>
          </h1>

          {/* Subtitle - TEXT COLORS FOR BETTER CONTRAST */}
          <div className="mb-12">
            <p
              className={`subtitle-line-1 text-xl md:text-2xl mb-4 leading-relaxed ${
                theme === "dark" ? "text-gray-200" : "text-gray-700"
              }`}
            >
              Create beautiful memorial websites where families
            </p>
            <p
              className={`subtitle-line-2 text-xl md:text-2xl leading-relaxed ${
                theme === "dark" ? "text-gray-200" : "text-gray-700"
              }`}
            >
              and friends celebrate lives and share memories together
            </p>
          </div>

          {/* Buttons - ADJUSTED FOR EACH THEME */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Button
              variant={theme === "dark" ? "memorial" : "default"}
              size="lg"
              className="hero-button-1 group text-base px-5 py-3 sm:text-lg sm:px-8 sm:py-4"
              onClick={handleCreateMemorial}
            >
              Create a Memorial Page
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant={theme === "dark" ? "memorial-outline" : "outline"}
              size="lg"
              className="hero-button-2 backdrop-blur-sm text-base px-5 py-3 sm:text-lg sm:px-8 sm:py-4"
              onClick={handleViewSample}
            >
              View Sample Memorial
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
