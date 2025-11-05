"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Star, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import ClientOnly from "@/components/ClientOnly";

interface FuneralPageItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdBy: string;
  tributes: number;
  visits: number;
}

const sampleFuneralPages: FuneralPageItem[] = [
  {
    id: "1",
    title: "In Loving Memory of Sarah Johnson",
    description:
      "A beautiful tribute filled with family photos, stories from her teaching career, and memories from 45 years of marriage. Sarah touched countless lives through her dedication to education and community service.",
    imageUrl: "/images/memorial-sarah.jpg",
    createdBy: "The Johnson Family",
    tributes: 147,
    visits: 2345,
  },
  {
    id: "2",
    title: "Celebrating the Life of Michael Brown",
    description:
      "A memorial honoring a life well-lived as a devoted father, successful entrepreneur, and passionate volunteer. Michaels legacy continues through the charitable foundation he established.",
    imageUrl: "/images/memorial-michael.jpg",
    createdBy: "The Brown Family",
    tributes: 89,
    visits: 1567,
  },
  {
    id: "3",
    title: "Remembering Grandma Rose Martinez",
    description:
      "A heartfelt collection of memories spanning 82 years, from her childhood stories to her famous family recipes that brought generations together around the dinner table.",
    imageUrl: "/images/memorial-rose.jpg",
    createdBy: "The Martinez Family",
    tributes: 203,
    visits: 3123,
  },
];

export const FuneralPageSection: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Star background for mobile/fallback
  const [starStyles, setStarStyles] = useState<
    Array<{
      top: string;
      left: string;
      size: string;
      delay: string;
      duration: string;
    }>
  >([]);

  useEffect(() => {
    // Generate stars for background
    const stars = Array.from({ length: 20 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 1}px`,
      delay: `${Math.random() * 2}s`,
      duration: `${Math.random() * 3 + 2}s`,
    }));
    setStarStyles(stars);
  }, []);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes starTwinkle {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-scale-in {
          animation: scaleIn 0.6s ease-out forwards;
        }

        .animate-bounce-in {
          animation: bounceIn 0.8s ease-out forwards;
        }

        .animate-star {
          animation: starTwinkle var(--duration) ease-in-out infinite var(--delay);
        }

        .memorial-card:nth-child(1) {
          animation-delay: 0.1s;
        }
        .memorial-card:nth-child(2) {
          animation-delay: 0.3s;
        }
        .memorial-card:nth-child(3) {
          animation-delay: 0.5s;
        }
      `}</style>

      <section
        id="memorial-pages"
        ref={sectionRef}
        className={cn(
          "scroll-section relative min-h-screen w-full py-16 overflow-hidden",
          "section-bg section-bg--stars"
        )}
      >
        {/* Fallback Stars Background */}
        <ClientOnly>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {starStyles.map((star, i) => (
              <div
                key={`star-${i}`}
                className={cn(
                  "absolute rounded-full animate-star",
                  theme === "dark"
                    ? "bg-white shadow-[0_0_6px_1px_rgba(255,255,255,0.6)]"
                    : "bg-black shadow-[0_0_6px_1px_rgba(0,0,0,0.5)]"
                )}
                style={
                  {
                    top: star.top,
                    left: star.left,
                    width: star.size,
                    height: star.size,
                    "--delay": star.delay,
                    "--duration": star.duration,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        </ClientOnly>

        {/* Background based on theme */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full transition-colors duration-300",
            theme === "dark" ? "bg-black/80" : "bg-white/80"
          )}
        />

        {/* Content */}
        <div className="relative z-10 py-8">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            {/* Title Section */}
            <div className="text-center mb-12">
              <h3
                className={cn(
                  "text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-3 sm:mb-4",
                  theme === "dark" ? "text-white" : "text-black",
                  isVisible && "animate-fade-in-up"
                )}
                style={{ opacity: isVisible ? 1 : 0 }}
              >
                {t("funeralPages.title")}
              </h3>
              <p
                className={cn(
                  "text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-2 sm:px-4",
                  theme === "dark" ? "text-gray-300" : "text-gray-700",
                  isVisible && "animate-fade-in-up"
                )}
                style={{
                  opacity: isVisible ? 1 : 0,
                  animationDelay: "0.2s",
                  animationFillMode: "both",
                }}
              >
                {t("funeralPages.subtitle")}
              </p>
            </div>

            {/* Memorial Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12">
              {sampleFuneralPages.map((page) => (
                <div
                  key={page.id}
                  className={cn(
                    "memorial-card rounded-xl overflow-hidden border-2 p-1 backdrop-blur-sm",
                    theme === "dark"
                      ? "bg-[#0c0c0c]/80 text-white border-white/20"
                      : "bg-white/80 text-black border-black/20",
                    isVisible && "animate-scale-in"
                  )}
                  style={{
                    opacity: isVisible ? 1 : 0,
                    animationFillMode: "both",
                  }}
                >
                  <div className="card-content">
                    {/* Image/Placeholder */}
                    <div
                      className={cn(
                        "w-full h-48 sm:h-56 flex items-center justify-center relative",
                        theme === "dark" ? "bg-[#111]" : "bg-gray-50"
                      )}
                    >
                      <span className={theme === "dark" ? "text-white/70" : "text-black/70"}>
                        {t("funeralPages.memorialImage")}
                      </span>
                      <div
                        className={cn(
                          "absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium",
                          theme === "dark" ? "bg-white text-black" : "bg-black text-white"
                        )}
                      >
                        <Star className="h-3 w-3 inline mr-1" />
                        {t("funeralPages.featured")}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6">
                      <h4
                        className={cn(
                          "text-lg sm:text-xl font-serif font-semibold mb-2 sm:mb-3",
                          theme === "dark" ? "text-white" : "text-black"
                        )}
                      >
                        {page.title}
                      </h4>
                      <p
                        className={cn(
                          "text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed",
                          theme === "dark" ? "text-white/80" : "text-black/70"
                        )}
                      >
                        {page.description}
                      </p>
                      <div
                        className={cn(
                          "flex justify-between items-center text-xs mb-3",
                          theme === "dark" ? "text-white/70" : "text-black/70"
                        )}
                      >
                        <div className="flex items-center">
                          <Users
                            className={cn(
                              "h-3 w-3 mr-1",
                              theme === "dark" ? "text-white" : "text-black"
                            )}
                          />
                          {page.tributes} {t("funeralPages.tributes")}
                        </div>
                        <div className="flex items-center">
                          <Clock
                            className={cn(
                              "h-3 w-3 mr-1",
                              theme === "dark" ? "text-white" : "text-black"
                            )}
                          />
                          {page.visits} {t("funeralPages.visits")}
                        </div>
                      </div>
                      <p
                        className={cn(
                          "text-xs border-t pt-3",
                          theme === "dark"
                            ? "text-white/70 border-white/20"
                            : "text-black/70 border-black/10"
                        )}
                      >
                        {t("funeralPages.by")} {page.createdBy}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View More Button */}
            <div className="text-center mb-12">
              <Link
                href="/memorial-pages"
                className={cn(
                  "inline-flex items-center px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105",
                  theme === "dark"
                    ? "bg-white text-black hover:bg-white/90"
                    : "bg-black text-white hover:bg-black/90",
                  isVisible && "animate-bounce-in"
                )}
                style={{
                  opacity: isVisible ? 1 : 0,
                  animationDelay: "0.7s",
                  animationFillMode: "both",
                }}
              >
                {t("funeralPages.viewMore")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
