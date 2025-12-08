"use client";

import React, { ReactNode } from "react";
import { LanguageProvider as LanguageContextProvider } from "../contexts/LanguageContext";

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  // Do not pass initialLocale to allow LanguageContext to properly initialize from localStorage
  // The context will handle locale detection via useEffect on the client side
  return <LanguageContextProvider>{children}</LanguageContextProvider>;
}
