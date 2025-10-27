"use client";

import { useLanguage } from "../contexts/LanguageContext";
import {
  t as translationFunction,
  tp as pluralTranslationFunction,
  formatNumber as formatNumberUtil,
  formatDate as formatDateUtil,
  formatCurrency as formatCurrencyUtil,
} from "../lib/utils/translation";

export function useTranslations() {
  const { locale, setLocale, isLoading } = useLanguage();

  // Main translation function
  const t = (
    key: string,
    variables?: Record<string, string | number>,
    fallback?: string
  ): string => {
    if (isLoading) return fallback || key;
    return translationFunction(locale, key, variables, fallback);
  };

  // Pluralized translation function
  const tp = (key: string, count: number, variables?: Record<string, string | number>): string => {
    if (isLoading) return key;
    return pluralTranslationFunction(locale, key, count, variables);
  };

  // Number formatting
  const formatNumber = (number: number): string => {
    if (isLoading) return number.toString();
    return formatNumberUtil(locale, number);
  };

  // Date formatting
  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    if (isLoading) {
      if (date instanceof Date) return date.toLocaleDateString();
      return date.toString();
    }
    return formatDateUtil(locale, date, options);
  };

  // Currency formatting
  const formatCurrency = (amount: number, currency: string = "USD"): string => {
    if (isLoading) return `${currency} ${amount}`;
    return formatCurrencyUtil(locale, amount, currency);
  };

  return {
    t,
    tp,
    formatNumber,
    formatDate,
    formatCurrency,
    locale,
    setLocale,
    isLoading,
  };
}

// Hook for getting current locale without translations
export function useLocale() {
  const { locale, isLoading } = useLanguage();
  return { locale, isLoading };
}

// Hook for changing locale
export function useSetLocale() {
  const { setLocale } = useLanguage();
  return setLocale;
}
