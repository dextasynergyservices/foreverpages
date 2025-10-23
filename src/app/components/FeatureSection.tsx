"use client";

import { useEffect, useRef } from "react";
import { Heart, Shield, Users, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/hooks/useTheme";

export const FeaturesSection: React.FC = () => {
  const { theme } = useTheme();
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable animation for mobile
    if (window.innerWidth < 768) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
        }
      });
    }, observerOptions);

    // Observe animation targets
    const targets = document.querySelectorAll(
      ".features-title, .features-description, .feature-card"
    );
    targets.forEach((target) => {
      observer.observe(target);
    });

    return () => {
      targets.forEach((target) => {
        observer.unobserve(target);
      });
    };
  }, []);

  const features = [
    {
      icon: <Heart className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: "Memory Gallery",
      description:
        "Share unlimited photos, videos, and cherished memories in a beautifully organized collection that tells the complete story of your loved one's life journey and special moments captured over time.",
    },
    {
      icon: <Users className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: "Tribute Wall",
      description:
        "Friends and family can leave heartfelt messages, share personal stories, and offer condolences in a dedicated space that becomes a digital gathering place for everyone who cared about your loved one.",
    },
    {
      icon: <Shield className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: "Privacy Controls",
      description:
        "Maintain complete control over who can view and contribute to the memorial with our comprehensive privacy settings that ensure your family's comfort and security during this difficult time.",
    },
    {
      icon: <Clock className="h-6 w-6 sm:h-8 sm:w-8" />,
      title: "Forever Preserved",
      description:
        "Your memorial pages are permanently preserved in our secure cloud storage, ensuring they remain accessible for future generations to visit, remember, and cherish forever without any time limitations.",
    },
  ];

  return (
    <section
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
        <div className="text-center mb-12 sm:mb-16">
          <h3 className="features-title text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground mb-3 sm:mb-4 opacity-0 transition-all duration-1000 translate-x-[-100px] [.animate-in_&]:opacity-100 [.animate-in_&]:translate-x-0">
            Compassionate Features
          </h3>
          <p className="features-description text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4 opacity-0 transition-all duration-1000 translate-x-[100px] [.animate-in_&]:opacity-100 [.animate-in_&]:translate-x-0">
            Everything you need to create a beautiful, lasting tribute that brings people together
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
