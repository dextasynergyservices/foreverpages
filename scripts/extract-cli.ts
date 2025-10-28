#!/usr/bin/env node

/**
 * CLI Wrapper for Text Extraction Script
 *
 * Provides a user-friendly interface for the text extraction process.
 */

import { TextExtractor, type ExtractionConfig } from "./extract-text";
import * as fs from "fs";
import * as path from "path";

interface CLIArgs {
  help: boolean;
  dryRun: boolean;
  verbose: boolean;
  config: string | null;
  interactive: boolean;
}

class TextExtractionCLI {
  private config: ExtractionConfig;
  private args: CLIArgs;

  constructor() {
    this.config = this.loadConfig();
    this.args = this.parseArgs();
  }

  /**
   * Load configuration from file or use defaults
   */
  private loadConfig(): ExtractionConfig {
    const configPath = path.join(__dirname, "extract-config.json");

    if (fs.existsSync(configPath)) {
      try {
        const configContent = fs.readFileSync(configPath, "utf8");
        return JSON.parse(configContent) as ExtractionConfig;
      } catch {
        console.log("⚠️  Could not load config file, using defaults");
      }
    }

    return this.getDefaultConfig();
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): ExtractionConfig {
    return {
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
  }

  /**
   * Parse command line arguments
   */
  private parseArgs(): CLIArgs {
    const args = process.argv.slice(2);
    const parsed: CLIArgs = {
      help: false,
      dryRun: false,
      verbose: false,
      config: null,
      interactive: false,
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case "--help":
        case "-h":
          parsed.help = true;
          break;
        case "--dry-run":
        case "-d":
          parsed.dryRun = true;
          break;
        case "--verbose":
        case "-v":
          parsed.verbose = true;
          break;
        case "--interactive":
        case "-i":
          parsed.interactive = true;
          break;
        case "--config":
          parsed.config = args[++i];
          break;
        default:
          if (arg.startsWith("--")) {
            console.log(`Unknown option: ${arg}`);
            process.exit(1);
          }
      }
    }

    return parsed;
  }

  /**
   * Show help message
   */
  private showHelp(): void {
    console.log(`
🔍 Text Extraction Script for ForeverPages

This script automatically extracts inline text from your React components
and adds corresponding keys to all locale files.

USAGE:
  npx tsx scripts/extract-cli.ts [options]

OPTIONS:
  --help, -h              Show this help message
  --dry-run, -d           Show what would be extracted without updating files
  --verbose, -v           Show detailed output during extraction
  --interactive, -i       Run in interactive mode with prompts
  --config <file>         Use custom configuration file

EXAMPLES:
  npx tsx scripts/extract-cli.ts                    # Run extraction
  npx tsx scripts/extract-cli.ts --dry-run          # Preview what would be extracted
  npx tsx scripts/extract-cli.ts --verbose          # Show detailed output
  npx tsx scripts/extract-cli.ts --interactive      # Interactive mode

CONFIGURATION:
  The script uses scripts/extract-config.json for configuration.
  You can customize:
  - Directories to scan
  - File patterns to include/exclude
  - Text patterns to extract
  - Locale settings
  - Key generation rules

WHAT IT DOES:
  1. Scans your React components for inline text
  2. Extracts text that should be localized
  3. Generates appropriate keys for the text
  4. Adds keys to all locale files
  5. Provides a report of what was extracted

NEXT STEPS:
  After running the script:
  1. Review the generated keys in your locale files
  2. Update placeholder translations for non-English locales
  3. Replace inline text in components with translation keys
  4. Use the database localization system to serve localized content
`);
  }

  /**
   * Run the extraction process
   */
  async run(): Promise<void> {
    if (this.args.help) {
      this.showHelp();
      return;
    }

    // Update config based on CLI args
    if (this.args.dryRun) {
      this.config.output.dryRun = true;
    }

    if (this.args.verbose) {
      this.config.output.verbose = true;
    }

    // Load custom config if specified
    if (this.args.config) {
      try {
        const customConfig = JSON.parse(
          fs.readFileSync(this.args.config, "utf8")
        ) as Partial<ExtractionConfig>;
        this.config = { ...this.config, ...customConfig };
      } catch (error) {
        console.error(`❌ Could not load config file: ${(error as Error).message}`);
        process.exit(1);
      }
    }

    // Show configuration
    this.showConfiguration();

    // Confirm before proceeding (unless dry run)
    if (!this.args.dryRun && !this.args.interactive) {
      console.log("\n⚠️  This will modify your locale files.");
      console.log("   Use --dry-run to preview changes first.");
      console.log("   Use --interactive for guided mode.\n");
    }

    // Run extraction
    try {
      const extractor = new TextExtractor();
      await extractor.extract();
    } catch (error) {
      console.error("❌ Extraction failed:", (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Show current configuration
   */
  private showConfiguration(): void {
    console.log("🔧 Configuration:");
    console.log(`  📁 Scan directories: ${this.config.scanDirs.join(", ")}`);
    console.log(`  🌍 Locales: ${this.config.locales.join(", ")}`);
    console.log(`  📝 Default locale: ${this.config.defaultLocale}`);
    console.log(
      `  📏 Text length: ${this.config.minTextLength}-${this.config.maxTextLength} characters`
    );
    console.log(`  🔍 Patterns: ${this.config.textPatterns.length} text patterns`);
    console.log(`  ⚙️  Dry run: ${this.config.output.dryRun ? "Yes" : "No"}`);
    console.log(`  📊 Verbose: ${this.config.output.verbose ? "Yes" : "No"}`);
  }
}

// Run CLI
async function main(): Promise<void> {
  const cli = new TextExtractionCLI();
  await cli.run();
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ CLI Error:", (error as Error).message);
    process.exit(1);
  });
}

export { TextExtractionCLI, type CLIArgs };
