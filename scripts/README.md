# Text Extraction Scripts

This directory contains scripts for automatically extracting inline text from React components and adding corresponding keys to all locale files.

## 🚀 Quick Start

### Install Dependencies

```bash
pnpm install
```

### Run Text Extraction

```bash
# Extract text and update locale files
pnpm extract:text

# Preview what would be extracted (dry run)
pnpm extract:text:dry

# Run with verbose output
pnpm extract:text:verbose
```

### Direct TypeScript Execution

```bash
# Run directly with tsx
npx tsx scripts/extract-cli.ts
npx tsx scripts/extract-cli.ts --dry-run
npx tsx scripts/extract-cli.ts --verbose
```

## 📁 Files

- **`extract-text.ts`** - Core extraction logic (TypeScript)
- **`extract-cli.ts`** - User-friendly CLI interface (TypeScript)
- **`extract-config.json`** - Configuration file
- **`README.md`** - This documentation

## 🔧 Configuration

The script uses `extract-config.json` for configuration. You can customize:

### Scan Settings

```json
{
  "scanDirs": ["src/app/components", "src/app", "src/components"],
  "includePatterns": ["**/*.tsx", "**/*.jsx", "**/*.ts", "**/*.js"],
  "excludePatterns": ["**/*.test.*", "**/*.spec.*", "**/node_modules/**"]
}
```

### Locale Settings

```json
{
  "localesDir": "src/lib/locales",
  "locales": ["en", "es", "fr", "ha", "ig", "yo"],
  "defaultLocale": "en"
}
```

### Text Extraction Rules

```json
{
  "minTextLength": 3,
  "maxTextLength": 200,
  "textPatterns": [
    "[\"']([^\"']{3,})[\"']",
    "`([^`]{3,})`",
    ">\\s*([^<>{}\\n]{3,})\\s*<",
    "(title|alt|placeholder|aria-label|aria-describedby)=[\"']([^\"']{3,})[\"']"
  ]
}
```

### Skip Patterns

Text matching these patterns will be ignored:

- Numbers only: `123`
- Simple identifiers: `className`
- Boolean values: `true`, `false`
- Punctuation only: `{}[]()`
- Common short words: `and`, `or`, `the`
- Constants: `API_KEY`
- URLs: `https://example.com`
- Email addresses: `user@example.com`

## 🎯 How It Works

### 1. **Text Detection**

The script scans your React components for inline text using regex patterns:

```tsx
// These will be detected:
<h1>Welcome to ForeverPages</h1>
<button title="Click to create memorial">Create Memorial</button>
<p>This is a long description that should be localized</p>

// These will be ignored:
<div className="container">  // className is an identifier
<span>123</span>            // Numbers only
<a href="https://example.com">Link</a>  // URL in href
```

### 2. **Key Generation**

Text is converted to keys using these rules:

```tsx
// Original text: "Welcome to ForeverPages"
// Generated key: "hero_welcome_to_foreverpages"

// Original text: "Create Memorial"
// Generated key: "button_create_memorial"
```

### 3. **Locale File Updates**

Keys are added to all locale files:

```json
// en.json
{
  "hero_welcome_to_foreverpages": "Welcome to ForeverPages",
  "button_create_memorial": "Create Memorial"
}

// es.json
{
  "hero_welcome_to_foreverpages": "[ES] Welcome to ForeverPages",
  "button_create_memorial": "[ES] Create Memorial"
}
```

## 📝 Usage Examples

### Basic Extraction

```bash
# Extract all inline text
pnpm extract:text
```

### Preview Mode

```bash
# See what would be extracted without making changes
pnpm extract:text:dry
```

### Verbose Output

```bash
# See detailed information about the extraction process
pnpm extract:text:verbose
```

### Custom Configuration

```bash
# Use a custom config file
npx tsx scripts/extract-cli.ts --config my-config.json
```

## 🔍 What Gets Extracted

### ✅ **Will Be Extracted:**

- JSX text content: `"Welcome to our site"`
- Template literals: `` `Hello ${name}` ``
- JSX children text: `>Click here<`
- HTML attributes: `title="Tooltip text"`
- Long descriptive text (3-200 characters)

### ❌ **Will Be Ignored:**

- Short text (< 3 characters)
- Numbers and identifiers
- URLs and email addresses
- Boolean values and constants
- Common short words
- Test files and node_modules

## 📊 Output Report

After extraction, you'll see a report like this:

```
📊 Extraction Report
==================
📁 Files scanned: 15
📝 Texts extracted: 23
🔑 New keys added: 18
♻️  Keys updated: 0

🆕 New Keys Added:
  hero_welcome_to_foreverpages: "Welcome to ForeverPages" (src/app/components/Hero.tsx:12)
  button_create_memorial: "Create Memorial" (src/app/components/CTA.tsx:8)
  ...

✅ Text extraction completed successfully!

💡 Next steps:
  1. Review the generated keys in your locale files
  2. Update the placeholder translations for non-English locales
  3. Replace inline text in components with translation keys
```

## 🔄 Workflow Integration

### 1. **Before Adding New Features**

Run the extraction script to catch any new inline text:

```bash
pnpm extract:text:dry
```

### 2. **After Adding Components**

Extract new text and update locale files:

```bash
pnpm extract:text
```

### 3. **Review and Translate**

- Check the generated keys in your locale files
- Update placeholder translations for non-English locales
- Replace inline text with translation keys in your components

### 4. **Use Database Localization**

Use the database localization system to serve localized content:

```typescript
import { getLocalizedField } from "@/lib/database-localization";

const title = getLocalizedField(memorial, "title", "es");
```

## 🛠️ Customization

### Custom Text Patterns

Add your own regex patterns to detect specific text:

```json
{
  "textPatterns": [
    "[\"']([^\"']{3,})[\"']",
    "`([^`]{3,})`",
    ">\\s*([^<>{}\\n]{3,})\\s*<",
    "(title|alt|placeholder|aria-label|aria-describedby)=[\"']([^\"']{3,})[\"']",
    "// Custom pattern for your specific use case
    "customPattern": "your-regex-here"
  ]
}
```

### Custom Skip Patterns

Add patterns for text you want to ignore:

```json
{
  "skipPatterns": [
    "^\\d+$",
    "^[a-zA-Z0-9._-]+$",
    "^(true|false|null|undefined)$",
    "^[{}[\\]();,.\\s]+$",
    "^(and|or|the|a|an|in|on|at|to|for|of|with|by)$",
    "^[A-Z_]+$",
    "^\\$[\\d.]+$",
    "^https?:\\/\\/",
    "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    "// Custom skip pattern
    "^your-custom-pattern$"
  ]
}
```

### Custom Key Generation

Modify how keys are generated:

```json
{
  "keyGeneration": {
    "maxKeyLength": 50,
    "separator": "_",
    "includeFileContext": true,
    "normalizeText": true
  }
}
```

## 🚨 Troubleshooting

### Common Issues

#### **No Text Extracted**

- Check if your components are in the configured scan directories
- Verify file patterns include your file types
- Ensure text meets minimum length requirements

#### **Too Many False Positives**

- Add more skip patterns to ignore unwanted text
- Adjust text length constraints
- Modify text patterns to be more specific

#### **Keys Not Generated**

- Check if text already exists in locale files
- Verify text meets extraction criteria
- Review skip patterns

#### **Configuration Errors**

- Validate JSON syntax in config file
- Check file paths are correct
- Ensure all required fields are present

### Debug Mode

Run with verbose output to see detailed information:

```bash
pnpm extract:text:verbose
```

## 🔗 Integration with Database Localization

This extraction script works seamlessly with the database localization system:

1. **Extract text** using this script
2. **Review keys** in locale files
3. **Update translations** for all languages
4. **Use database localization** to serve content
5. **Replace inline text** with translation keys

The extracted keys can be used with the database localization system to provide localized content for your memorial pages and other features.

## 📚 Related Documentation

- [Database Localization System](../src/lib/database-localization/README.md)
- [Locale Files](../src/lib/locales/README.md)
- [Component Localization Guide](../docs/localization-guide.md)

## 🤝 Contributing

To improve the extraction script:

1. **Add new text patterns** for better detection
2. **Improve skip patterns** to reduce false positives
3. **Enhance key generation** for better naming
4. **Add new features** like batch processing or interactive mode

## 📄 License

This script is part of the ForeverPages project and follows the same license terms.
