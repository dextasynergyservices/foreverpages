"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/hooks/useTheme";

export const TestimonialsSection: React.FC = () => {
  const { theme } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Daughter",
      content:
        "Creating a memorial for my father was one of the most healing experiences. The platform made it so easy to gather photos and stories from our entire family. It's become a place we all visit regularly.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Son",
      content:
        "The privacy controls gave us peace of mind, and the beautiful templates helped us create something truly special. Friends and family from around the world could contribute their memories.",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "Granddaughter",
      content:
        "I was able to preserve my grandmother's stories and recipes in a way that will last forever. The support team was incredibly helpful throughout the process.",
      rating: 5,
    },
    {
      name: "Emanuel Okeke",
      role: "Grandson",
      content:
        "I was able to preserve my grandmother's stories and recipes in a way that will last forever. The support team was incredibly helpful throughout the process.",
      rating: 4,
    },
    {
      name: "Boma George",
      role: "Granddaughter",
      content:
        "I was able to preserve my grandmother's stories and recipes in a way that will last forever. The support team was incredibly helpful throughout the process.",
      rating: 4,
    },
    {
      name: "Tosin Ola",
      role: "Grandson",
      content:
        "I was able to preserve my grandmother's stories and recipes in a way that will last forever. The support team was incredibly helpful throughout the process.",
      rating: 4,
    },
    {
      name: "Aish Usman",
      role: "Granddaughter",
      content:
        "I was able to preserve my grandmother's stories and recipes in a way that will last forever. The support team was incredibly helpful throughout the process.",
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
            What Families Are Saying
          </h3>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4">
            Real stories from families who have found comfort and healing through our platform
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
              <CardTitle className="text-lg font-serif">Join Families</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm max-w-2xl mx-auto">
                Over 50,000 families have trusted us to help preserve their loved ones&apos;
                memories. Start creating your memorial today and join our compassionate community.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
