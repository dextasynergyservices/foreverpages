"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeatureSection";
import { FuneralPageSection } from "@/components/FuneralPageSection";
import { HowItWorksSection } from "@/components/HowItWorksSection ";
import { FAQSection } from "@/components/FAQ";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { Contact } from "@/components/Contact";
import { CTASection } from "@/components/CTASection";
import { PricingSection } from "@/components/PricingSection";
import { Footer } from "@/components/Footer";
import { LoadingPage } from "@/components/LoadingPage";
import { useTheme } from "@/hooks/useTheme";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    // Much faster loading - only 0.5 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingPage onLoadingComplete={() => setIsLoading(false)} theme={theme} />;
  }

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
        <FAQSection />
        <PricingSection />
        <TestimonialsSection />
        <Contact />
        <CTASection />
      </div>

      <Footer />
    </div>
  );
}
