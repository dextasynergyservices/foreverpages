/**
 * Database Translation Service
 *
 * Core service for handling database content localization with fallback strategies.
 * This service is designed to work with any database model structure.
 */

import {
  SupportedLocale,
  LocalizedModelWithTranslations,
  DatabaseLocalizationConfig,
  LocalizationContext,
  TranslationService,
  MissingTranslationError,
  UnsupportedLocaleError,
} from "./types";

export class DatabaseTranslationService implements TranslationService {
  private config: DatabaseLocalizationConfig;

  constructor(config: DatabaseLocalizationConfig) {
    this.config = config;
  }

  /**
   * Get localized content for a specific field with fallback support
   */
  getLocalizedContent<T>(model: T, field: string, context: LocalizationContext): string | null {
    try {
      const localizedModel = model as LocalizedModelWithTranslations;

      // Check if the model has translations
      if (!localizedModel.translations || !localizedModel.translations[field]) {
        return this.getFallbackContent(model, field, context);
      }

      const localizedField = localizedModel.translations[field];
      const targetLocale = context.locale;
      const fallbackLocale = context.fallbackLocale || this.config.defaultLocale;

      // Try to get content in the requested locale
      if (localizedField.content[targetLocale]) {
        return localizedField.content[targetLocale];
      }

      // Try fallback locale if different from target
      if (fallbackLocale !== targetLocale && localizedField.content[fallbackLocale]) {
        return localizedField.content[fallbackLocale];
      }

      // Try default locale
      if (localizedField.content[this.config.defaultLocale]) {
        return localizedField.content[this.config.defaultLocale];
      }

      // Try first available locale
      const availableLocales = Object.keys(localizedField.content) as SupportedLocale[];
      if (availableLocales.length > 0) {
        return localizedField.content[availableLocales[0]];
      }

      return this.getFallbackContent(model, field, context);
    } catch (error) {
      console.error(`Error getting localized content for field '${field}':`, error);
      return this.getFallbackContent(model, field, context);
    }
  }

  /**
   * Get a localized version of the entire model
   */
  getLocalizedModel<T>(model: T, context: LocalizationContext, fields?: string[]): Partial<T> {
    const localizedModel = { ...model } as Partial<T>;

    if (!(model as LocalizedModelWithTranslations).translations) {
      return localizedModel;
    }

    const fieldsToProcess =
      fields || Object.keys((model as LocalizedModelWithTranslations).translations || {});

    for (const field of fieldsToProcess) {
      const localizedContent = this.getLocalizedContent(model, field, context);
      if (localizedContent !== null) {
        (localizedModel as Record<string, unknown>)[field] = localizedContent;
      }
    }

    return localizedModel;
  }

  /**
   * Set localized content for a specific field
   */
  setLocalizedContent<T>(model: T, field: string, content: string, locale: SupportedLocale): T {
    this.validateLocale(locale);

    const localizedModel = { ...model } as LocalizedModelWithTranslations;

    if (!localizedModel.translations) {
      localizedModel.translations = {};
    }

    if (!localizedModel.translations[field]) {
      localizedModel.translations[field] = {
        content: {},
        fallbackLocale: this.config.defaultLocale,
      };
    }

    localizedModel.translations[field].content[locale] = content;

    return localizedModel as T;
  }

  /**
   * Check if a translation exists for a specific field and locale
   */
  hasTranslation<T>(model: T, field: string, locale: SupportedLocale): boolean {
    this.validateLocale(locale);

    const localizedModel = model as LocalizedModelWithTranslations;

    return !!(
      localizedModel.translations &&
      localizedModel.translations[field] &&
      localizedModel.translations[field].content[locale]
    );
  }

  /**
   * Get available locales for a specific field
   */
  getAvailableLocales<T>(model: T, field: string): SupportedLocale[] {
    const localizedModel = model as LocalizedModelWithTranslations;

    if (!localizedModel.translations || !localizedModel.translations[field]) {
      return [];
    }

    return Object.keys(localizedModel.translations[field].content) as SupportedLocale[];
  }

  /**
   * Get missing translations for a field
   */
  getMissingTranslations<T>(
    model: T,
    field: string,
    targetLocales: SupportedLocale[]
  ): SupportedLocale[] {
    const availableLocales = this.getAvailableLocales(model, field);
    return targetLocales.filter((locale) => !availableLocales.includes(locale));
  }

  /**
   * Add a new translation for a field
   */
  addTranslation<T>(model: T, field: string, locale: SupportedLocale, content: string): T {
    return this.setLocalizedContent(model, field, content, locale);
  }

  /**
   * Remove a translation for a field
   */
  removeTranslation<T>(model: T, field: string, locale: SupportedLocale): T {
    this.validateLocale(locale);

    const localizedModel = { ...model } as LocalizedModelWithTranslations;

    if (
      localizedModel.translations &&
      localizedModel.translations[field] &&
      localizedModel.translations[field].content[locale]
    ) {
      delete localizedModel.translations[field].content[locale];
    }

    return localizedModel as T;
  }

  /**
   * Get fallback content when translation is not available
   */
  private getFallbackContent<T>(
    model: T,
    field: string,
    context: LocalizationContext
  ): string | null {
    // Try to get the original field value as fallback
    if (
      (model as Record<string, unknown>)[field] &&
      typeof (model as Record<string, unknown>)[field] === "string"
    ) {
      return (model as Record<string, string>)[field];
    }

    // If fallback strategy is to throw error, throw it
    if (this.config.fallbackStrategy === "throw-error") {
      throw new MissingTranslationError(field, context.locale);
    }

    return null;
  }

  /**
   * Validate that a locale is supported
   */
  private validateLocale(locale: string): void {
    if (!this.config.supportedLocales.includes(locale as SupportedLocale)) {
      throw new UnsupportedLocaleError(locale);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DatabaseLocalizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): DatabaseLocalizationConfig {
    return { ...this.config };
  }
}
