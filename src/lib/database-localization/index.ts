/**
 * Database Localization - Main Export File
 *
 * This file exports all the database localization utilities and services.
 * Import from this file to get access to the complete localization system.
 */

// Core types and interfaces
export * from "./types";

// Services
export { DatabaseTranslationService } from "./translation-service";
export { DatabaseLocalizationService } from "./database-localization-service";

// Helper functions
export * from "./helpers";

// Middleware
export * from "./middleware";

// Re-export commonly used items for convenience
export {
  initializeLocalization,
  getLocalizationService,
  createLocalizationService,
  getLocalizedField,
  setLocalizedField,
  getLocalizedModel,
  getLocalizedModels,
  addTranslations,
  hasTranslationsForLocale,
  getTranslationCompletion,
  getMissingTranslations,
  createLocalizedQuery,
  isValidLocale,
  getLocaleFromRequest,
  getLocalizationContextFromRequest,
} from "./helpers";

export {
  withLocalization,
  getLocalizedDataFromContext,
  setLocalizedDataFromContext,
  addTranslationFromContext,
  createLocalizedResponse,
  createLocalizedBatchResponse,
  handleLocalizationError,
} from "./middleware";
