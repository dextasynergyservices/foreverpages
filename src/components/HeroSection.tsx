"use client";

import { useRef, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";

export const HeroSection = () => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const heroRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Choose the background image based on theme
  const backgroundImage = theme === "dark" ? "/assets/darkmode.png" : "/assets/lightmode.png";

  useEffect(() => {
    // Optimized animation sequence - no character splitting to prevent hanging
    const tl = gsap.timeline();

    // 1. Background fade in
    tl.fromTo(
      backgroundRef.current,
      { opacity: 0 },
      { opacity: 0.9, duration: 1.2, ease: "power2.out" }
    );

    // 2. Title animation (whole text, not character by character)
    const title = contentRef.current?.querySelector("h1");
    if (title) {
      tl.fromTo(
        title,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        "-=0.6"
      );
    }

    // 3. Subtitle animation
    const subtitle = contentRef.current?.querySelector("p");
    if (subtitle) {
      tl.fromTo(
        subtitle,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "-=0.4"
      );
    }

    // 4. Buttons animation
    const buttons = contentRef.current?.querySelector(".flex");
    if (buttons) {
      tl.fromTo(
        buttons,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
        "-=0.2"
      );
    }

    // 5. Subtle background movement (optimized)
    if (backgroundRef.current) {
      gsap.to(backgroundRef.current, {
        backgroundPosition: "100% 100%",
        duration: 20,
        ease: "none",
        repeat: -1,
        yoyo: true,
      });
    }
  }, []);

  const handleCreateMemorial = () => {
    router.push("/packages");
  };

  const handleViewSample = () => {
    router.push("/memorial-pages");
  };

  return (
    <section
      id="hero"
      ref={heroRef}
      className="scroll-section relative min-h-screen flex items-center justify-center overflow-hidden section-bg"
    >
      {/* Animated Background - DIFFERENT IMAGES FOR DARK/LIGHT MODE */}
      <div
        ref={backgroundRef}
        className="absolute inset-0 opacity-0"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.1)), url(${backgroundImage})`,
          backgroundSize: "120% 120%",
          backgroundPosition: "center",
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
        {/* Heading - Simplified */}
        <h1
          className={`text-2xl md:text-7xl font-serif font-bold mb-6 leading-tight ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
          {t("hero.title")}
        </h1>

        {/* Subtitle - Simplified */}
        <div className="mb-12">
          <p
            className={`text-xl md:text-2xl leading-relaxed ${
              theme === "dark" ? "text-gray-200" : "text-gray-700"
            }`}
          >
            {t("hero.subtitle")}
          </p>
        </div>

        {/* Buttons - Simplified */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
          <Button
            variant={theme === "dark" ? "memorial" : "default"}
            size="lg"
            className={`group px-5 py-3 sm:text-lg sm:px-8 sm:py-4 ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
            onClick={handleCreateMemorial}
          >
            {t("hero.buttons.create")}
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            variant={theme === "dark" ? "memorial-outline" : "outline"}
            size="lg"
            className="backdrop-blur-sm text-base px-5 py-3 sm:text-lg sm:px-8 sm:py-4"
            onClick={handleViewSample}
          >
            {t("hero.buttons.view")}
          </Button>
        </div>
      </div>
    </section>
  );
};
