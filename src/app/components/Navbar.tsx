"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "@/app/hooks/useTheme";
import { Moon, Sun, Heart, Menu } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/app/components/ui/sheet";

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 p-6 transition-all duration-500 ${
        isScrolled
          ? theme === "dark"
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
              isScrolled ? "text-primary" : theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          />
          <h1
            className={`text-2xl font-serif font-bold transition-colors ${
              isScrolled ? "" : theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
            ForeverPages
          </h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <a
            href="#features"
            className={`transition-all duration-300 hover:opacity-100 ${
              isScrolled
                ? "opacity-80"
                : theme === "dark"
                  ? "text-white/90 hover:text-white"
                  : "text-gray-900/90 hover:text-gray-900"
            }`}
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className={`transition-all duration-300 hover:opacity-100 ${
              isScrolled
                ? "opacity-80"
                : theme === "dark"
                  ? "text-white/90 hover:text-white"
                  : "text-gray-900/90 hover:text-gray-900"
            }`}
          >
            How It Works
          </a>
          <a
            href="#support"
            className={`transition-all duration-300 hover:opacity-100 ${
              isScrolled
                ? "opacity-80"
                : theme === "dark"
                  ? "text-white/90 hover:text-white"
                  : "text-gray-900/90 hover:text-gray-900"
            }`}
          >
            Support
          </a>
          <button
            className={`h-9 w-20 inline-flex items-center justify-center rounded-md border transition-all duration-300 ${
              isScrolled
                ? theme === "dark"
                  ? "border-gray-300 bg-white text-gray-900 hover:bg-gray-100"
                  : "border-gray-600 bg-black text-white hover:bg-gray-900"
                : theme === "dark"
                  ? "border-white/50 bg-transparent text-white hover:bg-white/10"
                  : "border-gray-900/50 bg-transparent text-gray-900 hover:bg-gray-900/10"
            }`}
          >
            Sign In
          </button>
          <button
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className={`h-9 w-9 inline-flex items-center justify-center rounded-md border transition-all duration-300 ${
              isScrolled
                ? theme === "dark"
                  ? "border-gray-300 bg-white text-gray-900 hover:bg-gray-100"
                  : "border-gray-600 bg-black text-white hover:bg-gray-900"
                : theme === "dark"
                  ? "border-white/50 bg-transparent text-white hover:bg-white/10"
                  : "border-gray-900/50 bg-transparent text-gray-900 hover:bg-gray-900/10"
            }`}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button
                className={`h-9 w-9 inline-flex items-center justify-center rounded-md border transition-all duration-300 ${
                  isScrolled
                    ? theme === "dark"
                      ? "border-black bg-white text-black hover:bg-black/80"
                      : "border-white bg-black text-white hover:bg-white"
                    : theme === "dark"
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
                theme === "dark"
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
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="opacity-80 hover:opacity-100 transition-opacity text-lg"
                  onClick={() => setIsOpen(false)}
                >
                  How It Works
                </a>
                <a
                  href="#support"
                  className="opacity-80 hover:opacity-100 transition-opacity text-lg"
                  onClick={() => setIsOpen(false)}
                >
                  Support
                </a>
                <Button variant="memorial-outline" size="sm" className="w-full">
                  Sign In
                </Button>
                <button
                  aria-label="Toggle theme"
                  onClick={toggleTheme}
                  className={`h-9 w-9 inline-flex items-center justify-center rounded-md border transition-colors self-start ${
                    theme === "dark"
                      ? "border-gray-300 text-gray-900 hover:bg-gray-100"
                      : "border-gray-600 text-white hover:bg-gray-900"
                  }`}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
