import React, { createContext, useContext, useEffect, useState } from "react";

export interface TemplateTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
    accent: string;
  };
  spacing: {
    section: string;
    element: string;
  };
  borderRadius: string;
  shadows: boolean;
}

export interface TemplateThemeContextValue {
  theme: TemplateTheme;
  updateTheme: (updates: Partial<TemplateTheme>) => void;
  resetTheme: () => void;
}

const defaultTheme: TemplateTheme = {
  colors: {
    primary: "#1f2937",
    secondary: "#6b7280",
    accent: "#3b82f6",
    background: "#ffffff",
    foreground: "#111827",
    muted: "#9ca3af",
    border: "#e5e7eb",
  },
  fonts: {
    heading: "var(--font-playfair)",
    body: "var(--font-inter)",
    accent: "var(--font-geist-sans)",
  },
  spacing: {
    section: "2rem",
    element: "1rem",
  },
  borderRadius: "0.5rem",
  shadows: true,
};

const TemplateThemeContext = createContext<TemplateThemeContextValue | undefined>(undefined);

export const TemplateThemeProvider: React.FC<{
  children: React.ReactNode;
  initialTheme?: Partial<TemplateTheme>;
}> = ({ children, initialTheme }) => {
  const [theme, setTheme] = useState<TemplateTheme>(() => ({
    ...defaultTheme,
    ...initialTheme,
  }));

  const updateTheme = (updates: Partial<TemplateTheme>) => {
    setTheme((prev) => ({
      ...prev,
      ...updates,
      colors: { ...prev.colors, ...updates.colors },
      fonts: { ...prev.fonts, ...updates.fonts },
      spacing: { ...prev.spacing, ...updates.spacing },
    }));
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--template-${key}`, value);
    });

    Object.entries(theme.fonts).forEach(([key, value]) => {
      root.style.setProperty(`--template-font-${key}`, value);
    });

    root.style.setProperty("--template-spacing-section", theme.spacing.section);
    root.style.setProperty("--template-spacing-element", theme.spacing.element);
    root.style.setProperty("--template-border-radius", theme.borderRadius);
  }, [theme]);

  return (
    <TemplateThemeContext.Provider value={{ theme, updateTheme, resetTheme }}>
      {children}
    </TemplateThemeContext.Provider>
  );
};

export const useTemplateTheme = (): TemplateThemeContextValue => {
  const context = useContext(TemplateThemeContext);
  if (!context) {
    throw new Error("useTemplateTheme must be used within a TemplateThemeProvider");
  }
  return context;
};
