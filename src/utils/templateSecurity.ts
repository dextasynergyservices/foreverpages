import DOMPurify from "isomorphic-dompurify";

export interface TemplateCustomization {
  name?: string;
  colors?: Record<string, string>;
  typography?: {
    fontSize?: Record<string, number>;
    lineHeight?: number;
  };
  layout?: {
    spacing?: number;
    borderRadius?: number;
    maxWidth?: number;
  };
  customCSS?: string;
  customJS?: string;
}

export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== "string") return "";
  return DOMPurify.sanitize(input.trim(), { ALLOWED_TAGS: [] });
};

export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== "string") return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6"],
    ALLOWED_ATTR: [],
  });
};

export const validateTemplateName = (name: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(name);
  if (!sanitized) return { isValid: false, error: "nameRequired" };
  if (sanitized.length < 2) return { isValid: false, error: "nameTooShort" };
  if (sanitized.length > 100) return { isValid: false, error: "nameTooLong" };
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(sanitized)) return { isValid: false, error: "nameInvalid" };
  return { isValid: true };
};

export const validateTemplateDescription = (
  description: string
): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(description);
  if (sanitized.length > 500) return { isValid: false, error: "descriptionTooLong" };
  return { isValid: true };
};

export const validateSearchQuery = (query: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(query);
  if (sanitized.length > 100) return { isValid: false, error: "searchQueryInvalid" };
  return { isValid: true };
};

export const validateColor = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
};

export const validateFontSize = (size: number): boolean => {
  return Number.isInteger(size) && size >= 8 && size <= 72;
};

export const validateSpacing = (spacing: number): boolean => {
  return Number.isInteger(spacing) && spacing >= 0 && spacing <= 100;
};

export const validateBorderRadius = (radius: number): boolean => {
  return Number.isInteger(radius) && radius >= 0 && radius <= 50;
};

export const validateMaxWidth = (width: number): boolean => {
  return Number.isInteger(width) && width >= 320 && width <= 2000;
};

export const validateLineHeight = (height: number): boolean => {
  return typeof height === "number" && height >= 0.8 && height <= 3.0;
};

export const validateTemplateCustomization = (
  customization: TemplateCustomization
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!customization || typeof customization !== "object") {
    errors.push("Invalid customization data");
    return { isValid: false, errors };
  }

  const { colors, typography, layout } = customization;

  if (colors) {
    Object.entries(colors).forEach(([key, value]) => {
      if (typeof value !== "string" || !validateColor(value)) {
        errors.push(`Invalid color value for ${key}`);
      }
    });
  }

  if (typography) {
    if (typography.fontSize) {
      Object.entries(typography.fontSize).forEach(([key, value]) => {
        if (!validateFontSize(value as number)) {
          errors.push(`Invalid font size for ${key}`);
        }
      });
    }

    if (typography.lineHeight && !validateLineHeight(typography.lineHeight)) {
      errors.push("Invalid line height");
    }
  }

  if (layout) {
    if (layout.spacing !== undefined && !validateSpacing(layout.spacing)) {
      errors.push("Invalid spacing value");
    }
    if (layout.borderRadius !== undefined && !validateBorderRadius(layout.borderRadius)) {
      errors.push("Invalid border radius");
    }
    if (layout.maxWidth !== undefined && !validateMaxWidth(layout.maxWidth)) {
      errors.push("Invalid max width");
    }
  }

  if (customization.customCSS && typeof customization.customCSS !== "string") {
    errors.push("Invalid custom CSS");
  }

  if (customization.customJS && typeof customization.customJS !== "string") {
    errors.push("Invalid custom JavaScript");
  }

  return { isValid: errors.length === 0, errors };
};

export const sanitizeTemplateCustomization = (
  customization: TemplateCustomization
): TemplateCustomization => {
  if (!customization || typeof customization !== "object") return customization;

  const sanitized = { ...customization };

  if (sanitized.name) {
    sanitized.name = sanitizeInput(sanitized.name);
  }

  if (sanitized.customCSS) {
    sanitized.customCSS = sanitizeHtml(sanitized.customCSS);
  }

  if (sanitized.customJS) {
    sanitized.customJS = sanitizeInput(sanitized.customJS);
  }

  return sanitized;
};
