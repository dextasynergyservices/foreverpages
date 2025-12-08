import { DesignTokens } from "@/components/userDashboard/pageBuilder/TemplateCustomizer";

/**
 * Converts design tokens to CSS variables for application to templates
 */
export const designTokensToCSSVars = (tokens: DesignTokens | null): Record<string, string> => {
  if (!tokens) return {};

  const cssVars: Record<string, string> = {};

  // Color tokens
  if (tokens.colors) {
    cssVars["--color-primary"] = tokens.colors.primary || "#1f2937";
    cssVars["--color-secondary"] = tokens.colors.secondary || "#6366f1";
    cssVars["--color-accent"] = tokens.colors.accent || "#ec4899";
    cssVars["--color-header-bg"] = tokens.colors.headerBg || "#111827";
    cssVars["--color-header-text"] = tokens.colors.headerText || "#ffffff";
    cssVars["--color-body-bg"] = tokens.colors.bodyBg || "#f9fafb";
    cssVars["--color-body-text"] = tokens.colors.bodyText || "#1f2937";
  }

  // Font tokens
  if (tokens.fonts) {
    const fontFamilyMap: Record<string, string> = {
      Inter: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",
      Serif: "ui-serif, Georgia, 'Times New Roman', serif",
      Poppins: "'Poppins', sans-serif",
      "Open Sans": "'Open Sans', sans-serif",
    };

    cssVars["--font-family"] =
      fontFamilyMap[tokens.fonts.fontFamily] ||
      "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto";

    const headingSizeMap: Record<string, string> = {
      small: "1.5rem",
      medium: "2rem",
      large: "2.5rem",
    };
    cssVars["--font-heading-size"] = headingSizeMap[tokens.fonts.headingSize] || "2rem";

    const bodySizeMap: Record<string, string> = {
      small: "0.875rem",
      medium: "1rem",
      large: "1.125rem",
    };
    cssVars["--font-body-size"] = bodySizeMap[tokens.fonts.bodySize] || "1rem";
  }

  // Layout tokens
  if (tokens.layout) {
    const spacingMap: Record<string, string> = {
      compact: "1rem",
      comfortable: "1.5rem",
      spacious: "2rem",
    };
    cssVars["--spacing"] = spacingMap[tokens.layout.spacing] || "1.5rem";

    const borderRadiusMap: Record<string, string> = {
      sharp: "0px",
      slight: "0.25rem",
      moderate: "0.5rem",
      rounded: "1rem",
    };
    cssVars["--border-radius"] = borderRadiusMap[tokens.layout.borderRadius] || "0.5rem";

    const containerWidthMap: Record<string, string> = {
      narrow: "48rem",
      standard: "64rem",
      wide: "80rem",
    };
    cssVars["--container-width"] = containerWidthMap[tokens.layout.containerWidth] || "64rem";
  }

  return cssVars;
};

/**
 * Generates inline styles from design tokens for React components
 */
export const designTokensToStyles = (tokens: DesignTokens | null): React.CSSProperties => {
  const cssVars = designTokensToCSSVars(tokens);
  const styles: Record<string, string> = {};

  Object.entries(cssVars).forEach(([key, value]) => {
    // Store CSS variables for use in inline styles
    styles[key] = value;
  });

  return styles as React.CSSProperties;
};

/**
 * Applies design tokens as CSS variables to a DOM element
 */
export const applyDesignTokensToElement = (
  element: HTMLElement,
  tokens: DesignTokens | null
): void => {
  const cssVars = designTokensToCSSVars(tokens);

  Object.entries(cssVars).forEach(([key, value]) => {
    element.style.setProperty(key, value);
  });
};

/**
 * Creates a CSS string for design tokens that can be injected into a style tag
 */
export const generateDesignTokensCSS = (tokens: DesignTokens | null): string => {
  const cssVars = designTokensToCSSVars(tokens);

  let css = ":root {\n";
  Object.entries(cssVars).forEach(([key, value]) => {
    css += `  ${key}: ${value};\n`;
  });
  css += "}\n";

  return css;
};
