"use client";

import { useRef, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const HeroSection = () => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const router = useRouter();

  // Choose the background video based on theme
  const videoUrl =
    theme === "dark"
      ? "https://res.cloudinary.com/dt7ozsctz/video/upload/v1765469790/hero_quqvcg.mp4"
      : "https://res.cloudinary.com/dt7ozsctz/video/upload/v1765469790/hero_quqvcg.mp4";

  useEffect(() => {
    // Try to play video (handles autoplay restrictions)
    const videoElement = videoRef.current;
    if (videoElement) {
      const playVideo = async () => {
        try {
          videoElement.muted = true; // Muted videos are more likely to autoplay
          await videoElement.play();
        } catch (error) {
          console.log("Video autoplay prevented, user interaction required:", error);
        }
      };
      playVideo();
    }

    const context = gsap.context(() => {
      gsap.registerPlugin(ScrollTrigger);

      const titleEl = titleRef.current;
      const subtitleEl = subtitleRef.current;
      const heroEl = heroRef.current;
      const contentEl = contentRef.current;

      if (titleEl && subtitleEl && heroEl && contentEl) {
        const heroTitle = t("hero.title");
        const heroSubtitle = t("hero.subtitle");

        const setupWordAnimation = (el: HTMLElement, text: string) => {
          el.textContent = "";
          const words = text.split(" ").map((word) => {
            const span = document.createElement("span");
            span.textContent = word;
            span.style.display = "inline-block";
            span.style.marginRight = "0.25em"; // Add space between words
            el.appendChild(span);
            return span;
          });
          return words;
        };

        const titleWords = setupWordAnimation(titleEl, heroTitle);
        const subtitleWords = setupWordAnimation(subtitleEl, heroSubtitle);

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: heroEl,
            start: "top 75%",
            toggleActions: "play none none reverse",
            invalidateOnRefresh: true,
          },
        });

        if (titleWords.length > 0) {
          tl.from(titleWords, {
            duration: 1.2,
            opacity: 0,
            x: (i) => (i % 2 === 0 ? -50 : 50),
            stagger: 0.2,
            ease: "power2.out",
          });
        }

        if (subtitleWords.length > 0) {
          tl.from(
            subtitleWords,
            {
              duration: 0.8,
              opacity: 0,
              x: (i) => (i % 2 === 0 ? -30 : 30),
              stagger: 0.1,
              ease: "power2.out",
            },
            tl.duration() > 0 ? "-=0.6" : "+=0"
          );
        }

        // Scroll out animation
        gsap.to(contentEl, {
          scrollTrigger: {
            trigger: heroEl,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
          opacity: 0,
          y: "-30%",
          ease: "power1.out",
        });
      }
    }, heroRef); // Scope to the hero section

    return () => context.revert(); // Cleanup
  }, [t, theme]);

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
      className="scroll-section relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Video - DIFFERENT VIDEOS FOR DARK/LIGHT MODE */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />

      {/* Main Content */}
      <div ref={contentRef} className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Heading - Simplified */}
        <h1
          ref={titleRef}
          className={`text-4xl md:text-7xl font-serif font-bold mb-6 leading-tight ${
            theme === "dark" ? "text-white" : "text-white"
          }`}
        >
          {t("hero.title")}
        </h1>

        {/* Subtitle - Simplified */}
        <div className="mb-12">
          <p
            ref={subtitleRef}
            className={`text-xl md:text-2xl leading-relaxed ${
              theme === "dark" ? "text-white" : "text-white"
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
            className={`group px-8 py-4 text-lg ${theme === "dark" ? "bg-white text-black hover:bg-gray-100" : "bg-black text-white hover:bg-gray-800"}`}
            onClick={handleCreateMemorial}
          >
            {t("hero.buttons.create")}
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            variant={theme === "dark" ? "memorial-outline" : "outline"}
            size="lg"
            className="backdrop-blur-sm text-lg px-8 py-4 border-white/30 hover:border-white/50"
            onClick={handleViewSample}
          >
            {t("hero.buttons.view")}
          </Button>
        </div>
      </div>
    </section>
  );
};
