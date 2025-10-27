import { SupportedLocale, DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./types/i18n";

// Lazy load translations to reduce initial bundle size
const translationCache = new Map<SupportedLocale, Record<string, unknown>>();

async function loadTranslations(locale: SupportedLocale) {
  if (translationCache.has(locale)) {
    return translationCache.get(locale);
  }

  try {
    const translations = await import(`./locales/${locale}.json`);
    translationCache.set(locale, translations.default);
    return translations.default;
  } catch {
    console.warn(`Failed to load translations for ${locale}, falling back to ${DEFAULT_LOCALE}`);
    if (locale !== DEFAULT_LOCALE) {
      return loadTranslations(DEFAULT_LOCALE);
    }
    return {};
  }
}

// Optimized translation function
export async function getTranslation(locale: SupportedLocale) {
  return await loadTranslations(locale);
}

// Get nested translation value by key path
export async function getTranslationValue(
  locale: SupportedLocale,
  key: string,
  fallback?: string
): Promise<string> {
  const translation = await getTranslation(locale);
  const keys = key.split(".");

  let value: unknown = translation;
  for (const k of keys) {
    if (value && typeof value === "object" && k in (value as object)) {
      value = (value as Record<string, unknown>)[k];
    } else {
      // Fallback to English if key not found
      if (locale !== DEFAULT_LOCALE) {
        const englishTranslation = await getTranslation(DEFAULT_LOCALE);
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

export type { SupportedLocale } from "./types/i18n";
