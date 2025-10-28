"use client";

import { useRef, useEffect, useCallback } from "react";
import { OptimizedImage } from "@/components/OptimizedImage";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { gsap } from "gsap";

interface HeroSectionOptimizedProps {
  isLoading: boolean;
  onLoadingComplete: () => void;
}

export function HeroSectionOptimized({ isLoading, onLoadingComplete }: HeroSectionOptimizedProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const startMainAnimation = useCallback(() => {
    if (!heroRef.current || !contentRef.current) return;

    const tl = gsap.timeline();

    // Animate content
    tl.fromTo(
      contentRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
    );

    // Call loading complete
    tl.call(() => {
      onLoadingComplete();
    });
  }, [onLoadingComplete]);

  useEffect(() => {
    if (!isLoading) {
      startMainAnimation();
    }
  }, [isLoading, startMainAnimation]);

  useEffect(() => {
    // Store the current ref value in a variable
    const currentBackgroundRef = backgroundRef.current;

    // Continuous background movement
    if (currentBackgroundRef) {
      gsap.to(currentBackgroundRef, {
        backgroundPosition: "100% 100%",
        duration: 25,
        ease: "none",
        repeat: -1,
        yoyo: true,
      });
    }

    return () => {
      if (currentBackgroundRef) {
        gsap.killTweensOf(currentBackgroundRef);
      }
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center"
    >
      {/* Optimized background with theme support */}
      <div className="absolute inset-0 w-full h-full">
        <OptimizedImage
          lightSrc="/assets/lightmode.png"
          darkSrc="/assets/darkmode.png"
          alt="Memorial background"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Animated background overlay */}
      <div
        ref={backgroundRef}
        className="absolute inset-0 w-full h-full opacity-0"
        style={{
          backgroundImage: "url('/assets/lightmode.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Content */}
      <div ref={contentRef} className="relative z-10 max-w-6xl mx-auto text-center px-6 py-20">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 sm:mb-8 leading-tight">
          Honor Their Memory
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl text-white/90 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
          Create beautiful memorial websites where families and friends celebrate lives and share
          memories together
        </p>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
          <Button
            size="lg"
            className="w-full sm:w-auto text-lg px-8 py-4 bg-white text-black hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            Create a Memorial Page
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto text-lg px-8 py-4 border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-300 hover:scale-105"
          >
            View Sample Memorial
          </Button>
        </div>
      </div>
    </section>
  );
}
