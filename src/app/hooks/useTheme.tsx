"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "fp-theme";

function getSystemPreference(): ThemeMode {
  if (typeof window === "undefined" || typeof matchMedia === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
  return stored ?? getSystemPreference();
}

interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  // Apply theme to <html> and persist
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // React to OS scheme changes if user hasn't explicitly chosen
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) setTheme(e.matches ? "dark" : "light");
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  // Sync across tabs/windows
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const next = e.newValue as ThemeMode;
        setTheme(next);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);

  // Always call hooks at the top level
  const [fallbackTheme, setFallbackTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    if (!ctx) {
      const root = document.documentElement;
      if (fallbackTheme === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
      window.localStorage.setItem(STORAGE_KEY, fallbackTheme);
    }
  }, [fallbackTheme, ctx]);

  const toggleTheme = useCallback(() => {
    if (ctx) {
      ctx.toggleTheme();
    } else {
      setFallbackTheme((prev) => (prev === "dark" ? "light" : "dark"));
    }
  }, [ctx]);

  if (!ctx) {
    // Fallback to prevent crashes if provider is missing; still functional but not shared
    return { theme: fallbackTheme, toggleTheme };
  }

  return ctx;
}
