"use client";

import { Button } from "./button";
import { useState, useEffect } from "react";
import { DonateModal } from "./DonateModal";

export const Navbar = () => {
  const [showDonate, setShowDonate] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "border-b border-soft-gold/20 bg-burgundy/95 shadow-elegant backdrop-blur-md"
            : "bg-gradient-to-r from-burgundy to-deep-plum shadow-soft"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Person&apos;s Name */}
            <div className="font-heading text-lg font-semibold tracking-wide text-cream">
              Eleanor Grace Thompson
            </div>

            {/* Right: Navigation */}
            <div className="hidden items-center gap-8 md:flex">
              <button
                onClick={() => scrollToSection("home")}
                className="group relative font-medium text-cream transition-smooth hover:text-soft-gold"
              >
                Home
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-soft-gold transition-all duration-300 group-hover:w-full" />
              </button>
              <button
                onClick={() => scrollToSection("memories")}
                className="group relative font-medium text-cream transition-smooth hover:text-soft-gold"
              >
                Memories
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-soft-gold transition-all duration-300 group-hover:w-full" />
              </button>
              <button
                onClick={() => scrollToSection("photos")}
                className="group relative font-medium text-cream transition-smooth hover:text-soft-gold"
              >
                Photos
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-soft-gold transition-all duration-300 group-hover:w-full" />
              </button>
              <button
                onClick={() => scrollToSection("legacy")}
                className="group relative font-medium text-cream transition-smooth hover:text-soft-gold"
              >
                Legacy
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-soft-gold transition-all duration-300 group-hover:w-full" />
              </button>
              <Button
                onClick={() => setShowDonate(true)}
                className="transform rounded-full bg-soft-gold px-6 py-2 font-semibold text-burgundy shadow-lg transition-all duration-300 hover:scale-105 hover:bg-soft-gold/90 hover:shadow-gold"
              >
                Send Support
              </Button>
            </div>

            {/* Mobile menu button (optional) */}
            <div className="md:hidden">
              <Button
                onClick={() => setShowDonate(true)}
                className="rounded-full bg-soft-gold px-4 py-2 text-sm font-semibold text-burgundy hover:bg-soft-gold/90"
              >
                Support
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <DonateModal open={showDonate} onOpenChange={setShowDonate} />
    </>
  );
};
