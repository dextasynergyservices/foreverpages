import React from "react";
import { Memorial, Template, UserTemplate } from "@/generated/prisma";
import { TemplateThemeProvider } from "@/contexts/TemplateThemeContext";
import { HeroSection } from "../../sections/HeroSection";

interface MemorialTemplateProps {
  memorial: Memorial;
  userTemplate: UserTemplate & {
    baseTemplate: Template;
  };
  config?: Record<string, unknown>;
}

export const MemorialTemplate: React.FC<MemorialTemplateProps> = ({ memorial, config }) => {
  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "var(--color-body-bg, #ffffff)",
    color: "var(--color-body-text, #111827)",
    fontFamily: "var(--font-family, 'Playfair Display', Georgia, serif)",
  };

  return (
    <TemplateThemeProvider
      initialTheme={{
        colors: {
          primary: "var(--color-primary, #1f2937)",
          secondary: "var(--color-secondary, #6b7280)",
          accent: "var(--color-accent, #3b82f6)",
          background: "var(--color-body-bg, #ffffff)",
          foreground: "var(--color-body-text, #111827)",
          muted: "var(--color-secondary, #9ca3af)",
          border: "var(--color-secondary, #e5e7eb)",
        },
        fonts: {
          heading: "var(--font-family, 'Playfair Display', Georgia, serif)",
          body: "var(--font-family, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto)",
          accent: "var(--font-family, 'Poppins', sans-serif)",
        },
        spacing: {
          section: "var(--spacing, 3rem)",
          element: "var(--spacing, 1.5rem)",
        },
        borderRadius: "var(--border-radius, 0.75rem)",
        shadows: true,
      }}
    >
      <div style={containerStyle}>
        <HeroSection
          memorial={memorial}
          config={{
            showCoverPhoto: true,
            showEpitaph: true,
            height: "large",
            overlayOpacity: 0.3,
            ...config,
          }}
        />
      </div>
    </TemplateThemeProvider>
  );
};
