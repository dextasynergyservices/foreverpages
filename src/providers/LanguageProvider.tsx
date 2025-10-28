"use client";

import React, { ReactNode } from "react";
import { LanguageProvider as LanguageContextProvider } from "../contexts/LanguageContext";
import { getCurrentLocale } from "../lib/i18n";

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  // Get the current locale on the client side
  const initialLocale = typeof window !== "undefined" ? getCurrentLocale() : "en";

  return (
    <LanguageContextProvider initialLocale={initialLocale}>{children}</LanguageContextProvider>
  );
}
