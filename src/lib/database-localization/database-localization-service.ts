/**
 * Database Localization Service
 *
 * High-level service for database content localization with batch operations
 * and advanced querying capabilities.
 */

import {
  SupportedLocale,
  DatabaseLocalizationConfig,
  LocalizedQueryOptions,
  LocalizedResult,
  DatabaseLocalizationService as IDatabaseLocalizationService,
  LocalizationContext,
} from "./types";
import { DatabaseTranslationService } from "./translation-service";

export class DatabaseLocalizationService implements IDatabaseLocalizationService {
  public config: DatabaseLocalizationConfig;
  private translationService: DatabaseTranslationService;

  constructor(config: DatabaseLocalizationConfig) {
    this.config = config;
    this.translationService = new DatabaseTranslationService(config);
  }

  /**
   * Get localized content for a single model
   */
  getLocalized<T>(model: T, options: LocalizedQueryOptions): LocalizedResult<T> {
    const context: LocalizationContext = {
      locale: options.locale,
      fallbackLocale: options.fallbackLocale,
      includeFallbacks: true,
    };

    const fields = options.fields || [];
    const localizedModel = this.translationService.getLocalizedModel(model, context, fields);

    // Check for missing fields
    const missingFields: string[] = [];
    if (fields.length > 0) {
      for (const field of fields) {
        if (!this.translationService.hasTranslation(model, field, options.locale)) {
          missingFields.push(field);
        }
      }
    }

    // Check if fallback was used
    const fallbackUsed =
      missingFields.length > 0 &&
      options.fallbackLocale &&
      options.fallbackLocale !== options.locale;

    return {
      data: localizedModel as T,
      locale: options.locale,
      fallbackUsed,
      missingFields: missingFields.length > 0 ? missingFields : undefined,
    };
  }

  /**
   * Set localized content for a field
   */
  setLocalized<T>(model: T, field: string, content: string, locale: SupportedLocale): T {
    return this.translationService.setLocalizedContent(model, field, content, locale);
  }

  /**
   * Get localized content for multiple models
   */
  getMultipleLocalized<T>(models: T[], options: LocalizedQueryOptions): LocalizedResult<T>[] {
    return models.map((model) => this.getLocalized(model, options));
  }

  /**
   * Add a new translation
   */
  addTranslation<T>(model: T, field: string, locale: SupportedLocale, content: string): T {
    return this.translationService.addTranslation(model, field, locale, content);
  }

  /**
   * Remove a translation
   */
  removeTranslation<T>(model: T, field: string, locale: SupportedLocale): T {
    return this.translationService.removeTranslation(model, field, locale);
  }

  /**
   * Get available locales for a field
   */
  getAvailableLocales<T>(model: T, field: string): SupportedLocale[] {
    return this.translationService.getAvailableLocales(model, field);
  }

  /**
   * Get missing translations for a field
   */
  getMissingTranslations<T>(
    model: T,
    field: string,
    targetLocales: SupportedLocale[]
  ): SupportedLocale[] {
    return this.translationService.getMissingTranslations(model, field, targetLocales);
  }

  /**
   * Batch add translations for multiple fields
   */
  batchAddTranslations<T>(
    model: T,
    translations: {
      field: string;
      locale: SupportedLocale;
      content: string;
    }[]
  ): T {
    let updatedModel = model;

    for (const translation of translations) {
      updatedModel = this.addTranslation(
        updatedModel,
        translation.field,
        translation.locale,
        translation.content
      );
    }

    return updatedModel;
  }

  /**
   * Get all translations for a model
   */
  getAllTranslations<T>(model: T): Record<string, Record<SupportedLocale, string>> {
    const modelWithTranslations = model as {
      translations?: Record<string, { content: Record<SupportedLocale, string> }>;
    };

    if (!modelWithTranslations.translations) {
      return {};
    }

    const result: Record<string, Record<SupportedLocale, string>> = {};

    for (const [field, translation] of Object.entries(modelWithTranslations.translations)) {
      if (translation && typeof translation === "object" && "content" in translation) {
        result[field] = (translation as { content: Record<SupportedLocale, string> }).content;
      }
    }

    return result;
  }

  /**
   * Check if a model has any translations
   */
  hasAnyTranslations<T>(model: T): boolean {
    const modelWithTranslations = model as { translations?: Record<string, unknown> };
    return !!(
      modelWithTranslations.translations &&
      Object.keys(modelWithTranslations.translations).length > 0
    );
  }

  /**
   * Get translation statistics for a model
   */
  getTranslationStats<T>(model: T): {
    totalFields: number;
    translatedFields: number;
    completionPercentage: number;
    missingLocales: Record<string, SupportedLocale[]>;
  } {
    const modelWithTranslations = model as { translations?: Record<string, unknown> };
    const allFields = Object.keys(modelWithTranslations.translations || {});
    const totalFields = allFields.length;

    let translatedFields = 0;
    const missingLocales: Record<string, SupportedLocale[]> = {};

    for (const field of allFields) {
      const availableLocales = this.getAvailableLocales(model, field);
      const missingForField = this.config.supportedLocales.filter(
        (locale) => !availableLocales.includes(locale)
      );

      if (availableLocales.length > 0) {
        translatedFields++;
      }

      if (missingForField.length > 0) {
        missingLocales[field] = missingForField;
      }
    }

    const completionPercentage = totalFields > 0 ? (translatedFields / totalFields) * 100 : 0;

    return {
      totalFields,
      translatedFields,
      completionPercentage,
      missingLocales,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DatabaseLocalizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.translationService.updateConfig(this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): DatabaseLocalizationConfig {
    return { ...this.config };
  }
}
