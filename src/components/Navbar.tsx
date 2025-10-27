"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { LanguageSwitcher, LanguageSwitcherCompact } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Heart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const Navbar: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydration safety
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      // Show background when scrolled more than 50px
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Use a consistent theme during SSR to prevent hydration mismatch
  const displayTheme = isHydrated ? theme : "light";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 p-6 transition-all duration-500 ${
        isScrolled
          ? displayTheme === "dark"
            ? "bg-white backdrop-blur-md shadow-sm text-gray-900"
            : "bg-black backdrop-blur-md shadow-sm text-white"
          : "bg-transparent text-foreground"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Heart
            className={`h-8 w-8 transition-colors ${
              isScrolled ? "text-primary" : displayTheme === "dark" ? "text-white" : "text-gray-900"
            }`}
          />
          <h1
            className={`text-2xl font-serif font-bold transition-colors ${
              isScrolled ? "" : displayTheme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            {t("navbar.logo")}
          </h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <a
            href="#hero"
            className={`transition-all duration-300 hover:opacity-100 ${
              isScrolled
                ? "opacity-80"
                : displayTheme === "dark"
                  ? "text-white/90 hover:text-white"
                  : "text-gray-900/90 hover:text-gray-900"
            }`}
          >
            {t("navbar.navigation.home")}
          </a>

          <a
            href="#memorial-pages"
            className={`transition-all duration-300 hover:opacity-100 ${
              isScrolled
                ? "opacity-80"
                : displayTheme === "dark"
                  ? "text-white/90 hover:text-white"
                  : "text-gray-900/90 hover:text-gray-900"
            }`}
          >
            {t("navbar.navigation.memorials")}
          </a>

          <a
            href="#how-it-works"
            className={`transition-all duration-300 hover:opacity-100 ${
              isScrolled
                ? "opacity-80"
                : displayTheme === "dark"
                  ? "text-white/90 hover:text-white"
                  : "text-gray-900/90 hover:text-gray-900"
            }`}
          >
            {t("navbar.navigation.howItWorks")}
          </a>
          <a
            href="#contact"
            className={`transition-all duration-300 hover:opacity-100 ${
              isScrolled
                ? "opacity-80"
                : displayTheme === "dark"
                  ? "text-white/90 hover:text-white"
                  : "text-gray-900/90 hover:text-gray-900"
            }`}
          >
            {t("navbar.navigation.support")}
          </a>
          <LanguageSwitcher />
          <button
            className={`h-9 px-4 inline-flex items-center justify-center rounded-md border transition-all duration-300 whitespace-nowrap ${
              isScrolled
                ? displayTheme === "dark"
                  ? "border-gray-300 bg-white text-gray-900 hover:bg-gray-100"
                  : "border-gray-600 bg-black text-white hover:bg-gray-900"
                : displayTheme === "dark"
                  ? "border-white/50 bg-transparent text-white hover:bg-white/10"
                  : "border-gray-900/50 bg-transparent text-gray-900 hover:bg-gray-900/10"
            }`}
          >
            {t("navbar.buttons.signIn")}
          </button>
          <ThemeToggle
            className={`h-9 w-9 inline-flex items-center justify-center rounded-md border transition-all duration-300 ${
              isScrolled
                ? displayTheme === "dark"
                  ? "border-gray-300 bg-white text-gray-900 hover:bg-gray-100"
                  : "border-gray-600 bg-black text-white hover:bg-gray-900"
                : displayTheme === "dark"
                  ? "border-white/50 bg-transparent text-white hover:bg-white/10"
                  : "border-gray-900/50 bg-transparent text-gray-900 hover:bg-gray-900/10"
            }`}
            size="md"
          />
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button
                className={`h-9 w-9 inline-flex items-center justify-center rounded-md border transition-all duration-300 ${
                  isScrolled
                    ? displayTheme === "dark"
                      ? "border-black bg-white text-black hover:bg-black/80"
                      : "border-white bg-black text-white hover:bg-white"
                    : displayTheme === "dark"
                      ? "border-white bg-transparent text-white hover:bg-white"
                      : "border-black bg-transparent text-black hover:bg-black/80"
                }`}
              >
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className={`w-[300px] sm:w-[400px] transition-colors ${
                displayTheme === "dark"
                  ? "bg-white backdrop-blur-lg border-black text-black"
                  : "bg-black backdrop-blur-lg border-white text-white"
              }`}
            >
              <div className="flex flex-col space-y-6 mt-8">
                <a
                  href="#features"
                  className="opacity-80 hover:opacity-100 transition-opacity text-lg"
                  onClick={() => setIsOpen(false)}
                >
                  {t("navbar.navigation.features")}
                </a>
                <a
                  href="#how-it-works"
                  className="opacity-80 hover:opacity-100 transition-opacity text-lg"
                  onClick={() => setIsOpen(false)}
                >
                  {t("navbar.navigation.howItWorks")}
                </a>
                <a
                  href="#support"
                  className="opacity-80 hover:opacity-100 transition-opacity text-lg"
                  onClick={() => setIsOpen(false)}
                >
                  {t("navbar.navigation.support")}
                </a>
                <div className="flex items-center gap-3">
                  <LanguageSwitcherCompact />
                  <ThemeToggle
                    className={`h-9 w-9 inline-flex items-center justify-center rounded-md border transition-colors ${
                      displayTheme === "dark"
                        ? "border-gray-300 text-gray-900 hover:bg-gray-100"
                        : "border-gray-600 text-white hover:bg-gray-900"
                    }`}
                    size="md"
                  />
                </div>
                <Button variant="memorial-outline" size="xs" className="w-full">
                  {t("navbar.buttons.signIn")}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
