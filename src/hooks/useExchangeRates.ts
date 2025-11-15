/**
 * Exchange Rates Hook
 * Fetches and caches exchange rates using TanStack Query
 * Auto-refreshes hourly with fallback rates
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import type { Currency } from "@/components/CurrencySelector";

interface ExchangeRates {
  NGN: number;
  USD: number;
  GBP: number;
  EUR: number;
  lastUpdated: string;
}

interface ExchangeRatesResponse {
  rates: ExchangeRates;
  success: boolean;
  error?: string;
}

// Fallback rates (updated periodically)
const FALLBACK_RATES: ExchangeRates = {
  NGN: 1,
  USD: 0.0012, // 1 NGN ≈ 0.0012 USD
  GBP: 0.00095, // 1 NGN ≈ 0.00095 GBP
  EUR: 0.0011, // 1 NGN ≈ 0.0011 EUR
  lastUpdated: new Date().toISOString(),
};

/**
 * Fetches current exchange rates from API
 */
async function fetchExchangeRates(): Promise<ExchangeRates> {
  try {
    const response = await fetch("/api/exchange-rates");

    if (!response.ok) {
      console.warn("Exchange rates API failed, using fallback rates");
      return FALLBACK_RATES;
    }

    const data: ExchangeRatesResponse = await response.json();

    if (!data.success || !data.rates) {
      console.warn("Invalid exchange rates response, using fallback rates");
      return FALLBACK_RATES;
    }

    return data.rates;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    return FALLBACK_RATES;
  }
}

/**
 * Hook to get exchange rates with caching and auto-refresh
 */
export function useExchangeRates() {
  const query = useQuery({
    queryKey: ["exchangeRates"],
    queryFn: fetchExchangeRates,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2, // 2 hours (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchInterval: 1000 * 60 * 60, // Refetch every hour
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    rates: query.data || FALLBACK_RATES,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Convert amount from NGN to target currency
 */
export function convertCurrency(
  amountInNGN: number,
  targetCurrency: Currency,
  rates: ExchangeRates
): number {
  if (targetCurrency === "NGN") {
    return amountInNGN;
  }

  const rate = rates[targetCurrency];
  return amountInNGN * rate;
}

/**
 * Format currency amount with proper symbol and decimals
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const symbols: Record<Currency, string> = {
    NGN: "₦",
    USD: "$",
    GBP: "£",
    EUR: "€",
  };

  const decimals = currency === "NGN" ? 0 : 2;

  return `${symbols[currency]}${amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export type { ExchangeRates };
