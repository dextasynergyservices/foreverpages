import { NextResponse } from "next/server";

/**
 * Exchange Rates API Endpoint
 *
 * Provides real-time currency exchange rates relative to NGN (Nigerian Naira).
 *
 * Supported Currencies:
 * - NGN: Nigerian Naira (base currency)
 * - USD: US Dollar
 * - GBP: British Pound
 * - EUR: Euro
 *
 * Response Format:
 * {
 *   "rates": {
 *     "NGN": 1,
 *     "USD": 0.0013,
 *     "GBP": 0.001,
 *     "EUR": 0.0012
 *   },
 *   "base": "NGN",
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 *
 * NOTE: In production, integrate with a real exchange rate API service like:
 * - Fixer.io
 * - ExchangeRate-API
 * - Open Exchange Rates
 * - Xe.com API
 */

interface ExchangeRates {
  NGN: number;
  USD: number;
  GBP: number;
  EUR: number;
}

interface ExchangeRateResponse {
  rates: ExchangeRates;
  base: string;
  timestamp: string;
  source: string;
}

/**
 * Fallback exchange rates (updated periodically)
 * These rates are approximate and should be replaced with real-time data in production
 * Last updated: January 2024
 */
const FALLBACK_RATES: ExchangeRates = {
  NGN: 1,
  USD: 0.0013, // 1 NGN ≈ 0.0013 USD (1 USD ≈ 770 NGN)
  GBP: 0.001, // 1 NGN ≈ 0.001 GBP (1 GBP ≈ 1000 NGN)
  EUR: 0.0012, // 1 NGN ≈ 0.0012 EUR (1 EUR ≈ 833 NGN)
};

/**
 * Fetch exchange rates from external API
 * Replace this with your preferred exchange rate provider
 */
async function fetchExternalRates(): Promise<ExchangeRates | null> {
  try {
    // TODO: Replace with actual API call in production
    // Example using ExchangeRate-API (free tier available):
    // const response = await fetch(
    //   `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/latest/NGN`,
    //   { next: { revalidate: 3600 } } // Cache for 1 hour
    // );
    //
    // if (!response.ok) {
    //   throw new Error(`Exchange rate API error: ${response.status}`);
    // }
    //
    // const data = await response.json();
    // return {
    //   NGN: 1,
    //   USD: data.conversion_rates.USD,
    //   GBP: data.conversion_rates.GBP,
    //   EUR: data.conversion_rates.EUR,
    // };

    // For now, return null to use fallback rates
    return null;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    return null;
  }
}

/**
 * GET /api/exchange-rates
 *
 * Returns current exchange rates for all supported currencies
 */
export async function GET() {
  try {
    // Try to fetch real-time rates
    let rates = await fetchExternalRates();

    // Use fallback rates if external API fails
    if (!rates) {
      rates = FALLBACK_RATES;
    }

    const response: ExchangeRateResponse = {
      rates,
      base: "NGN",
      timestamp: new Date().toISOString(),
      source: rates === FALLBACK_RATES ? "fallback" : "external",
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        // Cache for 1 hour (3600 seconds)
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("Exchange rates API error:", error);

    // Return fallback rates even on error
    const response: ExchangeRateResponse = {
      rates: FALLBACK_RATES,
      base: "NGN",
      timestamp: new Date().toISOString(),
      source: "fallback",
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  }
}

/**
 * Example integration with ExchangeRate-API:
 *
 * 1. Sign up at https://www.exchangerate-api.com/ (free tier available)
 * 2. Add API key to .env.local:
 *    EXCHANGE_RATE_API_KEY=your_api_key_here
 * 3. Uncomment the fetch code in fetchExternalRates()
 *
 * Alternative providers:
 * - Fixer.io: https://fixer.io/
 * - Open Exchange Rates: https://openexchangerates.org/
 * - Currency API: https://currencyapi.com/
 * - Abstract API: https://www.abstractapi.com/currency-exchange-rates-api
 */
