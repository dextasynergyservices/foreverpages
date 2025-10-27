# Database Localization System

A comprehensive database localization system for ForeverPages that supports multiple languages with intelligent fallback strategies.

## Features

- **Multi-language Support**: English, Spanish, French, Hausa, Igbo, and Yoruba
- **Intelligent Fallback**: Automatic fallback to default language when translations are missing
- **Flexible Schema**: Works with any database model structure
- **API Middleware**: Built-in middleware for Next.js API routes
- **Batch Operations**: Efficient handling of multiple localized records
- **Translation Management**: Add, update, and remove translations easily

## Quick Start

### 1. Initialize the Service

```typescript
import { initializeLocalization } from "@/lib/database-localization";

// Initialize with default configuration
const localizationService = initializeLocalization();

// Or with custom configuration
const localizationService = initializeLocalization({
  defaultLocale: "en",
  supportedLocales: ["en", "es", "fr", "ha", "ig", "yo"],
  fallbackStrategy: "default",
});
```

### 2. Basic Usage

```typescript
import { getLocalizedField, setLocalizedField } from "@/lib/database-localization";

// Get localized content
const title = getLocalizedField(memorial, "title", "es"); // Spanish
const description = getLocalizedField(memorial, "description", "fr", "en"); // French with English fallback

// Set localized content
const updatedMemorial = setLocalizedField(memorial, "title", "Mi Memorial", "es");
```

### 3. Working with Models

```typescript
import { getLocalizedModel, addTranslations } from "@/lib/database-localization";

// Get localized model
const localizedMemorial = getLocalizedModel(memorial, "es", "en", ["title", "description"]);

// Add multiple translations
const updatedMemorial = addTranslations(memorial, [
  { field: "title", locale: "es", content: "Mi Memorial" },
  { field: "description", locale: "es", content: "Una descripción en español" },
  { field: "title", locale: "fr", content: "Mon Mémorial" },
]);
```

## API Routes Integration

### Next.js API Routes

```typescript
// pages/api/memorials/[id].ts
import { withLocalization } from "@/lib/database-localization";

export default withLocalization(async (req, context) => {
  const { locale, fallbackLocale, service } = context;

  // Get memorial from database
  const memorial = await getMemorialById(req.query.id);

  // Get localized version
  const localizedMemorial = service.getLocalized(memorial, {
    locale,
    fallbackLocale,
    fields: ["title", "description", "content"],
  });

  return NextResponse.json(localizedMemorial);
});
```

### Next.js API Routes with Middleware

```typescript
// pages/api/memorials/[id].ts
import { withLocalization, getLocalizedDataFromContext } from "@/lib/database-localization";

export default withLocalization(async (req, context) => {
  const memorial = await getMemorialById(req.query.id);
  const localizedMemorial = getLocalizedDataFromContext(context, memorial, [
    "title",
    "description",
  ]);

  return NextResponse.json(localizedMemorial);
});
```

## Database Schema Examples

### Memorial Model with Translations

```typescript
// Your Prisma model
model Memorial {
  id          String   @id @default(cuid())
  title       String
  description String?
  content     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Translations will be stored as JSON
  translations Json?
}

// Example data structure
const memorial = {
  id: "mem_123",
  title: "John's Memorial",
  description: "A loving father and husband",
  content: "John was a wonderful person...",
  translations: {
    title: {
      content: {
        "es": "Memorial de John",
        "fr": "Mémorial de John"
      },
      fallbackLocale: "en"
    },
    description: {
      content: {
        "es": "Un padre y esposo amoroso",
        "fr": "Un père et mari aimant"
      },
      fallbackLocale: "en"
    }
  }
};
```

## Advanced Usage

### Translation Management

```typescript
import { getLocalizationService } from "@/lib/database-localization";

const service = getLocalizationService();

// Check translation completion
const stats = service.getTranslationStats(memorial);
console.log(`Translation completion: ${stats.completionPercentage}%`);

// Get missing translations
const missing = service.getMissingTranslations(memorial, "title", ["es", "fr"]);
console.log("Missing translations:", missing);

// Get available locales for a field
const available = service.getAvailableLocales(memorial, "title");
console.log("Available locales:", available);
```

### Batch Operations

```typescript
// Get multiple localized models
const localizedMemorials = getLocalizedModels(memorials, "es", "en", ["title", "description"]);

// Create localized query builder
const query = createLocalizedQuery("es", "en");
const result = query.forModels(memorials, ["title", "description"]);
```

### Error Handling

```typescript
import { handleLocalizationError } from "@/lib/database-localization";

try {
  const localizedContent = getLocalizedField(model, "title", "invalid-locale");
} catch (error) {
  handleLocalizationError(error, req, res);
}
```

## Configuration Options

```typescript
interface DatabaseLocalizationConfig {
  defaultLocale: SupportedLocale; // Default language (e.g., 'en')
  supportedLocales: SupportedLocale[]; // All supported languages
  fallbackStrategy: "default" | "first-available" | "throw-error";
}
```

### Fallback Strategies

- **`default`**: Falls back to default locale, then original field value
- **`first-available`**: Uses first available translation
- **`throw-error`**: Throws error when translation is missing

## Best Practices

1. **Always provide fallback locales** for better user experience
2. **Use batch operations** when processing multiple records
3. **Check translation completion** before displaying content
4. **Handle errors gracefully** with proper error messages
5. **Cache localized content** for better performance

## Migration Guide

When you're ready to add models and API routes:

1. **Update your Prisma schema** to include translation fields
2. **Create API routes** using the provided middleware
3. **Update your database queries** to include translation data
4. **Test with multiple locales** to ensure proper fallback behavior

## Troubleshooting

### Common Issues

1. **Missing translations**: Check if translations exist for the requested locale
2. **Invalid locales**: Ensure locale is in the supported locales list
3. **Fallback not working**: Verify fallback locale configuration
4. **Performance issues**: Consider caching localized content

### Debug Mode

```typescript
// Enable debug logging
const service = getLocalizationService();
service.updateConfig({
  debug: true, // Add this to your config
});
```

## Support

For issues or questions about the database localization system, please refer to the main project documentation or create an issue in the repository.
