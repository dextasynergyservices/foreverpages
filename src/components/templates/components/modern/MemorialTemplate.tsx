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
  return (
    <TemplateThemeProvider
      initialTheme={{
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
          section: "3rem",
          element: "1.5rem",
        },
        borderRadius: "0.75rem",
        shadows: true,
      }}
    >
      <div className="min-h-screen">
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
