/**
 * Currency Converter Service
 *
 * Provides real-time currency conversion using ExchangeRate-API
 * with fallback to hardcoded rates and 1-hour caching
 */

export type SupportedCurrency = "NGN" | "USD" | "GBP" | "EUR";

export interface ExchangeRates {
  base: SupportedCurrency;
  timestamp: number;
  rates: {
    NGN: number;
    USD: number;
    GBP: number;
    EUR: number;
  };
}

interface ExchangeRateAPIResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: {
    [key: string]: number;
  };
}

// Fallback rates (updated November 2025)
const FALLBACK_RATES: ExchangeRates = {
  base: "NGN",
  timestamp: Date.now(),
  rates: {
    NGN: 1,
    USD: 0.00061, // 1 NGN = 0.00061 USD (1,640 NGN = 1 USD)
    GBP: 0.00048, // 1 NGN = 0.00048 GBP (2,083 NGN = 1 GBP)
    EUR: 0.00056, // 1 NGN = 0.00056 EUR (1,786 NGN = 1 EUR)
  },
};

// Cache for exchange rates (1 hour TTL)
let cachedRates: ExchangeRates | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetch exchange rates from ExchangeRate-API
 * Uses NGN as base currency
 */
async function fetchExchangeRates(): Promise<ExchangeRates> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ EXCHANGE_RATE_API_KEY not configured. Using fallback rates.");
    return FALLBACK_RATES;
  }

  try {
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/NGN`, {
      next: { revalidate: 3600 }, // Cache for 1 hour in Next.js
    });

    if (!response.ok) {
      throw new Error(`ExchangeRate API error: ${response.status} ${response.statusText}`);
    }

    const data: ExchangeRateAPIResponse = await response.json();

    if (data.result !== "success") {
      throw new Error("ExchangeRate API returned unsuccessful result");
    }

    const rates: ExchangeRates = {
      base: "NGN",
      timestamp: data.time_last_update_unix * 1000,
      rates: {
        NGN: data.conversion_rates.NGN || 1,
        USD: data.conversion_rates.USD || FALLBACK_RATES.rates.USD,
        GBP: data.conversion_rates.GBP || FALLBACK_RATES.rates.GBP,
        EUR: data.conversion_rates.EUR || FALLBACK_RATES.rates.EUR,
      },
    };

    // Update cache
    cachedRates = rates;
    lastFetchTime = Date.now();

    console.log("✅ Exchange rates fetched successfully");
    return rates;
  } catch (error) {
    console.error("❌ Failed to fetch exchange rates:", error);
    console.log("🔄 Using fallback rates");
    return FALLBACK_RATES;
  }
}

/**
 * Get current exchange rates (with caching)
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  const now = Date.now();

  // Return cached rates if still valid
  if (cachedRates && now - lastFetchTime < CACHE_DURATION) {
    console.log("📦 Using cached exchange rates");
    return cachedRates;
  }

  // Fetch fresh rates
  return await fetchExchangeRates();
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency
): Promise<number> {
  if (from === to) return amount;

  const rates = await getExchangeRates();

  // Convert to NGN first (base currency)
  const amountInNGN = from === "NGN" ? amount : amount / rates.rates[from];

  // Convert from NGN to target currency
  const convertedAmount = to === "NGN" ? amountInNGN : amountInNGN * rates.rates[to];

  return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
}

/**
 * Get plan price in a specific currency
 * Converts from NGN (base) to requested currency
 */
export async function getPlanPrice(
  priceInNGN: number,
  targetCurrency: SupportedCurrency
): Promise<number> {
  if (targetCurrency === "NGN") return priceInNGN;

  return await convertCurrency(priceInNGN, "NGN", targetCurrency);
}

/**
 * Get exchange rate for a specific currency pair
 */
export async function getExchangeRate(
  from: SupportedCurrency,
  to: SupportedCurrency
): Promise<number> {
  if (from === to) return 1;

  const rates = await getExchangeRates();

  // Calculate rate from 'from' to 'to'
  if (from === "NGN") {
    return rates.rates[to];
  } else if (to === "NGN") {
    return 1 / rates.rates[from];
  } else {
    // Convert via NGN: from -> NGN -> to
    const toNGNRate = 1 / rates.rates[from];
    const fromNGNRate = rates.rates[to];
    return toNGNRate * fromNGNRate;
  }
}

/**
 * Format currency amount with proper symbol and locale
 */
export function formatCurrency(
  amount: number,
  currency: SupportedCurrency,
  locale = "en-US"
): string {
  const symbols: Record<SupportedCurrency, string> = {
    NGN: "₦",
    USD: "$",
    GBP: "£",
    EUR: "€",
  };

  const formattedAmount = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${symbols[currency]}${formattedAmount}`;
}

/**
 * Get currency name
 */
export function getCurrencyName(currency: SupportedCurrency): string {
  const names: Record<SupportedCurrency, string> = {
    NGN: "Nigerian Naira",
    USD: "US Dollar",
    GBP: "British Pound",
    EUR: "Euro",
  };

  return names[currency];
}

/**
 * Clear cached rates (useful for testing or force refresh)
 */
export function clearRateCache(): void {
  cachedRates = null;
  lastFetchTime = 0;
  console.log("🗑️ Exchange rate cache cleared");
}
