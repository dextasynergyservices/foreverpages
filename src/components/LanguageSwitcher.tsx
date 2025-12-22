"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

// Language options with flag emojis and display names
const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "yo", name: "Yorùbá", flag: "🇳🇬" },
  { code: "ha", name: "Hausa", flag: "🇳🇬" },
  { code: "ig", name: "Igbo", flag: "🇳🇬" },
];

export const LanguageSwitcher: React.FC<{ inSheet?: boolean }> = ({ inSheet = false }) => {
  const { theme } = useTheme();
  const { locale, setLocale } = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydration safety
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const displayTheme = isHydrated ? theme : "light";
  const currentLanguage = languages.find((lang) => lang.code === locale) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    setLocale(languageCode as "en" | "es" | "fr" | "yo" | "ha" | "ig");
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Language Switcher Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        className={cn(
          "h-9 inline-flex items-center justify-center rounded-md transition-all duration-300 whitespace-nowrap",
          inSheet ? "w-9" : "px-4 gap-2 border",
          inSheet
            ? displayTheme === "dark"
              ? "text-white hover:bg-gray-900"
              : "text-gray-900 hover:bg-gray-100"
            : isScrolled
              ? displayTheme === "dark"
                ? "border-gray-300 bg-white text-gray-900 hover:bg-gray-100"
                : "border-gray-600 bg-black text-white hover:bg-gray-900"
              : "border-white/50 bg-transparent text-white hover:bg-white/10"
        )}
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="text-sm font-medium hidden sm:inline">{currentLanguage.name}</span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown Content */}
          <div
            className={cn(
              "absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg border z-50 transition-all duration-200",
              "animate-in slide-in-from-top-2 fade-in-0",
              displayTheme === "dark"
                ? "bg-black/90 backdrop-blur-md border-white/20 text-white"
                : "bg-white/90 backdrop-blur-md border-gray-200 text-gray-900"
            )}
          >
            <div className="p-2">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-200 hover:scale-105",
                    locale === language.code
                      ? displayTheme === "dark"
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-900"
                      : displayTheme === "dark"
                        ? "hover:bg-white/10 text-white/90"
                        : "hover:bg-gray-50 text-gray-700"
                  )}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span className="text-sm font-medium">{language.name}</span>
                  {locale === language.code && (
                    <div className="ml-auto">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          displayTheme === "dark" ? "bg-white" : "bg-gray-900"
                        )}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Compact version for mobile/smaller spaces
export const LanguageSwitcherCompact: React.FC = () => {
  const { theme } = useTheme();
  const { locale, setLocale } = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydration safety
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const displayTheme = isHydrated ? theme : "light";
  const currentLanguage = languages.find((lang) => lang.code === locale) || languages[0];

  const handleLanguageChange = (languageCode: string) => {
    setLocale(languageCode as "en" | "es" | "fr" | "yo" | "ha" | "ig");
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Compact Language Switcher Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-200",
          isScrolled
            ? displayTheme === "dark"
              ? "text-white hover:bg-white/10"
              : "text-gray-700 hover:bg-gray-100"
            : displayTheme === "dark"
              ? "text-white hover:bg-white/10"
              : "text-gray-700 hover:bg-gray-100"
        )}
      >
        <span className="text-base">{currentLanguage.flag}</span>
        <ChevronDown
          className={cn("h-3 w-3 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown Content */}
          <div
            className={cn(
              "absolute right-0 top-full mt-1 w-40 rounded-md shadow-lg border z-50 transition-all duration-200",
              "animate-in slide-in-from-top-2 fade-in-0",
              displayTheme === "dark"
                ? "bg-black/90 backdrop-blur-md border-white/20 text-white"
                : "bg-white/90 backdrop-blur-md border-gray-200 text-gray-900"
            )}
          >
            <div className="p-1">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all duration-200",
                    locale === language.code
                      ? displayTheme === "dark"
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-900"
                      : displayTheme === "dark"
                        ? "hover:bg-white/10 text-white/90"
                        : "hover:bg-gray-50 text-gray-700"
                  )}
                >
                  <span className="text-sm">{language.flag}</span>
                  <span className="text-xs font-medium">{language.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
