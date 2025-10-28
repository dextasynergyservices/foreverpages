# Text Extraction System - Complete Implementation

## 🎉 **System Complete!**

I've successfully created a comprehensive text extraction system that automatically finds inline text in your React components and adds corresponding keys to all locale files.

## 📁 **Files Created**

### **Core Scripts**

- **`extract-text.ts`** - Main extraction logic with intelligent text detection (TypeScript)
- **`extract-cli.ts`** - User-friendly CLI interface with options (TypeScript)
- **`extract-config.json`** - Configuration file for customization

### **Documentation**

- **`README.md`** - Comprehensive documentation and usage guide
- **`example-usage.md`** - Real-world examples and scenarios
- **`EXTRACTION_SYSTEM_SUMMARY.md`** - This summary

### **Package.json Integration**

- Added npm scripts for easy execution
- Added required dependencies (glob for pattern matching, tsx for TypeScript execution)
- Updated scripts to use TypeScript files with tsx

## 🚀 **How to Use**

### **Quick Start**

```bash
# Install dependencies
pnpm install

# Preview what would be extracted (recommended first)
pnpm extract:text:dry

# Run the actual extraction
pnpm extract:text

# Run with verbose output
pnpm extract:text:verbose
```

### **Available Commands**

- `pnpm extract:text` - Extract text and update locale files
- `pnpm extract:text:dry` - Preview extraction without making changes
- `pnpm extract:text:verbose` - Run with detailed output

### **Direct TypeScript Execution**

- `npx tsx scripts/extract-cli.ts` - Run extraction directly
- `npx tsx scripts/extract-cli.ts --dry-run` - Preview extraction
- `npx tsx scripts/extract-cli.ts --verbose` - Run with verbose output

## 🔍 **What It Does**

### **1. Intelligent Text Detection**

- Scans React components for inline text
- Uses regex patterns to find text in JSX, attributes, and template literals
- Ignores identifiers, numbers, URLs, and other non-translatable content

### **2. Smart Key Generation**

- Converts text to meaningful keys (e.g., "Welcome to ForeverPages" → "hero_welcome_to_foreverpages")
- Includes file context for better organization
- Avoids duplicate keys

### **3. Automatic Locale Updates**

- Adds keys to all locale files (en, es, fr, ha, ig, yo)
- Provides actual text for English (default locale)
- Adds placeholder translations for other languages

### **4. Comprehensive Reporting**

- Shows what was extracted and from which files
- Provides statistics and next steps
- Helps you understand what needs translation

## 🎯 **Example Workflow**

### **Before: Component with Inline Text**

```tsx
// src/app/components/Hero.tsx
export function Hero() {
  return (
    <div className="hero">
      <h1>Welcome to ForeverPages</h1>
      <p>Create beautiful memorial websites</p>
      <button title="Start creating">Get Started</button>
    </div>
  );
}
```

### **After: Extraction and Localization**

```bash
pnpm extract:text:dry
```

**Output:**

```
✨ New key: hero_welcome_to_foreverpages -> "Welcome to ForeverPages"
✨ New key: hero_create_beautiful_memorial -> "Create beautiful memorial websites"
✨ New key: hero_start_creating -> "Start creating"
✨ New key: hero_get_started -> "Get Started"
```

### **Updated Locale Files**

```json
// en.json
{
  "hero_welcome_to_foreverpages": "Welcome to ForeverPages",
  "hero_create_beautiful_memorial": "Create beautiful memorial websites",
  "hero_start_creating": "Start creating",
  "hero_get_started": "Get Started"
}

// es.json
{
  "hero_welcome_to_foreverpages": "[ES] Welcome to ForeverPages",
  "hero_create_beautiful_memorial": "[ES] Create beautiful memorial websites",
  "hero_start_creating": "[ES] Start creating",
  "hero_get_started": "[ES] Get Started"
}
```

### **Updated Component**

```tsx
// src/app/components/Hero.tsx
import { useTranslations } from "next-intl";

export function Hero() {
  const t = useTranslations();

  return (
    <div className="hero">
      <h1>{t("hero_welcome_to_foreverpages")}</h1>
      <p>{t("hero_create_beautiful_memorial")}</p>
      <button title={t("hero_start_creating")}>{t("hero_get_started")}</button>
    </div>
  );
}
```

## ⚙️ **Configuration Options**

### **Scan Settings**

- Directories to scan for components
- File patterns to include/exclude
- Text length constraints

### **Extraction Rules**

- Regex patterns for text detection
- Skip patterns for unwanted text
- Key generation rules

### **Locale Settings**

- Supported languages
- Default locale
- Locale file directory

## 🔧 **Customization**

### **Custom Text Patterns**

Add your own regex patterns to detect specific text:

```json
{
  "textPatterns": [
    "[\"']([^\"']{3,})[\"']",
    "`([^`]{3,})`",
    ">\\s*([^<>{}\\n]{3,})\\s*<",
    "your-custom-pattern"
  ]
}
```

### **Custom Skip Patterns**

Ignore specific text patterns:

```json
{
  "skipPatterns": ["^\\d+$", "^[a-zA-Z0-9._-]+$", "your-custom-skip-pattern"]
}
```

## 🎯 **Integration with Database Localization**

This extraction system works seamlessly with the database localization system:

1. **Extract text** using this script
2. **Review and translate** the generated keys
3. **Use database localization** for dynamic content
4. **Replace inline text** with translation keys

## 📊 **Benefits**

### **For Developers**

- ✅ **Automated extraction** - No manual key creation
- ✅ **Consistent naming** - Standardized key generation
- ✅ **Time saving** - Bulk processing of components
- ✅ **Error reduction** - Automated locale file updates

### **For Translators**

- ✅ **Clear placeholders** - Easy to identify what needs translation
- ✅ **Context information** - Know where text is used
- ✅ **Batch processing** - Handle multiple translations at once

### **For the Project**

- ✅ **Maintainable** - Easy to add new languages
- ✅ **Scalable** - Works with any number of components
- ✅ **Consistent** - Standardized localization approach
- ✅ **Future-proof** - Ready for database localization

## 🚨 **Important Notes**

### **Before Running**

1. **Backup your locale files** (the script does this automatically)
2. **Run dry-run first** to preview changes
3. **Review the configuration** to ensure it matches your needs

### **After Running**

1. **Review generated keys** in your locale files
2. **Update placeholder translations** for non-English locales
3. **Replace inline text** with translation keys in components
4. **Test your application** to ensure everything works

## 🎉 **Ready to Use!**

The text extraction system is now complete and ready to use! It will help you:

- **Automatically extract** inline text from your React components
- **Generate consistent keys** for all translatable content
- **Update all locale files** with new keys and placeholders
- **Maintain localization** across your entire application
- **Integrate seamlessly** with the database localization system

Run `pnpm extract:text:dry` to see it in action! 🚀
