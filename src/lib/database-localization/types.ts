/**
 * Database Localization Types
 *
 * This file defines the types and interfaces for database content localization.
 * These types are designed to be flexible and work with any future database models.
 */

export type SupportedLocale = "en" | "es" | "fr" | "ha" | "ig" | "yo";

export interface LocalizedContent {
  [locale: string]: string;
}

export interface LocalizedField {
  content: LocalizedContent;
  fallbackLocale?: SupportedLocale;
}

export interface LocalizedModel {
  id: string;
  [key: string]: unknown;
}

export interface LocalizedModelWithTranslations extends LocalizedModel {
  translations?: {
    [fieldName: string]: LocalizedField;
  };
}

export interface DatabaseLocalizationConfig {
  defaultLocale: SupportedLocale;
  supportedLocales: SupportedLocale[];
  fallbackStrategy: "default" | "first-available" | "throw-error";
}

export interface LocalizationContext {
  locale: SupportedLocale;
  fallbackLocale?: SupportedLocale;
  includeFallbacks?: boolean;
}

export interface LocalizedQueryOptions {
  locale: SupportedLocale;
  fallbackLocale?: SupportedLocale;
  includeAllLocales?: boolean;
  fields?: string[];
}

export interface LocalizedResult<T = unknown> {
  data: T;
  locale: SupportedLocale;
  fallbackUsed?: boolean;
  missingFields?: string[];
}

export interface TranslationService {
  getLocalizedContent<T>(model: T, field: string, context: LocalizationContext): string | null;

  getLocalizedModel<T>(model: T, context: LocalizationContext, fields?: string[]): Partial<T>;

  setLocalizedContent<T>(model: T, field: string, content: string, locale: SupportedLocale): T;

  hasTranslation<T>(model: T, field: string, locale: SupportedLocale): boolean;
}

export interface DatabaseLocalizationService {
  config: DatabaseLocalizationConfig;

  // Content retrieval
  getLocalized<T>(model: T, options: LocalizedQueryOptions): LocalizedResult<T>;

  // Content setting
  setLocalized<T>(model: T, field: string, content: string, locale: SupportedLocale): T;

  // Batch operations
  getMultipleLocalized<T>(models: T[], options: LocalizedQueryOptions): LocalizedResult<T>[];

  // Translation management
  addTranslation<T>(model: T, field: string, locale: SupportedLocale, content: string): T;

  removeTranslation<T>(model: T, field: string, locale: SupportedLocale): T;

  // Utility methods
  getAvailableLocales<T>(model: T, field: string): SupportedLocale[];

  getMissingTranslations<T>(
    model: T,
    field: string,
    targetLocales: SupportedLocale[]
  ): SupportedLocale[];
}

// Error types
export class LocalizationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public locale?: SupportedLocale,
    public model?: string
  ) {
    super(message);
    this.name = "LocalizationError";
  }
}

export class MissingTranslationError extends LocalizationError {
  constructor(field: string, locale: SupportedLocale, model?: string) {
    super(
      `Missing translation for field '${field}' in locale '${locale}'${model ? ` for model '${model}'` : ""}`,
      field,
      locale,
      model
    );
    this.name = "MissingTranslationError";
  }
}

export class UnsupportedLocaleError extends LocalizationError {
  constructor(locale: string) {
    super(`Unsupported locale: ${locale}`);
    this.name = "UnsupportedLocaleError";
  }
}
