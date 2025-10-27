"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { SupportedLocale, DEFAULT_LOCALE } from "../lib/types/i18n";
import { getCurrentLocale, storeLocale } from "../lib/i18n";

interface LanguageContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  initialLocale?: SupportedLocale;
}

export function LanguageProvider({ children, initialLocale }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale || DEFAULT_LOCALE);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize locale on mount
  useEffect(() => {
    if (!initialLocale) {
      const currentLocale = getCurrentLocale();
      setLocaleState(currentLocale);
    }
    setIsLoading(false);
  }, [initialLocale]);

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    storeLocale(newLocale);

    // Update document language attribute
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLocale;
    }
  };

  // Update document language when locale changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const value: LanguageContextType = {
    locale,
    setLocale,
    isLoading,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
