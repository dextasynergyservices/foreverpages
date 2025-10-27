# Text Extraction Script - Example Usage

This document shows how to use the text extraction script with real examples.

## 🎯 Example Scenario

Let's say you have a React component with inline text that needs to be localized:

```tsx
// src/app/components/Hero.tsx
export function Hero() {
  return (
    <div className="hero">
      <h1>Welcome to ForeverPages</h1>
      <p>Create beautiful memorial websites where families and friends celebrate lives together</p>
      <button title="Start creating your memorial page">Get Started</button>
      <a href="/sample">View Sample Memorial</a>
    </div>
  );
}
```

## 🔍 Running the Extraction Script

### 1. **Preview What Would Be Extracted (Dry Run)**

```bash
pnpm extract:text:dry
# or directly with tsx
npx tsx scripts/extract-cli.ts --dry-run
```

**Output:**

```
🔍 Starting text extraction...

📚 Loading existing locale files...
  ✅ Loaded en.json
  ✅ Loaded es.json
  ✅ Loaded fr.json
  ✅ Loaded ha.json
  ✅ Loaded ig.json
  ✅ Loaded yo.json

🔍 Scanning components for inline text...
  📄 Scanned src/app/components/Hero.tsx

🔑 Generating keys for extracted text...
  ✨ New key: hero_welcome_to_foreverpages -> "Welcome to ForeverPages"
  ✨ New key: hero_create_beautiful_memorial -> "Create beautiful memorial websites where families and friends celebrate lives together"
  ✨ New key: hero_start_creating_memorial -> "Start creating your memorial page"
  ✨ New key: hero_get_started -> "Get Started"
  ✨ New key: hero_view_sample_memorial -> "View Sample Memorial"

📊 Extraction Report
==================
📁 Files scanned: 1
📝 Texts extracted: 5
🔑 New keys added: 5
♻️  Keys updated: 0

🆕 New Keys Added:
  hero_welcome_to_foreverpages: "Welcome to ForeverPages" (src/app/components/Hero.tsx:4)
  hero_create_beautiful_memorial: "Create beautiful memorial websites where families and friends celebrate lives together" (src/app/components/Hero.tsx:5)
  hero_start_creating_memorial: "Start creating your memorial page" (src/app/components/Hero.tsx:6)
  hero_get_started: "Get Started" (src/app/components/Hero.tsx:6)
  hero_view_sample_memorial: "View Sample Memorial" (src/app/components/Hero.tsx:7)

✅ Text extraction completed successfully!
```

### 2. **Run the Actual Extraction**

```bash
pnpm extract:text
# or directly with tsx
npx tsx scripts/extract-cli.ts
```

This will update all locale files with the new keys.

## 📝 Updated Locale Files

### **en.json** (Default locale with actual text)

```json
{
  "hero": {
    "title": "Honor Their Memory",
    "subtitle": "Create beautiful memorial websites where families and friends celebrate lives together",
    "buttons": {
      "create": "Create a Memorial Page",
      "view": "View Sample Memorial"
    }
  },
  "hero_welcome_to_foreverpages": "Welcome to ForeverPages",
  "hero_create_beautiful_memorial": "Create beautiful memorial websites where families and friends celebrate lives together",
  "hero_start_creating_memorial": "Start creating your memorial page",
  "hero_get_started": "Get Started",
  "hero_view_sample_memorial": "View Sample Memorial"
}
```

### **es.json** (Spanish with placeholders)

```json
{
  "hero": {
    "title": "Honor Their Memory",
    "subtitle": "Create beautiful memorial websites where families and friends celebrate lives together",
    "buttons": {
      "create": "Create a Memorial Page",
      "view": "View Sample Memorial"
    }
  },
  "hero_welcome_to_foreverpages": "[ES] Welcome to ForeverPages",
  "hero_create_beautiful_memorial": "[ES] Create beautiful memorial websites where families and friends celebrate lives together",
  "hero_start_creating_memorial": "[ES] Start creating your memorial page",
  "hero_get_started": "[ES] Get Started",
  "hero_view_sample_memorial": "[ES] View Sample Memorial"
}
```

### **fr.json** (French with placeholders)

```json
{
  "hero": {
    "title": "Honor Their Memory",
    "subtitle": "Create beautiful memorial websites where families and friends celebrate lives together",
    "buttons": {
      "create": "Create a Memorial Page",
      "view": "View Sample Memorial"
    }
  },
  "hero_welcome_to_foreverpages": "[FR] Welcome to ForeverPages",
  "hero_create_beautiful_memorial": "[FR] Create beautiful memorial websites where families and friends celebrate lives together",
  "hero_start_creating_memorial": "[FR] Start creating your memorial page",
  "hero_get_started": "[FR] Get Started",
  "hero_view_sample_memorial": "[FR] View Sample Memorial"
}
```

## 🔄 Next Steps

### 1. **Update Translations**

Replace the placeholder translations with actual translations:

```json
// es.json
{
  "hero_welcome_to_foreverpages": "Bienvenido a ForeverPages",
  "hero_create_beautiful_memorial": "Crea hermosos sitios web conmemorativos donde familias y amigos celebran vidas juntos",
  "hero_start_creating_memorial": "Comienza a crear tu página conmemorativa",
  "hero_get_started": "Comenzar",
  "hero_view_sample_memorial": "Ver Memorial de Ejemplo"
}
```

### 2. **Update Component to Use Translation Keys**

Replace inline text with translation keys:

```tsx
// src/app/components/Hero.tsx
import { useTranslations } from "next-intl"; // or your translation system

export function Hero() {
  const t = useTranslations();

  return (
    <div className="hero">
      <h1>{t("hero_welcome_to_foreverpages")}</h1>
      <p>{t("hero_create_beautiful_memorial")}</p>
      <button title={t("hero_start_creating_memorial")}>{t("hero_get_started")}</button>
      <a href="/sample">{t("hero_view_sample_memorial")}</a>
    </div>
  );
}
```

### 3. **Use Database Localization**

For dynamic content, use the database localization system:

```tsx
// src/app/components/MemorialCard.tsx
import { getLocalizedField } from "@/lib/database-localization";

export function MemorialCard({ memorial, locale }) {
  const title = getLocalizedField(memorial, "title", locale);
  const description = getLocalizedField(memorial, "description", locale);

  return (
    <div className="memorial-card">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
```

## 🎯 Advanced Usage

### **Custom Configuration**

Create a custom config file for specific needs:

```json
// scripts/my-config.json
{
  "scanDirs": ["src/app/components", "src/app/pages"],
  "minTextLength": 5,
  "maxTextLength": 100,
  "textPatterns": ["[\"']([^\"']{5,})[\"']", ">\\s*([^<>{}\\n]{5,})\\s*<"],
  "skipPatterns": ["^\\d+$", "^[a-zA-Z0-9._-]+$", "^(true|false|null|undefined)$"]
}
```

Run with custom config:

```bash
npx tsx scripts/extract-cli.ts --config scripts/my-config.json
```

### **Verbose Output**

See detailed information about the extraction process:

```bash
pnpm extract:text:verbose
```

### **Interactive Mode**

Run with prompts for guided extraction:

```bash
npx tsx scripts/extract-cli.ts --interactive
```

## 🔍 What Gets Ignored

The script intelligently ignores text that shouldn't be localized:

```tsx
// These will be IGNORED:
<div className="container">           // className is an identifier
<span>123</span>                     // Numbers only
<a href="https://example.com">Link</a> // URL in href
<button disabled={true}>Click</button> // Boolean value
<div>{variable}</div>                // Variable reference
<span>and</span>                     // Common short word
<code>API_KEY</code>                 // Constant
```

## 📊 Batch Processing

The script can process multiple components at once:

```bash
# Process all components in your project
pnpm extract:text

# Output shows all files processed:
📄 Scanned src/app/components/Hero.tsx
📄 Scanned src/app/components/Navbar.tsx
📄 Scanned src/app/components/Footer.tsx
📄 Scanned src/app/components/PricingSection.tsx
📄 Scanned src/app/components/CTASection.tsx
...
```

## 🚨 Common Issues and Solutions

### **Issue: No text extracted**

**Solution:** Check if your components are in the configured scan directories and meet the text length requirements.

### **Issue: Too many false positives**

**Solution:** Add more skip patterns to ignore unwanted text like identifiers and short words.

### **Issue: Keys not generated**

**Solution:** Check if the text already exists in your locale files or meets the extraction criteria.

### **Issue: Configuration errors**

**Solution:** Validate your JSON configuration file and ensure all paths are correct.

## 🎉 Success!

After running the extraction script, you'll have:

1. ✅ **All inline text extracted** from your components
2. ✅ **Keys generated** for each piece of text
3. ✅ **Locale files updated** with new keys
4. ✅ **Placeholder translations** for non-English locales
5. ✅ **Ready for translation** and integration with your localization system

The script makes it easy to maintain consistent localization across your entire application!
