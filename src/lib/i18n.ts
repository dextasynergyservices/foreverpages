import { SupportedLocale, DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./types/i18n";
import enTranslations from "./locales/en.json";
import frTranslations from "./locales/fr.json";
import esTranslations from "./locales/es.json";
import yoTranslations from "./locales/yo.json";
import igTranslations from "./locales/ig.json";
import haTranslations from "./locales/ha.json";

// Translation files mapping
const translations = {
  en: enTranslations,
  fr: frTranslations,
  es: esTranslations,
  yo: yoTranslations,
  ig: igTranslations,
  ha: haTranslations,
} as const;

// Get translation for a specific locale
export function getTranslation(locale: SupportedLocale) {
  return translations[locale] || translations[DEFAULT_LOCALE];
}

// Get nested translation value by key path
export function getTranslationValue(
  locale: SupportedLocale,
  key: string,
  fallback?: string
): string {
  const translation = getTranslation(locale);
  const keys = key.split(".");

  let value: unknown = translation;
  for (const k of keys) {
    if (value && typeof value === "object" && k in (value as object)) {
      value = (value as Record<string, unknown>)[k];
    } else {
      // Fallback to English if key not found
      if (locale !== DEFAULT_LOCALE) {
        const englishTranslation = getTranslation(DEFAULT_LOCALE);
        let englishValue: unknown = englishTranslation;
        for (const k of keys) {
          if (englishValue && typeof englishValue === "object" && k in (englishValue as object)) {
            englishValue = (englishValue as Record<string, unknown>)[k];
          } else {
            return fallback || key;
          }
        }
        return (englishValue as string) || fallback || key;
      }
      return fallback || key;
    }
  }
  return typeof value === "string" ? value : fallback || key;
}

// Check if a locale is supported
export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

// Get browser locale or default
export function getBrowserLocale(): SupportedLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  const browserLocale = navigator.language.split("-")[0];
  return isSupportedLocale(browserLocale) ? browserLocale : DEFAULT_LOCALE;
}

// Get stored locale from localStorage
export function getStoredLocale(): SupportedLocale | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem("locale");
    return stored && isSupportedLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

// Store locale in localStorage
export function storeLocale(locale: SupportedLocale): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("locale", locale);
  } catch {
    // Silently fail if localStorage is not available
  }
}

// Get the current locale (stored > browser > default)
export function getCurrentLocale(): SupportedLocale {
  return getStoredLocale() || getBrowserLocale();
}

// Export all translations for type checking
export { translations };
export type { SupportedLocale } from "./types/i18n";
