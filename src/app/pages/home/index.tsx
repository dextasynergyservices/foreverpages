"use client";

import { useEffect } from "react";
import {
  Navbar,
  HeroSection,
  FeaturesSection,
  FuneralPageSection,
  HowItWorksSection,
  TestimonialsSection,
  CTASection,
  PricingSection,
  Footer,
} from "./components";

export function HomePage() {
  useEffect(() => {
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

    const sections = document.querySelectorAll(".scroll-section");
    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      sections.forEach((section) => {
        observer.unobserve(section);
      });
    };
  }, []);

  return (
    <div className="relative">
      <div className="fixed top-0 left-0 w-full z-[1000]">
        <Navbar />
      </div>

      <div className="simple-scroll-container">
        <HeroSection />
        <FeaturesSection />
        <FuneralPageSection />
        <HowItWorksSection />
        <PricingSection />
        <TestimonialsSection />
        <CTASection />
      </div>

      <Footer />
    </div>
  );
}
