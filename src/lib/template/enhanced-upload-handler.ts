/**
 * Enhanced Next.js Template Upload Handler
 * Integrates scaffold generation with template upload processing
 */

import fs from "fs";
import path from "path";
import {
  TemplateScaffoldConfig,
  TemplateSection,
  DesignTokens,
  DEFAULT_DESIGN_TOKENS,
  TemplateManifestJson,
  SECTION_TYPE_MAP,
} from "./types";
import { generateTemplateScaffold, GeneratedFile } from "./scaffold-generator";

export interface EnhancedTemplateResult {
  success: boolean;
  config: TemplateScaffoldConfig;
  generatedFiles: GeneratedFile[];
  errors: string[];
  warnings: string[];
}

/**
 * Process an uploaded template and generate all scaffold files
 */
export async function processTemplateUpload(
  extractedPath: string,
  manifestOverrides?: Partial<TemplateScaffoldConfig>
): Promise<EnhancedTemplateResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Read manifest.json from extracted template
  const manifest = readManifestFromPath(extractedPath);
  if (!manifest) {
    return {
      success: false,
      config: {} as TemplateScaffoldConfig,
      generatedFiles: [],
      errors: ["Could not read or parse manifest.json from uploaded template"],
      warnings: [],
    };
  }

  // Validate manifest
  const validationResult = validateManifest(manifest);
  errors.push(...validationResult.errors);
  warnings.push(...validationResult.warnings);

  if (validationResult.errors.length > 0) {
    return {
      success: false,
      config: {} as TemplateScaffoldConfig,
      generatedFiles: [],
      errors,
      warnings,
    };
  }

  // Read config.ts if it exists to get design tokens
  const designTokens = await readDesignTokensFromConfig(extractedPath);

  // Detect components from uploaded files
  const detectedSections = await detectSectionsFromUpload(extractedPath);

  // Merge manifest sections with detected sections
  const sections = mergeSections(manifest.sections || [], detectedSections);

  // Build scaffold config
  const scaffoldConfig: TemplateScaffoldConfig = {
    name: manifest.name,
    slug: manifest.slug,
    description: manifest.description || `${manifest.name} memorial template`,
    author: manifest.author || "ForeverPages",
    version: manifest.version,
    designTokens: designTokens || DEFAULT_DESIGN_TOKENS,
    sections: sections,
    features: manifest.features,
    preview: manifest.preview || {
      image: `/templates/${manifest.slug}/preview.png`,
      thumbnail: `/templates/${manifest.slug}/thumbnail.png`,
    },
    ...manifestOverrides,
  };

  // Determine which files need to be generated (not already in upload)
  const existingFiles = await listExistingFiles(extractedPath);
  const filesToGenerate = getFilesToGenerate(scaffoldConfig, existingFiles);

  // Generate scaffold files
  const scaffoldResult = generateTemplateScaffold(scaffoldConfig);

  if (!scaffoldResult.success) {
    return {
      success: false,
      config: scaffoldConfig,
      generatedFiles: [],
      errors: [...errors, ...(scaffoldResult.errors || [])],
      warnings: [...warnings, ...(scaffoldResult.warnings || [])],
    };
  }

  // Filter to only include files that don't already exist in upload
  const generatedFiles = scaffoldResult.files.filter((file) => {
    const relativePath = file.path.replace(`src/app/templates/${scaffoldConfig.slug}/`, "");
    return filesToGenerate.includes(relativePath);
  });

  // Always include the MemorialTemplate bridge component
  const memorialTemplateFile = scaffoldResult.files.find((f) =>
    f.path.includes("MemorialTemplate.tsx")
  );
  if (memorialTemplateFile && !generatedFiles.includes(memorialTemplateFile)) {
    generatedFiles.push(memorialTemplateFile);
  }

  // Always include SupportModal if not present
  const supportModalFile = scaffoldResult.files.find((f) => f.path.includes("SupportModal.tsx"));
  if (supportModalFile && !existingFiles.includes("components/SupportModal.tsx")) {
    if (!generatedFiles.includes(supportModalFile)) {
      generatedFiles.push(supportModalFile);
    }
  }

  return {
    success: true,
    config: scaffoldConfig,
    generatedFiles,
    errors,
    warnings: [...warnings, ...(scaffoldResult.warnings || [])],
  };
}

/**
 * Read manifest.json from template path
 */
function readManifestFromPath(templatePath: string): TemplateManifestJson | null {
  try {
    const manifestPath = path.join(templatePath, "manifest.json");
    if (!fs.existsSync(manifestPath)) {
      return null;
    }
    const content = fs.readFileSync(manifestPath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to read manifest:", error);
    return null;
  }
}

/**
 * Validate manifest.json
 */
function validateManifest(manifest: TemplateManifestJson): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!manifest.name) {
    errors.push("manifest.json: 'name' is required");
  }
  if (!manifest.slug) {
    errors.push("manifest.json: 'slug' is required");
  } else {
    // Validate slug format
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.slug)) {
      errors.push("manifest.json: 'slug' must be lowercase alphanumeric with hyphens only");
    }
  }
  if (!manifest.version) {
    warnings.push("manifest.json: 'version' is missing, defaulting to 1.0.0");
  }

  // Optional but recommended
  if (!manifest.description) {
    warnings.push("manifest.json: 'description' is recommended");
  }
  if (!manifest.sections && !manifest.supportedSections) {
    warnings.push("manifest.json: No sections defined, will detect from components");
  }

  return { errors, warnings };
}

/**
 * Read design tokens from config.ts if it exists
 */
async function readDesignTokensFromConfig(templatePath: string): Promise<DesignTokens | null> {
  try {
    const configPath = path.join(templatePath, "config.ts");
    if (!fs.existsSync(configPath)) {
      return null;
    }

    // Read the config file and try to extract defaultDesign
    const content = fs.readFileSync(configPath, "utf-8");

    // Simple regex-based extraction (not perfect but works for standard format)
    const defaultDesignMatch = content.match(
      /defaultDesign\s*:\s*({[\s\S]*?})\s*,?\s*customization/
    );
    if (defaultDesignMatch) {
      try {
        // Create a function to evaluate the design tokens
        // This is a simple approach - in production you might want to use AST parsing
        const evalFn = new Function(`return ${defaultDesignMatch[1]}`);
        return evalFn() as DesignTokens;
      } catch {
        console.warn("Could not parse defaultDesign from config.ts");
      }
    }

    return null;
  } catch (error) {
    console.warn("Failed to read config.ts:", error);
    return null;
  }
}

/**
 * Detect sections from uploaded component files
 */
async function detectSectionsFromUpload(templatePath: string): Promise<TemplateSection[]> {
  const sections: TemplateSection[] = [];
  const componentsPath = path.join(templatePath, "components");

  if (!fs.existsSync(componentsPath)) {
    return sections;
  }

  try {
    const files = fs.readdirSync(componentsPath);

    for (const file of files) {
      if (!file.endsWith(".tsx") && !file.endsWith(".jsx")) continue;

      const componentName = file.replace(/\.(tsx|jsx)$/, "");

      // Skip utility files and modal components
      if (componentName.startsWith("use") || componentName.endsWith("Context")) continue;
      if (componentName === "SupportModal") continue; // We'll generate this
      if (componentName === "BlessingModal") continue; // Modal, not a section
      if (componentName === "Navbar" || componentName === "Footer") continue; // Layout components
      if (componentName === "MusicPlayer") continue; // Utility component

      // Try to determine section type from component name
      const sectionId = componentNameToSectionId(componentName);

      sections.push({
        id: sectionId,
        name: componentNameToDisplayName(componentName),
        component: componentName,
        required: sectionId === "hero", // Hero is typically required
      });
    }
  } catch (error) {
    console.warn("Failed to detect sections:", error);
  }

  return sections;
}

/**
 * Convert component name to section ID
 */
function componentNameToSectionId(componentName: string): string {
  const lowerName = componentName.toLowerCase();

  // Map common component names to section IDs
  const mappings: Record<string, string> = {
    herosection: "hero",
    hero: "hero",
    candlesanctuary: "candles",
    candles: "candles",
    lifejourney: "journey",
    lifesection: "biography",
    timeline: "timeline",
    photogallery: "gallery",
    gallery: "gallery",
    tributesection: "tributes",
    tributes: "tributes",
    tribute: "tributes",
    prayerwall: "tributes",
    condolence: "condolences",
    condolences: "condolences",
    condolencessection: "condolences",
    biography: "biography",
    familytree: "family",
    family: "family",
    videogallery: "video",
    donations: "donations",
    supportsection: "donations",
    support: "donations",
    footer: "footer",
    navigation: "navigation",
    navbar: "navigation",
    musicplayer: "music",
  };

  return mappings[lowerName] || lowerName.replace(/section$/i, "");
}

/**
 * Convert component name to display name
 */
function componentNameToDisplayName(componentName: string): string {
  // Split on uppercase letters and join with spaces
  return componentName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Merge manifest sections with detected sections
 * Deduplicates by both section ID and component name
 */
function mergeSections(
  manifestSections: TemplateSection[],
  detectedSections: TemplateSection[]
): TemplateSection[] {
  if (manifestSections.length > 0) {
    // Use manifest sections as source of truth
    // Deduplicate by both ID and component name
    const manifestIds = new Set(manifestSections.map((s) => s.id));
    const manifestComponents = new Set(manifestSections.map((s) => s.component).filter(Boolean));

    for (const detected of detectedSections) {
      // Skip if already in manifest by ID or component name
      if (manifestIds.has(detected.id)) continue;
      if (detected.component && manifestComponents.has(detected.component)) continue;

      manifestSections.push(detected);
    }

    return manifestSections;
  }

  return detectedSections;
}

/**
 * List files already in the upload
 */
async function listExistingFiles(templatePath: string): Promise<string[]> {
  const files: string[] = [];

  function walkDir(dir: string, prefix = "") {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walkDir(path.join(dir, entry.name), relativePath);
      } else {
        files.push(relativePath);
      }
    }
  }

  walkDir(templatePath);
  return files;
}

/**
 * Determine which files need to be generated
 */
function getFilesToGenerate(config: TemplateScaffoldConfig, existingFiles: string[]): string[] {
  const requiredFiles = [
    "TemplateProvider.tsx",
    "config.ts",
    "types.ts",
    "styles.css",
    "styles.css.d.ts",
    "manifest.json",
    "page.tsx",
    "layout.tsx",
  ];

  // Filter to files not already present
  return requiredFiles.filter((file) => !existingFiles.includes(file));
}

/**
 * Write generated files to the template directory
 */
export async function writeGeneratedFiles(
  templatePath: string,
  files: GeneratedFile[]
): Promise<void> {
  for (const file of files) {
    const filePath = path.join(process.cwd(), file.path);
    const dirPath = path.dirname(filePath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Write file
    fs.writeFileSync(filePath, file.content, "utf-8");
    console.log(`Generated: ${file.path}`);
  }
}

/**
 * Get database section types from manifest
 */
export function getDbSectionTypes(sections: TemplateSection[]): string[] {
  return sections.map((section) => {
    return SECTION_TYPE_MAP[section.id] || section.id.toUpperCase();
  });
}

/**
 * Convert manifest to format expected by GitHub PR creation
 */
export function prepareFilesForPR(
  extractedPath: string,
  scaffoldFiles: GeneratedFile[],
  slug: string
): Array<{ path: string; content: string | Buffer }> {
  const files: Array<{ path: string; content: string | Buffer }> = [];

  // Add scaffold-generated files
  for (const file of scaffoldFiles) {
    files.push({
      path: file.path,
      content: file.content,
    });
  }

  // Add uploaded template files (excluding ones we're generating)
  const generatedPaths = new Set(scaffoldFiles.map((f) => f.path));

  function addUploadedFiles(dir: string, prefix = "") {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      // Skip directories we don't want
      if (["node_modules", ".git", ".next", "dist", "build"].includes(entry.name)) {
        continue;
      }

      const fullPath = path.join(dir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        addUploadedFiles(fullPath, relativePath);
      } else {
        // Determine target path
        let targetPath: string;
        if (relativePath.startsWith("public/")) {
          const publicRelative = relativePath.replace(/^public\//, "");
          targetPath = `public/templates/${slug}/${publicRelative}`;
        } else {
          targetPath = `src/app/templates/${slug}/${relativePath}`;
        }

        // Skip if we're generating this file
        if (generatedPaths.has(targetPath)) {
          continue;
        }

        // Read and add file
        const ext = path.extname(entry.name).toLowerCase();
        const isBinary = [
          ".png",
          ".jpg",
          ".jpeg",
          ".gif",
          ".webp",
          ".ico",
          ".woff",
          ".woff2",
          ".ttf",
          ".eot",
        ].includes(ext);

        if (isBinary) {
          files.push({
            path: targetPath,
            content: fs.readFileSync(fullPath),
          });
        } else {
          files.push({
            path: targetPath,
            content: fs.readFileSync(fullPath, "utf-8"),
          });
        }
      }
    }
  }

  addUploadedFiles(extractedPath);
  return files;
}
