"use client";

import { useEffect, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import ClientOnly from "@/components/ClientOnly";

export const HowItWorksSection: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Simplified star generation with fewer stars for better performance
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
    // Generate minimal stars for better performance
    const stars = Array.from({ length: 30 }).map(() => ({
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

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsVideoModalOpen(false);
    };

    if (isVideoModalOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isVideoModalOpen]);

  const steps = [
    {
      number: t("howItWorks.steps.create.number"),
      title: t("howItWorks.steps.create.title"),
      description: t("howItWorks.steps.create.description"),
      icon: t("howItWorks.steps.create.icon"),
    },
    {
      number: t("howItWorks.steps.addContent.number"),
      title: t("howItWorks.steps.addContent.title"),
      description: t("howItWorks.steps.addContent.description"),
      icon: t("howItWorks.steps.addContent.icon"),
    },
    {
      number: t("howItWorks.steps.share.number"),
      title: t("howItWorks.steps.share.title"),
      description: t("howItWorks.steps.share.description"),
      icon: t("howItWorks.steps.share.icon"),
    },
    {
      number: t("howItWorks.steps.preserve.number"),
      title: t("howItWorks.steps.preserve.title"),
      description: t("howItWorks.steps.preserve.description"),
      icon: t("howItWorks.steps.preserve.icon"),
    },
  ];

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

        .step-item:nth-child(1) {
          animation-delay: 0.1s;
        }
        .step-item:nth-child(2) {
          animation-delay: 0.3s;
        }
        .step-item:nth-child(3) {
          animation-delay: 0.5s;
        }
        .step-item:nth-child(4) {
          animation-delay: 0.7s;
        }
      `}</style>

      <section
        id="how-it-works"
        ref={sectionRef}
        className={cn(
          "scroll-section relative min-h-screen w-full py-16 px-4 sm:px-6 lg:px-8",
          "section-bg section-bg--stars"
        )}
      >
        {/* Optimized Stars Background */}
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

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          {/* Title */}
          <div className="text-center mb-12 sm:mb-16 pt-8">
            <h3
              className={cn(
                "text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground mb-3 sm:mb-4",
                isVisible && "animate-fade-in-up"
              )}
              style={{ opacity: isVisible ? 1 : 0 }}
            >
              {t("howItWorks.title")}
            </h3>
            <p
              className={cn(
                "text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4",
                isVisible && "animate-fade-in-up"
              )}
              style={{
                opacity: isVisible ? 1 : 0,
                animationDelay: "0.2s",
                animationFillMode: "both",
              }}
            >
              {t("howItWorks.subtitle")}
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
            {steps.map((step, index) => (
              <div
                key={index}
                className={cn(
                  "step-item text-center border-2 rounded-lg p-4 backdrop-blur-sm",
                  theme === "dark"
                    ? "border-white/20 bg-black/40 text-white"
                    : "border-black/20 bg-white/80 text-black",
                  isVisible && "animate-scale-in"
                )}
                style={{
                  opacity: isVisible ? 1 : 0,
                  animationFillMode: "both",
                }}
              >
                {/* Step icon bubble */}
                <div
                  className={cn(
                    "step-number rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl transition-colors duration-300 border-2",
                    theme === "dark"
                      ? "bg-white text-black border-white/30"
                      : "bg-black text-white border-black/30",
                    isVisible && "animate-bounce-in"
                  )}
                  style={{
                    opacity: isVisible ? 1 : 0,
                    animationFillMode: "both",
                  }}
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
                "px-8 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105",
                theme === "dark"
                  ? "bg-white text-black hover:bg-white/90 shadow-lg hover:shadow-xl"
                  : "bg-black text-white hover:bg-black/90 shadow-lg hover:shadow-xl",
                isVisible && "animate-bounce-in"
              )}
              style={{
                opacity: isVisible ? 1 : 0,
                animationDelay: "0.9s",
                animationFillMode: "both",
              }}
              size="lg"
              onClick={() => setIsVideoModalOpen(true)}
            >
              <Play
                className={cn("w-5 h-5 mr-2", theme === "dark" ? "text-black" : "text-white")}
              />
              {t("howItWorks.buttons.watchDemo")}
            </Button>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up"
          onClick={() => setIsVideoModalOpen(false)}
        >
          <div
            className={cn(
              "relative w-full max-w-4xl rounded-lg overflow-hidden shadow-2xl animate-scale-in",
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
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={cn(
                    "w-full h-full flex items-center justify-center",
                    theme === "dark" ? "bg-black" : "bg-gray-100"
                  )}
                >
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
                      {t("howItWorks.modal.title")}
                    </p>
                    <p
                      className={cn(
                        "text-sm",
                        theme === "dark" ? "text-white/70" : "text-black/70"
                      )}
                    >
                      {t("howItWorks.modal.placeholder")}
                    </p>
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
                {t("howItWorks.modal.title")}
              </h3>
              <p className={cn("text-sm", theme === "dark" ? "text-white/70" : "text-black/70")}>
                {t("howItWorks.modal.description")}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
