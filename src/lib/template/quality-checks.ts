import fs from "fs";
import path from "path";
import { DetectedComponent } from "./component-scanner";

export type CheckSeverity = "error" | "warning" | "info";

export interface QualityCheck {
  id: string;
  name: string;
  description: string;
  severity: CheckSeverity;
  category: QualityCategory;
}

export interface QualityCheckResult {
  check: QualityCheck;
  passed: boolean;
  message: string;
  details?: string;
  filePath?: string;
  lineNumber?: number;
}

export type QualityCategory =
  | "structure"
  | "components"
  | "accessibility"
  | "performance"
  | "security"
  | "best-practices";

export interface QualityReport {
  templatePath: string;
  timestamp: Date;
  score: number;
  maxScore: number;
  passed: boolean;
  results: QualityCheckResult[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
    passed: number;
  };
}

// Define all quality checks
const QUALITY_CHECKS: QualityCheck[] = [
  // Structure checks
  {
    id: "manifest-exists",
    name: "Manifest File Exists",
    description: "Template must have a manifest.json file",
    severity: "error",
    category: "structure",
  },
  {
    id: "manifest-valid",
    name: "Valid Manifest Format",
    description: "manifest.json must contain required fields (name, slug, version)",
    severity: "error",
    category: "structure",
  },
  {
    id: "components-dir",
    name: "Components Directory",
    description: "Template should have a components directory",
    severity: "warning",
    category: "structure",
  },
  {
    id: "config-exists",
    name: "Config File Exists",
    description: "Template should have a config.ts file with design tokens",
    severity: "warning",
    category: "structure",
  },

  // Component checks
  {
    id: "hero-component",
    name: "Hero Component",
    description: "Template should have a hero/header component",
    severity: "warning",
    category: "components",
  },
  {
    id: "default-exports",
    name: "Default Exports",
    description: "Components should have default exports",
    severity: "warning",
    category: "components",
  },
  {
    id: "typescript-usage",
    name: "TypeScript Usage",
    description: "Components should use TypeScript (.tsx files)",
    severity: "info",
    category: "components",
  },
  {
    id: "props-typing",
    name: "Props Typing",
    description: "Components should have typed props interfaces",
    severity: "info",
    category: "components",
  },

  // Accessibility checks
  {
    id: "alt-text-images",
    name: "Image Alt Text",
    description: "Images should have alt attributes",
    severity: "warning",
    category: "accessibility",
  },
  {
    id: "semantic-html",
    name: "Semantic HTML",
    description: "Template should use semantic HTML elements",
    severity: "info",
    category: "accessibility",
  },
  {
    id: "aria-labels",
    name: "ARIA Labels",
    description: "Interactive elements should have appropriate aria labels",
    severity: "info",
    category: "accessibility",
  },

  // Performance checks
  {
    id: "use-client-directive",
    name: "Use Client Directive",
    description: "Interactive components should have 'use client' directive",
    severity: "warning",
    category: "performance",
  },
  {
    id: "image-optimization",
    name: "Image Optimization",
    description: "Images should use Next.js Image component",
    severity: "info",
    category: "performance",
  },
  {
    id: "no-large-files",
    name: "No Large Files",
    description: "Individual files should not exceed 100KB",
    severity: "warning",
    category: "performance",
  },

  // Security checks
  {
    id: "no-inline-scripts",
    name: "No Inline Scripts",
    description: "Avoid inline scripts for security",
    severity: "warning",
    category: "security",
  },
  {
    id: "no-dangerous-html",
    name: "No Dangerous HTML",
    description: "Avoid dangerouslySetInnerHTML without sanitization",
    severity: "error",
    category: "security",
  },
  {
    id: "no-eval",
    name: "No Eval Usage",
    description: "Avoid using eval() or Function() constructor",
    severity: "error",
    category: "security",
  },

  // Best practices
  {
    id: "use-template-context",
    name: "Template Context Usage",
    description: "Components should use useTemplate hook for data",
    severity: "info",
    category: "best-practices",
  },
  {
    id: "no-hardcoded-text",
    name: "No Hardcoded Text",
    description: "Text should use translations or props for localization",
    severity: "info",
    category: "best-practices",
  },
  {
    id: "consistent-naming",
    name: "Consistent Naming",
    description: "Component names should follow PascalCase convention",
    severity: "info",
    category: "best-practices",
  },
];

/**
 * Run all quality checks on a template
 */
export async function runQualityChecks(
  templatePath: string,
  components?: DetectedComponent[]
): Promise<QualityReport> {
  const results: QualityCheckResult[] = [];
  const startTime = new Date();

  for (const check of QUALITY_CHECKS) {
    const result = await runCheck(check, templatePath, components);
    results.push(result);
  }

  // Calculate score
  const summary = {
    errors: results.filter((r) => !r.passed && r.check.severity === "error").length,
    warnings: results.filter((r) => !r.passed && r.check.severity === "warning").length,
    info: results.filter((r) => !r.passed && r.check.severity === "info").length,
    passed: results.filter((r) => r.passed).length,
  };

  const maxScore = QUALITY_CHECKS.length;
  const score = calculateScore(results);

  return {
    templatePath,
    timestamp: startTime,
    score,
    maxScore,
    passed: summary.errors === 0,
    results,
    summary,
  };
}

/**
 * Run a single quality check
 */
async function runCheck(
  check: QualityCheck,
  templatePath: string,
  components?: DetectedComponent[]
): Promise<QualityCheckResult> {
  try {
    switch (check.id) {
      case "manifest-exists":
        return checkManifestExists(check, templatePath);
      case "manifest-valid":
        return checkManifestValid(check, templatePath);
      case "components-dir":
        return checkComponentsDir(check, templatePath);
      case "config-exists":
        return checkConfigExists(check, templatePath);
      case "hero-component":
        return checkHeroComponent(check, templatePath, components);
      case "default-exports":
        return checkDefaultExports(check, components);
      case "typescript-usage":
        return checkTypescriptUsage(check, templatePath);
      case "props-typing":
        return checkPropsTyping(check, components);
      case "alt-text-images":
        return checkAltTextImages(check, templatePath);
      case "semantic-html":
        return checkSemanticHtml(check, templatePath);
      case "aria-labels":
        return checkAriaLabels(check, templatePath);
      case "use-client-directive":
        return checkUseClientDirective(check, templatePath);
      case "image-optimization":
        return checkImageOptimization(check, templatePath);
      case "no-large-files":
        return checkNoLargeFiles(check, templatePath);
      case "no-inline-scripts":
        return checkNoInlineScripts(check, templatePath);
      case "no-dangerous-html":
        return checkNoDangerousHtml(check, templatePath);
      case "no-eval":
        return checkNoEval(check, templatePath);
      case "use-template-context":
        return checkTemplateContextUsage(check, templatePath);
      case "no-hardcoded-text":
        return checkNoHardcodedText(check, templatePath);
      case "consistent-naming":
        return checkConsistentNaming(check, components);
      default:
        return {
          check,
          passed: true,
          message: "Check not implemented",
        };
    }
  } catch (error) {
    return {
      check,
      passed: false,
      message: `Check failed with error: ${error}`,
    };
  }
}

// Individual check implementations

function checkManifestExists(check: QualityCheck, templatePath: string): QualityCheckResult {
  const manifestPath = path.join(templatePath, "manifest.json");
  const exists = fs.existsSync(manifestPath);
  return {
    check,
    passed: exists,
    message: exists ? "manifest.json found" : "manifest.json not found",
    filePath: manifestPath,
  };
}

function checkManifestValid(check: QualityCheck, templatePath: string): QualityCheckResult {
  const manifestPath = path.join(templatePath, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return { check, passed: false, message: "manifest.json not found" };
  }

  try {
    const content = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(content);
    const hasRequired = manifest.name && manifest.slug && manifest.version;
    return {
      check,
      passed: hasRequired,
      message: hasRequired
        ? "Manifest has all required fields"
        : "Manifest missing required fields (name, slug, or version)",
      filePath: manifestPath,
    };
  } catch {
    return {
      check,
      passed: false,
      message: "Invalid JSON in manifest.json",
      filePath: manifestPath,
    };
  }
}

function checkComponentsDir(check: QualityCheck, templatePath: string): QualityCheckResult {
  const componentsPath = path.join(templatePath, "components");
  const exists = fs.existsSync(componentsPath) && fs.statSync(componentsPath).isDirectory();
  return {
    check,
    passed: exists,
    message: exists ? "Components directory found" : "Components directory not found",
    filePath: componentsPath,
  };
}

function checkConfigExists(check: QualityCheck, templatePath: string): QualityCheckResult {
  const configPath = path.join(templatePath, "config.ts");
  const exists = fs.existsSync(configPath);
  return {
    check,
    passed: exists,
    message: exists ? "config.ts found" : "config.ts not found (will be generated)",
    filePath: configPath,
  };
}

function checkHeroComponent(
  check: QualityCheck,
  templatePath: string,
  components?: DetectedComponent[]
): QualityCheckResult {
  if (components) {
    const hasHero = components.some(
      (c) => c.sectionType === "hero" || c.name.toLowerCase().includes("hero")
    );
    return {
      check,
      passed: hasHero,
      message: hasHero
        ? "Hero component detected"
        : "No hero component found (will use placeholder)",
    };
  }

  // Fall back to file system check
  const componentsPath = path.join(templatePath, "components");
  if (!fs.existsSync(componentsPath)) {
    return { check, passed: false, message: "Components directory not found" };
  }

  const files = fs.readdirSync(componentsPath);
  const hasHero = files.some((f) => f.toLowerCase().includes("hero"));
  return {
    check,
    passed: hasHero,
    message: hasHero
      ? "Hero component file found"
      : "No hero component found (will use placeholder)",
  };
}

function checkDefaultExports(
  check: QualityCheck,
  components?: DetectedComponent[]
): QualityCheckResult {
  if (!components || components.length === 0) {
    return { check, passed: true, message: "No components to check" };
  }

  const withoutDefault = components.filter((c) => !c.hasDefaultExport);
  const allHaveDefault = withoutDefault.length === 0;

  return {
    check,
    passed: allHaveDefault,
    message: allHaveDefault
      ? "All components have default exports"
      : `${withoutDefault.length} component(s) missing default export`,
    details: withoutDefault.map((c) => c.name).join(", "),
  };
}

function checkTypescriptUsage(check: QualityCheck, templatePath: string): QualityCheckResult {
  const componentsPath = path.join(templatePath, "components");
  if (!fs.existsSync(componentsPath)) {
    return { check, passed: true, message: "No components to check" };
  }

  const files = getAllFiles(componentsPath);
  const jsxFiles = files.filter((f) => f.endsWith(".jsx"));
  const tsxFiles = files.filter((f) => f.endsWith(".tsx"));

  const usingTypeScript = jsxFiles.length === 0 || tsxFiles.length > jsxFiles.length;

  return {
    check,
    passed: usingTypeScript,
    message: usingTypeScript
      ? `Using TypeScript (${tsxFiles.length} .tsx files)`
      : `Using JavaScript (${jsxFiles.length} .jsx files) - consider migrating to TypeScript`,
  };
}

function checkPropsTyping(
  check: QualityCheck,
  components?: DetectedComponent[]
): QualityCheckResult {
  if (!components || components.length === 0) {
    return { check, passed: true, message: "No components to check" };
  }

  const withTypedProps = components.filter((c) => c.props.length > 0);
  const ratio = withTypedProps.length / components.length;

  return {
    check,
    passed: ratio >= 0.5,
    message: `${withTypedProps.length}/${components.length} components have typed props`,
  };
}

function checkAltTextImages(check: QualityCheck, templatePath: string): QualityCheckResult {
  const files = getAllFiles(templatePath).filter((f) => f.endsWith(".tsx") || f.endsWith(".jsx"));

  let imagesWithoutAlt = 0;
  let totalImages = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    // Simple regex to find img tags without alt
    const imgTags = content.match(/<img[^>]*>/gi) || [];
    totalImages += imgTags.length;

    for (const tag of imgTags) {
      if (!tag.includes("alt=") && !tag.includes("alt =")) {
        imagesWithoutAlt++;
      }
    }
  }

  return {
    check,
    passed: imagesWithoutAlt === 0,
    message:
      imagesWithoutAlt === 0
        ? `All ${totalImages} images have alt text`
        : `${imagesWithoutAlt}/${totalImages} images missing alt text`,
  };
}

function checkSemanticHtml(check: QualityCheck, templatePath: string): QualityCheckResult {
  const files = getAllFiles(templatePath).filter((f) => f.endsWith(".tsx") || f.endsWith(".jsx"));

  const semanticElements = ["header", "footer", "main", "nav", "section", "article", "aside"];
  let foundSemantic = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    for (const elem of semanticElements) {
      if (
        content.includes(`<${elem}`) ||
        content.includes(`<${elem.charAt(0).toUpperCase()}${elem.slice(1)}`)
      ) {
        foundSemantic++;
      }
    }
  }

  return {
    check,
    passed: foundSemantic >= 2,
    message: `Found ${foundSemantic} semantic HTML elements`,
  };
}

function checkAriaLabels(check: QualityCheck, templatePath: string): QualityCheckResult {
  const files = getAllFiles(templatePath).filter((f) => f.endsWith(".tsx") || f.endsWith(".jsx"));

  let hasAria = false;
  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    if (content.includes("aria-") || content.includes("role=")) {
      hasAria = true;
      break;
    }
  }

  return {
    check,
    passed: hasAria,
    message: hasAria
      ? "ARIA attributes found"
      : "Consider adding ARIA labels for better accessibility",
  };
}

function checkUseClientDirective(check: QualityCheck, templatePath: string): QualityCheckResult {
  const files = getAllFiles(templatePath).filter((f) => f.endsWith(".tsx") || f.endsWith(".jsx"));

  let interactiveWithoutDirective = 0;
  const interactivePatterns = ["onClick", "onChange", "useState", "useEffect", "useRef"];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const hasInteractive = interactivePatterns.some((p) => content.includes(p));
    const hasUseClient = content.includes('"use client"') || content.includes("'use client'");

    if (hasInteractive && !hasUseClient) {
      interactiveWithoutDirective++;
    }
  }

  return {
    check,
    passed: interactiveWithoutDirective === 0,
    message:
      interactiveWithoutDirective === 0
        ? "All interactive components have 'use client'"
        : `${interactiveWithoutDirective} interactive component(s) missing 'use client'`,
  };
}

function checkImageOptimization(check: QualityCheck, templatePath: string): QualityCheckResult {
  const files = getAllFiles(templatePath).filter((f) => f.endsWith(".tsx") || f.endsWith(".jsx"));

  let htmlImgTags = 0;
  let nextImages = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    htmlImgTags += (content.match(/<img[^>]*>/gi) || []).length;
    nextImages += (content.match(/<Image[^>]*>/gi) || []).length;
    if (content.includes("from 'next/image'") || content.includes('from "next/image"')) {
      nextImages += (content.match(/<Image/g) || []).length;
    }
  }

  return {
    check,
    passed: nextImages >= htmlImgTags,
    message:
      nextImages >= htmlImgTags
        ? `Using Next.js Image component (${nextImages} instances)`
        : `Consider using Next.js Image component (${htmlImgTags} <img> tags found)`,
  };
}

function checkNoLargeFiles(check: QualityCheck, templatePath: string): QualityCheckResult {
  const files = getAllFiles(templatePath);
  const largeFiles: string[] = [];
  const maxSize = 100 * 1024; // 100KB

  for (const file of files) {
    const stats = fs.statSync(file);
    if (stats.size > maxSize) {
      largeFiles.push(path.relative(templatePath, file));
    }
  }

  return {
    check,
    passed: largeFiles.length === 0,
    message:
      largeFiles.length === 0
        ? "All files are under 100KB"
        : `${largeFiles.length} file(s) exceed 100KB`,
    details: largeFiles.join(", "),
  };
}

function checkNoInlineScripts(check: QualityCheck, templatePath: string): QualityCheckResult {
  const files = getAllFiles(templatePath).filter((f) => f.endsWith(".tsx") || f.endsWith(".jsx"));

  let hasInlineScript = false;
  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    // Check for script tags with inline content (excluding dynamic imports)
    if (/<script[^>]*>[\s\S]*<\/script>/i.test(content)) {
      hasInlineScript = true;
      break;
    }
  }

  return {
    check,
    passed: !hasInlineScript,
    message: hasInlineScript
      ? "Inline scripts detected - consider using Next.js Script component"
      : "No inline scripts found",
  };
}

function checkNoDangerousHtml(check: QualityCheck, templatePath: string): QualityCheckResult {
  const files = getAllFiles(templatePath).filter((f) => f.endsWith(".tsx") || f.endsWith(".jsx"));

  const filesWithDangerous: string[] = [];
  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    if (content.includes("dangerouslySetInnerHTML")) {
      filesWithDangerous.push(path.relative(templatePath, file));
    }
  }

  return {
    check,
    passed: filesWithDangerous.length === 0,
    message:
      filesWithDangerous.length === 0
        ? "No dangerouslySetInnerHTML usage"
        : `dangerouslySetInnerHTML found in ${filesWithDangerous.length} file(s) - ensure content is sanitized`,
    details: filesWithDangerous.join(", "),
  };
}

function checkNoEval(check: QualityCheck, templatePath: string): QualityCheckResult {
  const files = getAllFiles(templatePath).filter(
    (f) => f.endsWith(".tsx") || f.endsWith(".jsx") || f.endsWith(".ts") || f.endsWith(".js")
  );

  const filesWithEval: string[] = [];
  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    if (/\beval\s*\(/.test(content) || /new\s+Function\s*\(/.test(content)) {
      filesWithEval.push(path.relative(templatePath, file));
    }
  }

  return {
    check,
    passed: filesWithEval.length === 0,
    message:
      filesWithEval.length === 0
        ? "No eval() or Function() usage"
        : `eval() or Function() found in ${filesWithEval.length} file(s)`,
    details: filesWithEval.join(", "),
  };
}

function checkTemplateContextUsage(check: QualityCheck, templatePath: string): QualityCheckResult {
  const files = getAllFiles(templatePath).filter((f) => f.endsWith(".tsx") || f.endsWith(".jsx"));

  let usesContext = false;
  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    if (content.includes("useTemplate") || content.includes("TemplateProvider")) {
      usesContext = true;
      break;
    }
  }

  return {
    check,
    passed: usesContext,
    message: usesContext
      ? "Template context usage detected"
      : "Consider using useTemplate hook for memorial data",
  };
}

function checkNoHardcodedText(check: QualityCheck, templatePath: string): QualityCheckResult {
  // This is a best-effort check - can't be 100% accurate
  const files = getAllFiles(templatePath).filter((f) => f.endsWith(".tsx") || f.endsWith(".jsx"));

  let hasTranslations = false;
  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    if (content.includes("useTranslations") || content.includes("t(")) {
      hasTranslations = true;
      break;
    }
  }

  return {
    check,
    passed: true, // Don't fail on this, just inform
    message: hasTranslations
      ? "Translation hooks detected"
      : "Consider using translations for localization support",
  };
}

function checkConsistentNaming(
  check: QualityCheck,
  components?: DetectedComponent[]
): QualityCheckResult {
  if (!components || components.length === 0) {
    return { check, passed: true, message: "No components to check" };
  }

  const invalidNames = components.filter((c) => !/^[A-Z][a-zA-Z0-9]*$/.test(c.name));

  return {
    check,
    passed: invalidNames.length === 0,
    message:
      invalidNames.length === 0
        ? "All component names follow PascalCase convention"
        : `${invalidNames.length} component(s) don't follow PascalCase`,
    details: invalidNames.map((c) => c.name).join(", "),
  };
}

// Helper functions

function getAllFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", ".git", ".next", "dist", "build"].includes(entry.name)) {
        files.push(...getAllFiles(fullPath));
      }
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function calculateScore(results: QualityCheckResult[]): number {
  let score = 0;
  for (const result of results) {
    if (result.passed) {
      switch (result.check.severity) {
        case "error":
          score += 3;
          break;
        case "warning":
          score += 2;
          break;
        case "info":
          score += 1;
          break;
      }
    }
  }
  return score;
}

const qualityChecks = {
  runQualityChecks,
  QUALITY_CHECKS,
};

export default qualityChecks;
