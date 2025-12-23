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
async function fetchExternalRates(baseCurrency: string = "USD"): Promise<ExchangeRates | null> {
  try {
    // Use the EXCHANGE_RATE_API_KEY environment variable
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;

    if (!apiKey) {
      console.warn("EXCHANGE_RATE_API_KEY not configured. Using fallback rates.");
      return null;
    }

    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.result === "success" && data.conversion_rates) {
      return data.conversion_rates;
    } else {
      throw new Error("Invalid API response format");
    }
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    return null;
  }
}

/**
 * GET /api/exchange-rates?base=USD
 *
 * Returns current exchange rates for all supported currencies
 */
export async function GET(request: Request) {
  try {
    // Get base currency from query params (default to USD)
    const { searchParams } = new URL(request.url);
    const baseCurrency = searchParams.get("base") || "USD";

    // Try to fetch real-time rates
    let rates = await fetchExternalRates(baseCurrency);

    // Use fallback rates if external API fails
    if (!rates) {
      rates = FALLBACK_RATES;
    }

    const response: ExchangeRateResponse = {
      rates,
      base: baseCurrency,
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
