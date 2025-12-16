/**
 * Next.js Template Validator
 * Validates Next.js native template structure and files
 */

import fs from "fs";
import path from "path";

export interface NextJsTemplateValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  manifest?: TemplateManifest;
  config?: TemplateConfig;
}

export interface TemplateManifest {
  name: string;
  slug: string;
  version: string;
  description?: string;
  author?: string;
  sections?: Array<{
    id: string;
    name: string;
    component: string;
    required: boolean;
  }>;
  supportedSections?: string[];
  features?: string[];
  customization?: {
    colors?: Record<string, string>;
    fonts?: Record<string, string>;
  };
  preview?: {
    image?: string;
    thumbnail?: string;
  };
}

export interface TemplateConfig {
  name: string;
  slug: string;
  version: string;
  sections?: Array<{ id: string; name: string; required: boolean }>;
  customization?: Record<string, unknown>;
  preview?: Record<string, unknown>;
}

/**
 * Validates a Next.js template directory structure
 */
export async function validateNextJsTemplate(
  extractedPath: string
): Promise<NextJsTemplateValidation> {
  const result: NextJsTemplateValidation = {
    valid: false,
    errors: [],
    warnings: [],
  };

  // Required files for Next.js templates
  const requiredFiles = {
    "page.tsx": "Main template page component",
    "manifest.json": "Template metadata",
  };

  // Recommended files
  const recommendedFiles = {
    "layout.tsx": "Template layout component",
    "config.ts": "Template configuration",
    "styles.css": "Template styles",
  };

  // Check required files
  for (const [file, description] of Object.entries(requiredFiles)) {
    const filePath = path.join(extractedPath, file);
    if (!fs.existsSync(filePath)) {
      result.errors.push(`Missing required file: ${file} (${description})`);
    }
  }

  // Check recommended files
  for (const [file, description] of Object.entries(recommendedFiles)) {
    const filePath = path.join(extractedPath, file);
    if (!fs.existsSync(filePath)) {
      result.warnings.push(`Recommended file missing: ${file} (${description})`);
    }
  }

  // If required files are missing, return early
  if (result.errors.length > 0) {
    return result;
  }

  // Validate manifest.json
  try {
    const manifestPath = path.join(extractedPath, "manifest.json");
    const manifestContent = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(manifestContent) as TemplateManifest;

    // Validate required manifest fields
    if (!manifest.name) {
      result.errors.push("manifest.json: 'name' field is required");
    }
    if (!manifest.slug) {
      result.errors.push("manifest.json: 'slug' field is required");
    }
    if (!manifest.version) {
      result.errors.push("manifest.json: 'version' field is required");
    }

    // Validate slug format (lowercase, hyphens only)
    if (manifest.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.slug)) {
      result.errors.push("manifest.json: 'slug' must be lowercase alphanumeric with hyphens only");
    }

    result.manifest = manifest;
  } catch (error) {
    result.errors.push(
      `Failed to parse manifest.json: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Validate config.ts if present
  const configPath = path.join(extractedPath, "config.ts");
  if (fs.existsSync(configPath)) {
    try {
      const configContent = fs.readFileSync(configPath, "utf-8");

      // Basic validation - check for export
      if (!configContent.includes("export")) {
        result.warnings.push("config.ts: No exports found");
      }

      // Check for templateConfig export
      if (!configContent.includes("templateConfig")) {
        result.warnings.push("config.ts: 'templateConfig' export not found");
      }
    } catch (error) {
      result.warnings.push(
        `Failed to read config.ts: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Validate page.tsx
  const pagePath = path.join(extractedPath, "page.tsx");
  try {
    const pageContent = fs.readFileSync(pagePath, "utf-8");

    // Check for async function (Next.js 15+ pattern)
    if (!pageContent.includes("async function") && !pageContent.includes("async ")) {
      result.warnings.push(
        "page.tsx: Consider using async server component for better performance"
      );
    }

    // Check for proper imports
    if (!pageContent.includes("import")) {
      result.warnings.push("page.tsx: No imports found - component may be incomplete");
    }
  } catch (error) {
    result.errors.push(
      `Failed to read page.tsx: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Check for components directory
  const componentsPath = path.join(extractedPath, "components");
  if (!fs.existsSync(componentsPath)) {
    result.warnings.push(
      "No 'components' directory found - consider organizing components in a subdirectory"
    );
  }

  // Check for preview images in public directory
  if (result.manifest) {
    const publicPath = path.join(extractedPath, "public");
    if (fs.existsSync(publicPath)) {
      const previewPath = path.join(publicPath, "preview.png");
      const thumbnailPath = path.join(publicPath, "thumbnail.png");

      if (!fs.existsSync(previewPath)) {
        result.warnings.push("No preview.png found in public directory");
      }
      if (!fs.existsSync(thumbnailPath)) {
        result.warnings.push("No thumbnail.png found in public directory");
      }
    } else {
      result.warnings.push("No public directory found for preview images");
    }
  }

  // Final validation
  result.valid = result.errors.length === 0;

  return result;
}

/**
 * Detects if extracted template is Next.js or React SPA
 */
export function detectTemplateType(extractedPath: string): "nextjs" | "react-spa" | "unknown" {
  const hasPageTsx = fs.existsSync(path.join(extractedPath, "page.tsx"));
  const hasManifestJson = fs.existsSync(path.join(extractedPath, "manifest.json"));
  const hasMemorialTemplate = fs.existsSync(path.join(extractedPath, "MemorialTemplate.tsx"));
  const hasConfigJson = fs.existsSync(path.join(extractedPath, "config.json"));

  // Next.js templates have page.tsx and manifest.json
  if (hasPageTsx && hasManifestJson) {
    return "nextjs";
  }

  // React SPA templates have MemorialTemplate.tsx and config.json
  if (hasMemorialTemplate && hasConfigJson) {
    return "react-spa";
  }

  return "unknown";
}
