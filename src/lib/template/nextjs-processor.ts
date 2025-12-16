/**
 * Next.js Template Processing Utilities
 * Handles copying, file operations, and registration of Next.js templates
 */

import fs from "fs";
import path from "path";
import { TemplateManifest } from "./nextjs-validator";

export interface ProcessNextJsTemplateResult {
  success: boolean;
  targetDir?: string;
  publicDir?: string;
  error?: string;
}

/**
 * Copy Next.js template to src/app/templates/ directory
 */
export async function copyNextJsTemplate(
  extractedPath: string,
  slug: string
): Promise<ProcessNextJsTemplateResult> {
  try {
    const targetDir = path.join(process.cwd(), "src", "app", "templates", slug);

    // Check if target already exists
    if (fs.existsSync(targetDir)) {
      // Backup existing template
      const backupDir = `${targetDir}.backup.${Date.now()}`;
      fs.renameSync(targetDir, backupDir);
      console.log(`Backed up existing template to: ${backupDir}`);
    }

    // Create target directory
    fs.mkdirSync(targetDir, { recursive: true });

    // Copy all files except public directory
    await copyDirectory(extractedPath, targetDir, ["public"]);

    // Copy public assets
    let publicDir: string | undefined;
    const extractedPublicPath = path.join(extractedPath, "public");
    if (fs.existsSync(extractedPublicPath)) {
      publicDir = path.join(process.cwd(), "public", "templates", slug);
      fs.mkdirSync(publicDir, { recursive: true });
      await copyDirectory(extractedPublicPath, publicDir);
    }

    return {
      success: true,
      targetDir,
      publicDir,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Recursively copy directory with exclusions
 */
async function copyDirectory(
  source: string,
  destination: string,
  exclude: string[] = []
): Promise<void> {
  // Create destination if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    // Skip excluded directories/files
    if (exclude.includes(entry.name)) {
      continue;
    }

    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destPath, exclude);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

/**
 * Read manifest from template directory
 */
export function readTemplateManifest(templatePath: string): TemplateManifest | null {
  try {
    const manifestPath = path.join(templatePath, "manifest.json");
    if (!fs.existsSync(manifestPath)) {
      return null;
    }

    const content = fs.readFileSync(manifestPath, "utf-8");
    return JSON.parse(content) as TemplateManifest;
  } catch (error) {
    console.error("Failed to read manifest:", error);
    return null;
  }
}

/**
 * Create template sections from manifest
 */
export function createTemplateSectionsData(manifest: TemplateManifest): Array<{
  type: string;
  name: string;
  description?: string;
  componentPath: string;
  layout: string;
  isCollapsible: boolean;
  isHideable: boolean;
  defaultVisible: boolean;
  order: number;
}> {
  // Try to load sections from config.ts if not in manifest
  if (!manifest.sections || manifest.sections.length === 0) {
    // Check if supportedSections exists in manifest (new format)
    if (manifest.supportedSections && Array.isArray(manifest.supportedSections)) {
      const supportedSections = manifest.supportedSections;
      return supportedSections.map((sectionType, index) => ({
        type: sectionType,
        name: sectionType
          .split("_")
          .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
          .join(" "),
        description: `${sectionType} section`,
        componentPath: `components/${sectionType}`,
        layout: "DEFAULT" as const,
        isCollapsible: false,
        isHideable: true,
        defaultVisible: true,
        order: index + 1,
      }));
    }
    return [];
  }

  // Map section IDs to template section types
  const sectionTypeMap: Record<string, string> = {
    hero: "HERO",
    candles: "VIRTUAL_CANDLES",
    journey: "TIMELINE",
    timeline: "TIMELINE",
    gallery: "GALLERY",
    tributes: "TRIBUTES",
    condolence: "CONDOLENCES",
    condolences: "CONDOLENCES",
    biography: "BIOGRAPHY",
    family: "FAMILY_TREE",
    video: "VIDEO_GALLERY",
    donations: "DONATIONS",
  };

  return manifest.sections.map((section, index) => {
    const type = sectionTypeMap[section.id] || section.id.toUpperCase();

    return {
      type,
      name: section.name,
      description: `${section.name} section component`,
      componentPath: `components/${section.component}`,
      layout: "DEFAULT" as const,
      isCollapsible: false,
      isHideable: !section.required,
      defaultVisible: true,
      order: index + 1,
    };
  });
}

/**
 * Extract supported sections from manifest
 */
export function extractSupportedSections(manifest: TemplateManifest): string[] {
  // Check if manifest has supportedSections array (new format)
  if (manifest.supportedSections && Array.isArray(manifest.supportedSections)) {
    return manifest.supportedSections;
  }

  // Fall back to sections array (old format)
  if (!manifest.sections || manifest.sections.length === 0) {
    return [];
  }

  const sectionTypeMap: Record<string, string> = {
    hero: "HERO",
    candles: "VIRTUAL_CANDLES",
    journey: "TIMELINE",
    timeline: "TIMELINE",
    gallery: "GALLERY",
    tributes: "TRIBUTES",
    condolence: "CONDOLENCES",
    condolences: "CONDOLENCES",
    biography: "BIOGRAPHY",
    family: "FAMILY_TREE",
    video: "VIDEO_GALLERY",
    donations: "DONATIONS",
  };

  return manifest.sections.map((section) => {
    return sectionTypeMap[section.id] || section.id.toUpperCase();
  });
}

/**
 * Clean up template files (remove from filesystem)
 */
export async function cleanupNextJsTemplate(slug: string): Promise<void> {
  const templateDir = path.join(process.cwd(), "src", "app", "templates", slug);
  const publicDir = path.join(process.cwd(), "public", "templates", slug);

  try {
    if (fs.existsSync(templateDir)) {
      await fs.promises.rm(templateDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`Failed to cleanup template directory: ${templateDir}`, error);
  }

  try {
    if (fs.existsSync(publicDir)) {
      await fs.promises.rm(publicDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`Failed to cleanup public directory: ${publicDir}`, error);
  }
}
