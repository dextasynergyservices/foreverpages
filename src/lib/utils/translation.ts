import { SupportedLocale, TranslationKeys } from "../types/i18n";
import { getTranslationValue } from "../i18n";

// Utility function to get translation with interpolation
export function t(
  locale: SupportedLocale,
  key: keyof TranslationKeys | string,
  variables?: Record<string, string | number>,
  fallback?: string
): string {
  let translation = getTranslationValue(locale, key as string, fallback);

  // Replace variables in translation
  if (variables) {
    Object.entries(variables).forEach(([varKey, varValue]) => {
      translation = translation.replace(new RegExp(`{{${varKey}}}`, "g"), String(varValue));
    });
  }

  return translation;
}

// Utility function to get pluralized translation
export function tp(
  locale: SupportedLocale,
  key: string,
  count: number,
  variables?: Record<string, string | number>
): string {
  // For now, we'll use simple pluralization
  // In the future, we can add more sophisticated pluralization rules
  const pluralKey = count === 1 ? key : `${key}_plural`;

  return t(locale, pluralKey, { ...variables, count }, t(locale, key, variables));
}

// Utility function to format numbers according to locale
export function formatNumber(locale: SupportedLocale, number: number): string {
  try {
    return new Intl.NumberFormat(locale).format(number);
  } catch {
    return number.toString();
  }
}

// Utility function to format dates according to locale
export function formatDate(
  locale: SupportedLocale,
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  } catch {
    return date.toString();
  }
}

// Utility function to format currency according to locale
export function formatCurrency(
  locale: SupportedLocale,
  amount: number,
  currency: string = "USD"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

// Utility function to get locale-specific text direction
// export function getTextDirection(_locale: SupportedLocale): "ltr" | "rtl" {
//   // For now, all our supported languages are LTR
//   // In the future, if we add RTL languages, we can update this
//   return "ltr";
// }

export function getTextDirection(): "ltr" | "rtl" {
  // For now, all our supported languages are LTR
  // In the future, if we add RTL languages, we can update this
  return "ltr";
}

// Utility function to validate translation key exists
export function hasTranslationKey(locale: SupportedLocale, key: string): boolean {
  try {
    const translation = getTranslationValue(locale, key);
    return translation !== key; // If it returns the key itself, it means translation not found
  } catch {
    return false;
  }
}
