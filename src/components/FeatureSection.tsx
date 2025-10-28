"use client";

import { useEffect, useRef } from "react";
import { Heart, Shield, Users, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const FeaturesSection: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Optimized GSAP animations with ScrollTrigger
    const ctx = gsap.context(() => {
      // Initial state
      gsap.set(".features-title", { opacity: 0, y: 30 });
      gsap.set(".features-description", { opacity: 0, y: 20 });
      gsap.set(".feature-card", { opacity: 0, y: 40 });

      // Animate in when section enters viewport
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.to(".features-title", {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
          });
          gsap.to(".features-description", {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            delay: 0.2,
          });
          gsap.to(".feature-card", {
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

  const features = [
    {
      icon: <Heart className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: t("features.items.memoryGallery.title"),
      description: t("features.items.memoryGallery.description"),
    },
    {
      icon: <Users className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: t("features.items.tributeWall.title"),
      description: t("features.items.tributeWall.description"),
    },
    {
      icon: <Shield className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: t("features.items.privacyControls.title"),
      description: t("features.items.privacyControls.description"),
    },
    {
      icon: <Clock className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: t("features.items.foreverPreserved.title"),
      description: t("features.items.foreverPreserved.description"),
    },
  ];

  return (
    <section
      id="features"
      ref={sectionRef}
      className={cn(
        "scroll-section relative min-h-screen w-full py-8 px-4 sm:px-6 lg:px-8",
        theme === "dark" ? "bg-black/80" : "bg-white/80"
      )}
    >
      {/* Animated dot layers */}
      <div
        className="absolute inset-0 pointer-events-none section-bg--dots animate-float-slow opacity-60"
        style={{ backgroundSize: "22px 22px" }}
      />
      <div
        className="absolute inset-0 pointer-events-none section-bg--dots animate-float-medium opacity-40"
        style={{ backgroundSize: "28px 28px" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="text-center mb-20 sm:mb-16">
          <h3 className="features-title text-2xl sm:text-3xl md:text-4xl md:pt-16 font-serif font-bold text-foreground mb-3 sm:mb-4 opacity-0 transition-all duration-1000 translate-x-[-100px] [.animate-in_&]:opacity-100 [.animate-in_&]:translate-x-0">
            {t("features.title")}
          </h3>
          <p className="features-description text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4 opacity-0 transition-all duration-1000 translate-x-[100px] [.animate-in_&]:opacity-100 [.animate-in_&]:translate-x-0">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="features-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="feature-card text-center opacity-0 transition-all duration-700 translate-y-8 scale-95 [.animate-in_&]:opacity-100 [.animate-in_&]:translate-y-0 [.animate-in_&]:scale-100"
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <CardHeader>
                <div className="text-primary mb-3 sm:mb-4 flex justify-center">{feature.icon}</div>
                <CardTitle className="text-base sm:text-lg lg:text-xl font-serif">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs sm:text-sm lg:text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
