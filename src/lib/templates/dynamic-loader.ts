import { registerTemplate } from "./registry";
import { TemplateProps } from "./registry";
import React from "react";

/**
 * Dynamically load a template component by slug
 * Only loads templates from /components/templates/components/ (bundled templates)
 * Templates in /app/templates/ are excluded from Next.js build and should NOT be imported
 */
export async function loadTemplateBySlug(
  slug: string
): Promise<React.ComponentType<TemplateProps> | null> {
  try {
    // Only try to load from components/templates/components/{slug}
    // This is for templates that are part of the Next.js bundle
    try {
      const componentModule = await import(
        `@/components/templates/components/${slug}/MemorialTemplate`
      );
      return (
        componentModule.default ||
        componentModule.MemorialTemplate ||
        componentModule[`${slug}MemorialTemplate`]
      );
    } catch (err) {
      console.warn(`Could not dynamically load template: ${slug}`, err);
    }

    return null;
  } catch (error) {
    console.error(`Error loading template ${slug}:`, error);
    return null;
  }
}

/**
 * Dynamically register a template when it's first accessed
 */
export async function ensureTemplateRegistered(slug: string): Promise<boolean> {
  try {
    const TemplateComponent = await loadTemplateBySlug(slug);

    if (TemplateComponent) {
      registerTemplate(slug, {
        MemorialTemplate: TemplateComponent,
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error registering template ${slug}:`, error);
    return false;
  }
}
