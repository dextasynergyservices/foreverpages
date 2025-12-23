import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "var(--font-inter)", "sans-serif"],
        serif: ["var(--font-playfair)", "serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        inter: ["var(--font-inter)", "sans-serif"],
        geist: ["var(--font-geist-sans)", "sans-serif"],
        playfair: ["var(--font-playfair)", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          soft: "hsl(var(--primary-soft))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          dark: "hsl(var(--secondary-dark))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          glow: "hsl(var(--accent-glow))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "background-scroll": {
          "0%": { backgroundPosition: "50% 0%" },
          "100%": { backgroundPosition: "50% -400%" },
        },
        "hero-morph": {
          "0%": { transform: "scale(1) rotate(0deg)", filter: "hue-rotate(0deg)" },
          "50%": { transform: "scale(1.1) rotate(2deg)", filter: "hue-rotate(45deg)" },
          "100%": { transform: "scale(1.05) rotate(-1deg)", filter: "hue-rotate(90deg)" },
        },
        "scroll-fade": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "morph-gradient": {
          "0%, 100%": {
            "background-position": "0% 50%",
          },
          "50%": {
            "background-position": "100% 50%",
          },
        },
        "fade-in-up": {
          from: {
            opacity: "0",
            transform: "translateY(40px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "gentle-pulse": {
          "0%, 100%": {
            opacity: "1",
            transform: "scale(1)",
          },
          "50%": {
            opacity: "0.8",
            transform: "scale(1.02)",
          },
        },
        shimmer: {
          "0%": {
            transform: "translateX(-100%)",
          },
          "100%": {
            transform: "translateX(100%)",
          },
        },
      },
      animation: {
        "hero-morph": "hero-morph 8s ease-in-out infinite alternate",
        "scroll-fade": "scroll-fade 0.6s ease-out forwards",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "morph-gradient": "morph-gradient 8s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.6s ease-out",
        "gentle-pulse": "gentle-pulse 3s ease-in-out infinite",
        "background-scroll": "background-scroll 100s linear infinite",
        "background-scroll-reduced": "background-scroll 800s linear infinite",
        shimmer: "shimmer 2s infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;
