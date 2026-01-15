import fs from "fs";
import path from "path";

export interface DetectedComponent {
  name: string;
  filePath: string;
  type: "functional" | "class" | "unknown";
  hasDefaultExport: boolean;
  exports: string[];
  dependencies: string[];
  hooks: string[];
  props: PropDefinition[];
  sectionType: SectionType | null;
  isLayout: boolean;
}

export interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
}

export type SectionType =
  | "hero"
  | "gallery"
  | "timeline"
  | "tributes"
  | "candles"
  | "condolence"
  | "biography"
  | "family"
  | "video"
  | "navigation"
  | "footer"
  | "donations"
  | "unknown";

export interface ComponentScanResult {
  components: DetectedComponent[];
  mainLayout: DetectedComponent | null;
  pageComponent: DetectedComponent | null;
  sections: DetectedComponent[];
  utilities: DetectedComponent[];
  warnings: string[];
  errors: string[];
}

// Section keyword mappings for automatic detection
const SECTION_KEYWORDS: Record<SectionType, string[]> = {
  hero: ["hero", "header", "banner", "splash", "cover"],
  gallery: ["gallery", "photo", "photos", "images", "media"],
  timeline: ["timeline", "journey", "life", "milestones", "history"],
  tributes: ["tribute", "tributes", "memories", "memory", "stories"],
  candles: ["candle", "candles", "sanctuary", "light", "memorial"],
  condolence: ["condolence", "condolences", "sympathy", "messages"],
  biography: ["bio", "biography", "about", "story"],
  family: ["family", "tree", "relatives", "genealogy"],
  video: ["video", "videos", "media", "player"],
  navigation: ["nav", "navigation", "menu", "header"],
  footer: ["footer", "bottom", "foot"],
  donations: ["donation", "support", "give", "contribute"],
  unknown: [],
};

/**
 * Scan a directory for React components
 */
export async function scanComponents(templatePath: string): Promise<ComponentScanResult> {
  const result: ComponentScanResult = {
    components: [],
    mainLayout: null,
    pageComponent: null,
    sections: [],
    utilities: [],
    warnings: [],
    errors: [],
  };

  try {
    // Scan components directory
    const componentsPath = path.join(templatePath, "components");
    if (fs.existsSync(componentsPath)) {
      await scanDirectory(componentsPath, result, templatePath);
    }

    // Scan root directory for layout and page
    const rootFiles = fs.readdirSync(templatePath);
    for (const file of rootFiles) {
      if (file.endsWith(".tsx") || file.endsWith(".jsx")) {
        const filePath = path.join(templatePath, file);
        const component = await analyzeComponent(filePath, templatePath);
        if (component) {
          result.components.push(component);

          // Identify special components
          if (file.toLowerCase().includes("layout") || component.name === "Layout") {
            result.mainLayout = component;
            component.isLayout = true;
          } else if (file.toLowerCase().includes("page") || component.name === "Page") {
            result.pageComponent = component;
          }
        }
      }
    }

    // Categorize components
    categorizeComponents(result);

    // Validate component structure
    validateComponents(result);
  } catch (error) {
    result.errors.push(`Failed to scan components: ${error}`);
  }

  return result;
}

/**
 * Recursively scan a directory for components
 */
async function scanDirectory(
  dirPath: string,
  result: ComponentScanResult,
  rootPath: string
): Promise<void> {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Skip certain directories
      if (!["__tests__", "test", "tests", "node_modules"].includes(entry.name)) {
        await scanDirectory(fullPath, result, rootPath);
      }
    } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".jsx")) {
      const component = await analyzeComponent(fullPath, rootPath);
      if (component) {
        result.components.push(component);
      }
    }
  }
}

/**
 * Analyze a single component file
 */
async function analyzeComponent(
  filePath: string,
  rootPath: string
): Promise<DetectedComponent | null> {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const fileName = path.basename(filePath, path.extname(filePath));
    const relativePath = path.relative(rootPath, filePath);

    // Skip utility files
    if (
      fileName.startsWith("use") ||
      fileName.endsWith("Context") ||
      fileName.endsWith("Provider") ||
      fileName === "index" ||
      fileName.startsWith("_")
    ) {
      return null;
    }

    const component: DetectedComponent = {
      name: fileName,
      filePath: relativePath,
      type: detectComponentType(content),
      hasDefaultExport: hasDefaultExport(content),
      exports: extractExports(content),
      dependencies: extractDependencies(content),
      hooks: extractHooks(content),
      props: extractProps(content, fileName),
      sectionType: detectSectionType(fileName, content),
      isLayout: false,
    };

    return component;
  } catch (error) {
    console.warn(`Failed to analyze component at ${filePath}:`, error);
    return null;
  }
}

/**
 * Detect if component is functional or class-based
 */
function detectComponentType(content: string): "functional" | "class" | "unknown" {
  // Check for class component
  if (
    /class\s+\w+\s+extends\s+(React\.Component|Component|React\.PureComponent|PureComponent)/i.test(
      content
    )
  ) {
    return "class";
  }

  // Check for functional component patterns
  const functionalPatterns = [
    /export\s+(default\s+)?function\s+\w+/,
    /const\s+\w+\s*:\s*React\.FC/,
    /const\s+\w+\s*=\s*\([^)]*\)\s*=>/,
    /const\s+\w+\s*=\s*function/,
    /export\s+const\s+\w+/,
  ];

  if (functionalPatterns.some((pattern) => pattern.test(content))) {
    return "functional";
  }

  return "unknown";
}

/**
 * Check if file has default export
 */
function hasDefaultExport(content: string): boolean {
  return /export\s+default/.test(content) || /export\s*{\s*\w+\s+as\s+default\s*}/.test(content);
}

/**
 * Extract all named exports
 */
function extractExports(content: string): string[] {
  const exports: string[] = [];

  // Named exports: export const/function/class Name
  const namedExportPattern = /export\s+(const|function|class|type|interface)\s+(\w+)/g;
  let match;
  while ((match = namedExportPattern.exec(content)) !== null) {
    exports.push(match[2]);
  }

  // Export list: export { name1, name2 }
  const exportListPattern = /export\s*{\s*([^}]+)\s*}/g;
  while ((match = exportListPattern.exec(content)) !== null) {
    const names = match[1].split(",").map((n) => n.trim().split(" ")[0]);
    exports.push(...names.filter((n) => n && n !== "default"));
  }

  return [...new Set(exports)];
}

/**
 * Extract dependencies/imports
 */
function extractDependencies(content: string): string[] {
  const dependencies: string[] = [];
  const importPattern = /import\s+(?:[\w{}\s,*]+\s+from\s+)?['"]([^'"]+)['"]/g;

  let match;
  while ((match = importPattern.exec(content)) !== null) {
    dependencies.push(match[1]);
  }

  return [...new Set(dependencies)];
}

/**
 * Extract React hooks used in component
 */
function extractHooks(content: string): string[] {
  const hooks: string[] = [];
  const hookPattern = /\b(use[A-Z]\w+)\s*\(/g;

  let match;
  while ((match = hookPattern.exec(content)) !== null) {
    hooks.push(match[1]);
  }

  return [...new Set(hooks)];
}

/**
 * Extract props from component definition
 */
function extractProps(content: string, componentName: string): PropDefinition[] {
  const props: PropDefinition[] = [];

  // Try to find interface/type definition for props
  const propsInterfacePattern = new RegExp(`interface\\s+${componentName}Props\\s*{([^}]+)}`, "s");
  const propsTypePattern = new RegExp(`type\\s+${componentName}Props\\s*=\\s*{([^}]+)}`, "s");

  let propsMatch = content.match(propsInterfacePattern);
  if (!propsMatch) {
    propsMatch = content.match(propsTypePattern);
  }

  if (propsMatch) {
    const propsContent = propsMatch[1];
    const propLines = propsContent.split("\n");

    for (const line of propLines) {
      const propMatch = line.trim().match(/^(\w+)(\?)?:\s*(.+?)(;|$)/);
      if (propMatch) {
        props.push({
          name: propMatch[1],
          required: !propMatch[2],
          type: propMatch[3].trim(),
        });
      }
    }
  }

  // If no interface found, try to detect from destructuring
  if (props.length === 0) {
    const destructurePattern = /\(\s*{\s*([^}]+)\s*}\s*(?::\s*\w+)?\s*\)/;
    const destructureMatch = content.match(destructurePattern);
    if (destructureMatch) {
      const destructured = destructureMatch[1]
        .split(",")
        .map((p) => p.trim().split("=")[0].trim())
        .filter((p) => p);

      for (const prop of destructured) {
        props.push({
          name: prop,
          required: true,
          type: "unknown",
        });
      }
    }
  }

  return props;
}

/**
 * Detect section type from component name and content
 */
function detectSectionType(componentName: string, content: string): SectionType | null {
  const lowerName = componentName.toLowerCase();
  const lowerContent = content.toLowerCase();

  for (const [sectionType, keywords] of Object.entries(SECTION_KEYWORDS)) {
    if (sectionType === "unknown") continue;

    for (const keyword of keywords) {
      if (lowerName.includes(keyword) || lowerContent.includes(keyword)) {
        return sectionType as SectionType;
      }
    }
  }

  return null;
}

/**
 * Categorize components into sections and utilities
 */
function categorizeComponents(result: ComponentScanResult): void {
  for (const component of result.components) {
    if (component.isLayout || component === result.pageComponent) {
      continue;
    }

    if (component.sectionType && component.sectionType !== "unknown") {
      result.sections.push(component);
    } else if (
      component.name.startsWith("use") ||
      component.name.endsWith("Context") ||
      component.name.endsWith("Provider") ||
      !component.hasDefaultExport
    ) {
      result.utilities.push(component);
    } else if (component.props.length > 0 || hasJSXReturn(component.filePath)) {
      // Likely a section component
      result.sections.push(component);
    } else {
      result.utilities.push(component);
    }
  }
}

/**
 * Check if a file has JSX return (basic check)
 */
function hasJSXReturn(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return /<[A-Z]/.test(content) || /return\s*\(/.test(content);
  } catch {
    return false;
  }
}

/**
 * Validate component structure and add warnings
 */
function validateComponents(result: ComponentScanResult): void {
  // Check for missing default exports
  for (const component of result.sections) {
    if (!component.hasDefaultExport) {
      result.warnings.push(
        `Component "${component.name}" has no default export, which may cause import issues.`
      );
    }
  }

  // Check for duplicate section types
  const sectionTypes = new Map<SectionType, string[]>();
  for (const section of result.sections) {
    if (section.sectionType) {
      const existing = sectionTypes.get(section.sectionType) || [];
      existing.push(section.name);
      sectionTypes.set(section.sectionType, existing);
    }
  }

  for (const [type, components] of sectionTypes) {
    if (components.length > 1) {
      result.warnings.push(
        `Multiple components detected for "${type}" section: ${components.join(", ")}. Only one will be used.`
      );
    }
  }

  // Check for required sections
  const requiredSections: SectionType[] = ["hero"];
  for (const required of requiredSections) {
    const hasSection = result.sections.some((s) => s.sectionType === required);
    if (!hasSection) {
      result.warnings.push(
        `Missing recommended section: "${required}". A placeholder will be generated.`
      );
    }
  }

  // Check for potential issues
  if (!result.mainLayout) {
    result.warnings.push("No layout component detected. A default layout will be generated.");
  }

  if (result.sections.length === 0) {
    result.errors.push(
      "No section components detected. Please ensure your template has at least one section component."
    );
  }
}

/**
 * Generate section configuration from scanned components
 */
export function generateSectionConfig(scanResult: ComponentScanResult): Array<{
  id: string;
  name: string;
  component: string;
  required: boolean;
}> {
  return scanResult.sections
    .filter((s) => s.sectionType && s.sectionType !== "unknown")
    .map((section) => ({
      id: section.sectionType as string,
      name: formatSectionName(section.sectionType as string),
      component: section.name,
      required: section.sectionType === "hero",
    }));
}

/**
 * Format section type to display name
 */
function formatSectionName(sectionType: string): string {
  const nameMap: Record<string, string> = {
    hero: "Hero Section",
    gallery: "Photo Gallery",
    timeline: "Life Journey",
    tributes: "Tributes & Memories",
    candles: "Candle Sanctuary",
    condolence: "Condolences",
    biography: "Biography",
    family: "Family Tree",
    video: "Video Gallery",
    navigation: "Navigation",
    footer: "Footer",
    donations: "Support & Donations",
  };

  return nameMap[sectionType] || sectionType.charAt(0).toUpperCase() + sectionType.slice(1);
}

/**
 * Analyze import dependencies between components
 */
export function analyzeComponentDependencies(
  components: DetectedComponent[]
): Map<string, string[]> {
  const dependencies = new Map<string, string[]>();

  const componentNames = new Set(components.map((c) => c.name));

  for (const component of components) {
    const componentDeps: string[] = [];

    for (const dep of component.dependencies) {
      // Check if this is a relative import to another component
      if (dep.startsWith("./") || dep.startsWith("../")) {
        const depName = path.basename(dep).replace(/\.(tsx|jsx|ts|js)$/, "");
        if (componentNames.has(depName)) {
          componentDeps.push(depName);
        }
      }
    }

    dependencies.set(component.name, componentDeps);
  }

  return dependencies;
}

const componentScanner = {
  scanComponents,
  generateSectionConfig,
  analyzeComponentDependencies,
};

export default componentScanner;
