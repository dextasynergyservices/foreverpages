declare module "./styles.css" {
  interface CSSModule {
    // CSS Custom Properties (CSS Variables)
    readonly background: string;
    readonly foreground: string;
    readonly card: string;
    readonly cardForeground: string;
    readonly popover: string;
    readonly popoverForeground: string;
    readonly primary: string;
    readonly primaryForeground: string;
    readonly secondary: string;
    readonly secondaryForeground: string;
    readonly muted: string;
    readonly mutedForeground: string;
    readonly accent: string;
    readonly accentForeground: string;
    readonly destructive: string;
    readonly destructiveForeground: string;
    readonly border: string;
    readonly input: string;
    readonly ring: string;
    readonly radius: string;

    // Celebration of Life Color Palette
    readonly celebrationTerracotta: string;
    readonly celebrationSage: string;
    readonly celebrationWarmWhite: string;
    readonly celebrationPeach: string;
    readonly celebrationCharcoal: string;

    // Utility Classes
    readonly gradientWarm: string;
    readonly shadowSoft: string;
    readonly shadowHover: string;
    readonly transitionSmooth: string;
    readonly glassmorphism: string;
  }

  const classes: CSSModule;
  export default classes;
}

// Global CSS declarations for CSS custom properties
declare global {
  interface CSSStyleDeclaration {
    // CSS Custom Properties available globally
    "--background": string;
    "--foreground": string;
    "--card": string;
    "--card-foreground": string;
    "--popover": string;
    "--popover-foreground": string;
    "--primary": string;
    "--primary-foreground": string;
    "--secondary": string;
    "--secondary-foreground": string;
    "--muted": string;
    "--muted-foreground": string;
    "--accent": string;
    "--accent-foreground": string;
    "--destructive": string;
    "--destructive-foreground": string;
    "--border": string;
    "--input": string;
    "--ring": string;
    "--radius": string;

    // Celebration of Life Color Palette
    "--celebration-terracotta": string;
    "--celebration-sage": string;
    "--celebration-warm-white": string;
    "--celebration-peach": string;
    "--celebration-charcoal": string;
  }
}

export {};
