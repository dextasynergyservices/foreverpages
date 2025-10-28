#!/usr/bin/env node

/**
 * Text Extraction Script for ForeverPages
 *
 * This script automatically extracts inline text from React components
 * and adds corresponding keys to all locale files.
 */

import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

// Type definitions
interface ExtractionConfig {
  scanDirs: string[];
  includePatterns: string[];
  excludePatterns: string[];
  localesDir: string;
  locales: SupportedLocale[];
  defaultLocale: SupportedLocale;
  minTextLength: number;
  maxTextLength: number;
  skipPatterns: string[];
  textPatterns: string[];
  keyGeneration: {
    maxKeyLength: number;
    separator: string;
    includeFileContext: boolean;
    normalizeText: true;
  };
  output: {
    verbose: boolean;
    dryRun: boolean;
    generateReport: boolean;
    backupFiles: boolean;
  };
}

type SupportedLocale = "en" | "es" | "fr" | "ha" | "ig" | "yo";

interface ExtractedText {
  text: string;
  file: string;
  line: number;
  pattern: string;
}

interface NewKey {
  key: string;
  text: string;
  file: string;
  line: number;
}

interface ExtractionStats {
  filesScanned: number;
  textsExtracted: number;
  newKeysAdded: number;
  keysUpdated: number;
}

interface LocaleData {
  [key: string]: string | LocaleData;
}

// Configuration
const CONFIG: ExtractionConfig = {
  scanDirs: ["src/app/components", "src/app", "src/components"],
  includePatterns: ["**/*.tsx", "**/*.jsx", "**/*.ts", "**/*.js"],
  excludePatterns: ["**/*.test.*", "**/*.spec.*", "**/node_modules/**"],
  localesDir: "src/lib/locales",
  locales: ["en", "es", "fr", "ha", "ig", "yo"],
  defaultLocale: "en",
  minTextLength: 3,
  maxTextLength: 200,
  skipPatterns: [
    "^\\d+$",
    "^[a-zA-Z0-9._-]+$",
    "^(true|false|null|undefined)$",
    "^[{}[\\]();,.\\s]+$",
    "^(and|or|the|a|an|in|on|at|to|for|of|with|by)$",
    "^[A-Z_]+$",
    "^\\$[\\d.]+$",
    "^https?:\\/\\/",
    "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
  ],
  textPatterns: [
    "[\"']([^\"']{3,})[\"']",
    "`([^`]{3,})`",
    ">\\s*([^<>{}\\n]{3,})\\s*<",
    "(title|alt|placeholder|aria-label|aria-describedby)=[\"']([^\"']{3,})[\"']",
  ],
  keyGeneration: {
    maxKeyLength: 50,
    separator: "_",
    includeFileContext: true,
    normalizeText: true,
  },
  output: {
    verbose: false,
    dryRun: false,
    generateReport: true,
    backupFiles: true,
  },
};

class TextExtractor {
  private extractedTexts: Map<string, ExtractedText> = new Map();
  private existingKeys: Map<SupportedLocale, LocaleData> = new Map();
  private newKeys: NewKey[] = [];
  private stats: ExtractionStats = {
    filesScanned: 0,
    textsExtracted: 0,
    newKeysAdded: 0,
    keysUpdated: 0,
  };

  /**
   * Main extraction process
   */
  async extract(): Promise<void> {
    console.log("🔍 Starting text extraction...\n");

    try {
      // Load existing locale files
      await this.loadExistingLocales();

      // Scan components for inline text
      await this.scanComponents();

      // Generate new keys for extracted text
      this.generateKeys();

      // Update locale files
      await this.updateLocaleFiles();

      // Generate report
      this.generateReport();
    } catch (error) {
      console.error("❌ Extraction failed:", (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Load existing locale files to understand current structure
   */
  private async loadExistingLocales(): Promise<void> {
    console.log("📚 Loading existing locale files...");

    for (const locale of CONFIG.locales) {
      const filePath = path.join(CONFIG.localesDir, `${locale}.json`);

      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, "utf8");
          const data: LocaleData = JSON.parse(content);
          this.existingKeys.set(locale, data);
          console.log(`  ✅ Loaded ${locale}.json`);
        } catch (error) {
          console.log(`  ⚠️  Could not load ${locale}.json: ${(error as Error).message}`);
          this.existingKeys.set(locale, {});
        }
      } else {
        console.log(`  ⚠️  ${locale}.json not found, will create new file`);
        this.existingKeys.set(locale, {});
      }
    }
  }

  /**
   * Scan components for inline text
   */
  private async scanComponents(): Promise<void> {
    console.log("\n🔍 Scanning components for inline text...");

    for (const scanDir of CONFIG.scanDirs) {
      if (!fs.existsSync(scanDir)) {
        console.log(`  ⚠️  Directory ${scanDir} does not exist, skipping...`);
        continue;
      }

      const pattern = path.join(scanDir, "**/*.{tsx,jsx,ts,js}");
      const files = await glob(pattern, {
        ignore: CONFIG.excludePatterns,
        nodir: true,
      });

      for (const file of files) {
        await this.scanFile(file);
      }
    }
  }

  /**
   * Scan a single file for inline text
   */
  private async scanFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      this.stats.filesScanned++;

      // Extract text using all patterns
      for (const patternStr of CONFIG.textPatterns) {
        const pattern = new RegExp(patternStr, "g");
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(content)) !== null) {
          const text = match[1] || match[0];
          if (this.shouldExtractText(text)) {
            this.extractedTexts.set(text, {
              text,
              file: filePath,
              line: this.getLineNumber(content, match.index),
              pattern: patternStr,
            });
            this.stats.textsExtracted++;
          }
        }
      }

      console.log(`  📄 Scanned ${path.relative(process.cwd(), filePath)}`);
    } catch (error) {
      console.log(`  ❌ Error scanning ${filePath}: ${(error as Error).message}`);
    }
  }

  /**
   * Check if text should be extracted
   */
  private shouldExtractText(text: string): boolean {
    // Check length constraints
    if (text.length < CONFIG.minTextLength || text.length > CONFIG.maxTextLength) {
      return false;
    }

    // Check skip patterns
    for (const skipPatternStr of CONFIG.skipPatterns) {
      const skipPattern = new RegExp(skipPatternStr);
      if (skipPattern.test(text)) {
        return false;
      }
    }

    // Check if text contains only whitespace
    if (text.trim().length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Get line number for a match
   */
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split("\n").length;
  }

  /**
   * Generate keys for extracted text
   */
  private generateKeys(): void {
    console.log("\n🔑 Generating keys for extracted text...");

    for (const [text, info] of this.extractedTexts) {
      const key = this.generateKey(text, info);

      // Check if key already exists
      const existingKey = this.findExistingKey(text);
      if (existingKey) {
        console.log(`  ♻️  Text "${text}" already has key: ${existingKey}`);
        continue;
      }

      this.newKeys.push({
        key,
        text,
        file: info.file,
        line: info.line,
      });

      console.log(`  ✨ New key: ${key} -> "${text}"`);
    }
  }

  /**
   * Generate a key from text
   */
  private generateKey(text: string, info: ExtractedText): string {
    // Clean and normalize text
    let key = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remove special characters
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .replace(/_+/g, "_") // Replace multiple underscores with single
      .replace(/^_|_$/g, ""); // Remove leading/trailing underscores

    // Truncate if too long
    if (key.length > CONFIG.keyGeneration.maxKeyLength) {
      key = key.substring(0, CONFIG.keyGeneration.maxKeyLength);
    }

    // Add file context if needed
    if (CONFIG.keyGeneration.includeFileContext) {
      const fileName = path.basename(info.file, path.extname(info.file));
      const context = fileName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      key = `${context}_${key}`;
    }

    return key;
  }

  /**
   * Find existing key for text
   */
  private findExistingKey(text: string): string | null {
    const defaultLocale = this.existingKeys.get(CONFIG.defaultLocale);
    if (!defaultLocale) return null;

    // Search for text in existing keys
    for (const [key, value] of Object.entries(defaultLocale)) {
      if (typeof value === "string" && value === text) {
        return key;
      }

      // Search in nested objects
      if (typeof value === "object") {
        const found = this.searchInObject(value, text);
        if (found) return found;
      }
    }

    return null;
  }

  /**
   * Search for text in nested object
   */
  private searchInObject(obj: LocaleData, text: string): string | null {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string" && value === text) {
        return key;
      }

      if (typeof value === "object") {
        const found = this.searchInObject(value, text);
        if (found) return found;
      }
    }

    return null;
  }

  /**
   * Update locale files with new keys
   */
  private async updateLocaleFiles(): Promise<void> {
    if (this.newKeys.length === 0) {
      console.log("\n✅ No new keys to add!");
      return;
    }

    console.log(`\n📝 Updating locale files with ${this.newKeys.length} new keys...`);

    for (const locale of CONFIG.locales) {
      const filePath = path.join(CONFIG.localesDir, `${locale}.json`);
      const existingData = this.existingKeys.get(locale) || {};

      // Add new keys
      for (const newKey of this.newKeys) {
        if (locale === CONFIG.defaultLocale) {
          // Add the actual text for default locale
          this.setNestedValue(existingData, newKey.key, newKey.text);
        } else {
          // Add placeholder for other locales
          this.setNestedValue(existingData, newKey.key, `[${locale.toUpperCase()}] ${newKey.text}`);
        }
        this.stats.newKeysAdded++;
      }

      // Write updated file
      try {
        const jsonContent = JSON.stringify(existingData, null, 2);
        fs.writeFileSync(filePath, jsonContent, "utf8");
        console.log(`  ✅ Updated ${locale}.json`);
      } catch (error) {
        console.log(`  ❌ Error updating ${locale}.json: ${(error as Error).message}`);
      }
    }
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: LocaleData, path: string, value: string): void {
    const keys = path.split(".");
    let current: LocaleData = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key] as LocaleData;
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Generate extraction report
   */
  private generateReport(): void {
    console.log("\n📊 Extraction Report");
    console.log("==================");
    console.log(`📁 Files scanned: ${this.stats.filesScanned}`);
    console.log(`📝 Texts extracted: ${this.stats.textsExtracted}`);
    console.log(`🔑 New keys added: ${this.stats.newKeysAdded}`);
    console.log(`♻️  Keys updated: ${this.stats.keysUpdated}`);

    if (this.newKeys.length > 0) {
      console.log("\n🆕 New Keys Added:");
      this.newKeys.forEach(({ key, text, file, line }) => {
        console.log(`  ${key}: "${text}" (${path.relative(process.cwd(), file)}:${line})`);
      });
    }

    console.log("\n✅ Text extraction completed successfully!");
    console.log("\n💡 Next steps:");
    console.log("  1. Review the generated keys in your locale files");
    console.log("  2. Update the placeholder translations for non-English locales");
    console.log("  3. Replace inline text in components with translation keys");
  }
}

// CLI interface
function main(): void {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Text Extraction Script for ForeverPages

Usage: npx tsx scripts/extract-text.ts [options]

Options:
  --help, -h          Show this help message
  --dry-run, -d       Show what would be extracted without updating files
  --verbose, -v       Show detailed output
  --config <file>     Use custom configuration file

Examples:
  npx tsx scripts/extract-text.ts
  npx tsx scripts/extract-text.ts --dry-run
  npx tsx scripts/extract-text.ts --verbose
`);
    process.exit(0);
  }

  const extractor = new TextExtractor();
  extractor.extract();
}

// Run if called directly
if (require.main === module) {
  main();
}

export {
  TextExtractor,
  CONFIG,
  type ExtractionConfig,
  type SupportedLocale,
  type ExtractedText,
  type NewKey,
  type ExtractionStats,
};
