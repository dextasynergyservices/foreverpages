"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/app/hooks/useTheme";
import { Button } from "@/app/components/ui/button";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const CTASection: React.FC = () => {
  const { theme } = useTheme();
  const sectionRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const isMobileRef = useRef<boolean>(false);

  useEffect(() => {
    isMobileRef.current = typeof window !== "undefined" && window.innerWidth < 768;

    // On mobile: disable GSAP triggers and show content immediately with gentle pulse
    if (isMobileRef.current) {
      if (bgRef.current) {
        bgRef.current.classList.add("gentle-pulse");
        bgRef.current.style.opacity = "1";
        bgRef.current.style.transform = "none";
      }
      const content = sectionRef.current?.querySelector(".cta-content") as HTMLElement | null;
      if (content) {
        content.style.opacity = "1";
        content.style.transform = "none";
      }
      return;
    }

    const ctx = gsap.context(() => {
      // Initial state (desktop only)
      gsap.set(".cta-content", { opacity: 0, y: 60 });
      gsap.set(".cta-bg", { scale: 1.1, opacity: 0 });

      // Animate in when section enters viewport (desktop)
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 80%",
        end: "bottom 20%",
        onEnter: () => {
          gsap.to(".cta-bg", { scale: 1, opacity: 1, duration: 1.5, ease: "power2.out" });
          gsap.to(".cta-content", {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power2.out",
            delay: 0.3,
          });
        },
        once: true,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Update background style reactively, referencing theme CSS variables directly
  useEffect(() => {
    if (bgRef.current) {
      const overlayAlpha = theme === "dark" ? 0.12 : 0.06;
      bgRef.current.style.background = `radial-gradient(1200px 600px at 50% 50%, hsl(var(--foreground) / ${overlayAlpha}), transparent 60%), hsl(var(--background))`;
    }
  }, [theme]);

  return (
    <section
      ref={sectionRef}
      className="scroll-section min-h-screen w-full relative flex items-center justify-center overflow-hidden section-bg"
    >
      {/* Animated Background */}
      <div
        ref={bgRef}
        className="cta-bg absolute inset-0 w-full h-full transition-all duration-300"
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center cta-content px-6 py-20">
        <h3 className="text-3xl sm:text-5xl font-serif font-bold text-foreground mb-6 sm:mb-8">
          Start Creating a Memorial Today
        </h3>
        <p className="text-lg sm:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
          Join thousands of families who have found comfort in preserving and sharing the memories
          of their loved ones.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
          <Button
            variant="memorial"
            size="lg"
            className="w-full sm:w-auto text-sm px-4 py-2 sm:text-base sm:px-6 sm:py-3 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            onClick={() => (window.location.href = "/create-memorial")}
          >
            Get Started Free
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto text-sm px-4 py-2 sm:text-base sm:px-6 sm:py-3 transition-all duration-300 hover:scale-105 hover:shadow-md border-2"
            onClick={() => (window.location.href = "/memorial/sample")}
          >
            View Sample Memorial
          </Button>
        </div>

        {/* Additional reassurance text */}
        <p className="text-sm text-muted-foreground mt-8 max-w-md mx-auto">
          No credit card required • Easy setup • Free forever plan available
        </p>
      </div>
    </section>
  );
};
