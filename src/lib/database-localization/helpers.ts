/**
 * Database Localization Helper Functions
 *
 * Utility functions for common database localization tasks.
 * These helpers make it easy to work with localized content in your application.
 */

import { NextRequest } from "next/server";
import {
  SupportedLocale,
  DatabaseLocalizationConfig,
  LocalizedQueryOptions,
  DatabaseLocalizationService,
} from "./types";
import { DatabaseLocalizationService as LocalizationService } from "./database-localization-service";

// Default configuration
const DEFAULT_CONFIG: DatabaseLocalizationConfig = {
  defaultLocale: "en",
  supportedLocales: ["en", "es", "fr", "ha", "ig", "yo"],
  fallbackStrategy: "default",
};

// Global service instance
let globalLocalizationService: DatabaseLocalizationService | null = null;

/**
 * Initialize the global localization service
 */
export function initializeLocalization(
  config?: Partial<DatabaseLocalizationConfig>
): DatabaseLocalizationService {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  globalLocalizationService = new LocalizationService(finalConfig);
  return globalLocalizationService;
}

/**
 * Get the global localization service instance
 */
export function getLocalizationService(): DatabaseLocalizationService {
  if (!globalLocalizationService) {
    return initializeLocalization();
  }
  return globalLocalizationService;
}

/**
 * Create a new localization service instance
 */
export function createLocalizationService(
  config?: Partial<DatabaseLocalizationConfig>
): DatabaseLocalizationService {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  return new LocalizationService(finalConfig);
}

/**
 * Quick helper to get localized content for a single field
 */
export function getLocalizedField<T>(
  model: T,
  field: string,
  locale: SupportedLocale,
  fallbackLocale?: SupportedLocale
): string | null {
  const service = getLocalizationService();

  const result = service.getLocalized(model, {
    locale,
    fallbackLocale,
    fields: [field],
    includeAllLocales: false,
  });

  return (result.data as Record<string, string>)[field] || null;
}

/**
 * Quick helper to set localized content for a single field
 */
export function setLocalizedField<T>(
  model: T,
  field: string,
  content: string,
  locale: SupportedLocale
): T {
  const service = getLocalizationService();
  return service.setLocalized(model, field, content, locale);
}

/**
 * Get localized model with all translatable fields
 */
export function getLocalizedModel<T>(
  model: T,
  locale: SupportedLocale,
  fallbackLocale?: SupportedLocale,
  fields?: string[]
): Partial<T> {
  const service = getLocalizationService();
  const options: LocalizedQueryOptions = {
    locale,
    fallbackLocale,
    fields,
    includeAllLocales: false,
  };

  const result = service.getLocalized(model, options);
  return result.data;
}

/**
 * Get multiple localized models
 */
export function getLocalizedModels<T>(
  models: T[],
  locale: SupportedLocale,
  fallbackLocale?: SupportedLocale,
  fields?: string[]
): Partial<T>[] {
  const service = getLocalizationService();
  const options: LocalizedQueryOptions = {
    locale,
    fallbackLocale,
    fields,
    includeAllLocales: false,
  };

  const results = service.getMultipleLocalized(models, options);
  return results.map((result) => result.data);
}

/**
 * Add multiple translations at once
 */
export function addTranslations<T>(
  model: T,
  translations: {
    field: string;
    locale: SupportedLocale;
    content: string;
  }[]
): T {
  const service = getLocalizationService();
  let updatedModel = model;

  for (const translation of translations) {
    updatedModel = service.addTranslation(
      updatedModel,
      translation.field,
      translation.locale,
      translation.content
    );
  }

  return updatedModel;
}

/**
 * Check if a model has translations for a specific locale
 */
export function hasTranslationsForLocale<T>(model: T, locale: SupportedLocale): boolean {
  const modelWithTranslations = model as {
    translations?: Record<string, { content?: Record<SupportedLocale, string> }>;
  };

  if (!modelWithTranslations.translations) {
    return false;
  }

  // Check if any field has translations for the specified locale
  for (const translation of Object.values(modelWithTranslations.translations)) {
    if (translation && typeof translation === "object" && "content" in translation) {
      const content = translation.content;
      if (content && content[locale]) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get translation completion percentage for a model
 */
export function getTranslationCompletion<T>(model: T): number {
  const modelWithTranslations = model as {
    translations?: Record<string, { content?: Record<SupportedLocale, string> }>;
  };

  if (!modelWithTranslations.translations) {
    return 0;
  }

  const allFields = Object.keys(modelWithTranslations.translations);
  const totalFields = allFields.length;

  if (totalFields === 0) {
    return 0;
  }

  let translatedFields = 0;

  for (const field of allFields) {
    const translation = modelWithTranslations.translations[field];
    if (translation && typeof translation === "object" && "content" in translation) {
      const content = translation.content;
      if (content && Object.keys(content).length > 0) {
        translatedFields++;
      }
    }
  }

  return (translatedFields / totalFields) * 100;
}

/**
 * Get missing translations for a model
 */
export function getMissingTranslations<T>(
  model: T,
  targetLocales?: SupportedLocale[]
): Record<string, SupportedLocale[]> {
  const modelWithTranslations = model as {
    translations?: Record<string, { content?: Record<SupportedLocale, string> }>;
  };
  const missingLocales: Record<string, SupportedLocale[]> = {};

  if (!modelWithTranslations.translations) {
    return missingLocales;
  }

  const localesToCheck = targetLocales || ["en", "es", "fr", "ha", "ig", "yo"];

  for (const [field, translation] of Object.entries(modelWithTranslations.translations)) {
    if (translation && typeof translation === "object" && "content" in translation) {
      const content = translation.content;
      const missingForField: SupportedLocale[] = [];

      for (const locale of localesToCheck) {
        if (!content || !content[locale]) {
          missingForField.push(locale);
        }
      }

      if (missingForField.length > 0) {
        missingLocales[field] = missingForField;
      }
    }
  }

  return missingLocales;
}

/**
 * Create a localized query builder
 */
export function createLocalizedQuery<T>(locale: SupportedLocale, fallbackLocale?: SupportedLocale) {
  const service = getLocalizationService();

  return {
    forModel: (model: T, fields?: string[]) => {
      const options: LocalizedQueryOptions = {
        locale,
        fallbackLocale,
        fields,
        includeAllLocales: false,
      };
      return service.getLocalized(model, options);
    },

    forModels: (models: T[], fields?: string[]) => {
      const options: LocalizedQueryOptions = {
        locale,
        fallbackLocale,
        fields,
        includeAllLocales: false,
      };
      return service.getMultipleLocalized(models, options);
    },

    addTranslation: (model: T, field: string, content: string) => {
      return service.addTranslation(model, field, locale, content);
    },

    setTranslation: (model: T, field: string, content: string) => {
      return service.setLocalized(model, field, content, locale);
    },
  };
}

/**
 * Validate locale string
 */
export function isValidLocale(locale: string): locale is SupportedLocale {
  return ["en", "es", "fr", "ha", "ig", "yo"].includes(locale);
}

/**
 * Get locale from request headers or query params
 */
export function getLocaleFromRequest(
  headers: Record<string, string | string[] | undefined>,
  query: Record<string, string | string[] | undefined>
): SupportedLocale {
  // Check query parameter first
  const queryLocale = query.locale;
  if (queryLocale && typeof queryLocale === "string" && isValidLocale(queryLocale)) {
    return queryLocale;
  }

  // Check Accept-Language header
  const acceptLanguage = headers["accept-language"];
  if (acceptLanguage && typeof acceptLanguage === "string") {
    const languages = acceptLanguage.split(",").map((lang) => lang.split(";")[0].trim());

    for (const lang of languages) {
      // Check for exact match
      if (isValidLocale(lang)) {
        return lang;
      }

      // Check for language code match (e.g., 'en-US' -> 'en')
      const langCode = lang.split("-")[0];
      if (isValidLocale(langCode)) {
        return langCode;
      }
    }
  }

  // Return default locale
  return "en";
}

/**
 * Extract localization context from Next.js request
 */
export function getLocalizationContextFromRequest(req: NextRequest): {
  locale: SupportedLocale;
  fallbackLocale?: SupportedLocale;
} {
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const query: Record<string, string | string[] | undefined> = {};
  searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const headers: Record<string, string | string[] | undefined> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const locale = getLocaleFromRequest(headers, query);
  const fallbackLocale =
    searchParams.get("fallbackLocale") && isValidLocale(searchParams.get("fallbackLocale")!)
      ? (searchParams.get("fallbackLocale") as SupportedLocale)
      : undefined;

  return {
    locale,
    fallbackLocale,
  };
}
