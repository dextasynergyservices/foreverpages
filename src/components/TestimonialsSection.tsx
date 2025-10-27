"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import ClientOnly from "@/components/ClientOnly";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const TestimonialsSectionContent: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Optimized GSAP animations with ScrollTrigger
    const ctx = gsap.context(() => {
      // Initial state
      gsap.set(".testimonials-title", { opacity: 0, y: 30 });
      gsap.set(".testimonials-description", { opacity: 0, y: 20 });
      gsap.set(".testimonial-card", { opacity: 0, y: 40 });

      // Animate in when section enters viewport
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.to(".testimonials-title", {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
          });
          gsap.to(".testimonials-description", {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            delay: 0.2,
          });
          gsap.to(".testimonial-card", {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            stagger: 0.1,
            delay: 0.4,
          });
        },
        once: true,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Keep all your existing TestimonialsSection logic
  const testimonials = [
    {
      name: t("testimonials.testimonials.sarah.name"),
      role: t("testimonials.testimonials.sarah.role"),
      content: t("testimonials.testimonials.sarah.content"),
      rating: 5,
    },
    {
      name: t("testimonials.testimonials.michael.name"),
      role: t("testimonials.testimonials.michael.role"),
      content: t("testimonials.testimonials.michael.content"),
      rating: 5,
    },
    {
      name: t("testimonials.testimonials.emily.name"),
      role: t("testimonials.testimonials.emily.role"),
      content: t("testimonials.testimonials.emily.content"),
      rating: 5,
    },
    {
      name: t("testimonials.testimonials.emanuel.name"),
      role: t("testimonials.testimonials.emanuel.role"),
      content: t("testimonials.testimonials.emanuel.content"),
      rating: 4,
    },
    {
      name: t("testimonials.testimonials.boma.name"),
      role: t("testimonials.testimonials.boma.role"),
      content: t("testimonials.testimonials.boma.content"),
      rating: 4,
    },
    {
      name: t("testimonials.testimonials.tosin.name"),
      role: t("testimonials.testimonials.tosin.role"),
      content: t("testimonials.testimonials.tosin.content"),
      rating: 4,
    },
    {
      name: t("testimonials.testimonials.aish.name"),
      role: t("testimonials.testimonials.aish.role"),
      content: t("testimonials.testimonials.aish.content"),
      rating: 4,
    },
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Calculate which dots to show (max 5 dots)
  const getVisibleDots = () => {
    const total = testimonials.length;
    const maxDots = 5;

    if (total <= maxDots) {
      return Array.from({ length: total }, (_, i) => i);
    }

    let start = Math.max(0, currentSlide - Math.floor(maxDots / 2));
    let end = start + maxDots;

    if (end > total) {
      end = total;
      start = Math.max(0, end - maxDots);
    }

    return Array.from({ length: end - start }, (_, i) => start + i);
  };

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [nextSlide]);

  // Working patterns with proper encoding
  const patterns = {
    light:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%13000000' fill-opacity='0.05'%3E%3Ccircle cx='40' cy='40' r='1.5'/%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3Ccircle cx='60' cy='60' r='1'/%3E%3Ccircle cx='20' cy='60' r='1'/%3E%3Ccircle cx='60' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E",
    dark: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%23ffffff' fill-opacity='0.5'%3E%3Ccircle cx='40' cy='40' r='1.5'/%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3Ccircle cx='60' cy='60' r='1'/%3E%3Ccircle cx='20' cy='60' r='1'/%3E%3Ccircle cx='60' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E",
  };

  const patternUrl = theme === "dark" ? patterns.dark : patterns.light;

  // Return simple static content during SSR
  if (!isClient) {
    return (
      <section className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-3 sm:mb-4">
              {t("testimonials.title")}
            </h3>
            <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-2 sm:px-4">
              {t("testimonials.subtitle")}
            </p>
          </div>
          <div className="bg-muted rounded-lg p-8 animate-pulse h-64" />
        </div>
      </section>
    );
  }

  return (
    <section
      className="scroll-section relative min-h-screen w-full py-16 px-4 sm:px-6 lg:px-8 overflow-hidden"
      style={{
        backgroundColor: theme === "dark" ? "#000000" : "#ffffff",
        backgroundImage: `url("${patternUrl}")`,
        backgroundRepeat: "repeat",
        backgroundSize: "80px 80px",
      }}
    >
      {/* Keep all your existing JSX */}
      {/* Optional: Add a subtle overlay for better text readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            theme === "dark"
              ? "radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.3) 100%)"
              : "radial-gradient(circle at center, transparent 0%, rgba(255,255,255,0.3) 100%)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto w-full">
        <div className="text-center mb-12 sm:mb-16">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground mb-3 sm:mb-4">
            {t("testimonials.title")}
          </h3>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4">
            {t("testimonials.subtitle")}
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className={cn(
              "absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full transition-all duration-200 hover:scale-110",
              theme === "dark"
                ? "bg-white/20 text-white hover:bg-white/30"
                : "bg-black/20 text-black hover:bg-black/30"
            )}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextSlide}
            className={cn(
              "absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full transition-all duration-200 hover:scale-110",
              theme === "dark"
                ? "bg-white/20 text-white hover:bg-white/30"
                : "bg-black/20 text-black hover:bg-black/30"
            )}
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Carousel Slide */}
          <div className="px-12">
            {" "}
            {/* Padding for navigation buttons */}
            <Card className="hover:shadow-medium transition-all duration-300">
              <CardHeader>
                <div className="flex items-center mb-4">
                  {[...Array(testimonials[currentSlide].rating)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-4 h-4 fill-current",
                        theme === "dark" ? "text-yellow-400" : "text-yellow-500"
                      )}
                    />
                  ))}
                </div>
                <Quote className="w-6 h-6 text-primary mb-4" />
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed mb-6 text-base">
                  &ldquo;{testimonials[currentSlide].content}&rdquo;
                </CardDescription>
                <div className="border-t border-border/30 pt-4">
                  <CardTitle className="text-sm font-semibold">
                    {testimonials[currentSlide].name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {testimonials[currentSlide].role}
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pagination Dots - Limited to 5 max */}
          <div className="flex justify-center mt-8 space-x-2">
            {getVisibleDots().map((dotIndex) => (
              <button
                key={dotIndex}
                onClick={() => goToSlide(dotIndex)}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-200",
                  dotIndex === currentSlide
                    ? theme === "dark"
                      ? "bg-white scale-125"
                      : "bg-black scale-125"
                    : theme === "dark"
                      ? "bg-white/30 hover:bg-white/50"
                      : "bg-black/30 hover:bg-black/50"
                )}
              />
            ))}
          </div>
        </div>

        {/* Stats Card */}
        <div className="mt-12">
          <Card className="text-center hover:shadow-soft transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-lg font-serif">
                {t("testimonials.joinFamilies.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm max-w-2xl mx-auto">
                {t("testimonials.joinFamilies.description")}
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export const TestimonialsSection: React.FC = () => {
  return (
    <ClientOnly>
      <TestimonialsSectionContent />
    </ClientOnly>
  );
};
