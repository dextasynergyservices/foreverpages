/**
 * Plans with Currency Hook
 * Fetches plans and converts prices to selected currency
 * Combines plan data with real-time exchange rates
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import type { Currency } from "@/components/CurrencySelector";
import { useExchangeRates, formatCurrency } from "./useExchangeRates";
import { useLocale } from "./useTranslations";
import type { Plan } from "./usePlans";

interface PlanWithCurrency extends Plan {
  displayPrice: string;
  displayPriceNumeric: number;
  ngnEquivalent: string;
  selectedCurrency: Currency;
}

interface PlansResponse {
  success: boolean;
  data: Plan[];
}

/**
 * Fetch plans from API
 */
async function fetchPlans(locale: string): Promise<Plan[]> {
  try {
    const response = await fetch(`/api/plans?lang=${locale}`);

    if (!response.ok) {
      throw new Error("Failed to fetch plans");
    }

    const data: PlansResponse = await response.json();

    if (!data.success || !data.data) {
      throw new Error("Failed to fetch plans");
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching plans:", error);
    throw error;
  }
}

/**
 * Hook to get plans with currency-converted prices
 */
export function usePlansWithCurrency(selectedCurrency: Currency) {
  const { rates, isLoading: ratesLoading } = useExchangeRates();
  const { locale } = useLocale();

  const plansQuery = useQuery({
    queryKey: ["plans", locale],
    queryFn: () => fetchPlans(locale),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // Convert plans to selected currency
  const plansWithCurrency: PlanWithCurrency[] | undefined = plansQuery.data?.map((plan) => {
    // Get the price in selected currency from database (stored as string)
    let priceInCurrency: number;
    switch (selectedCurrency) {
      case "NGN":
        priceInCurrency = parseFloat(plan.priceNGN);
        break;
      case "USD":
        priceInCurrency = parseFloat(plan.priceUSD || plan.priceNGN);
        break;
      case "GBP":
        priceInCurrency = parseFloat(plan.priceGBP || plan.priceNGN);
        break;
      case "EUR":
        priceInCurrency = parseFloat(plan.priceEUR || plan.priceNGN);
        break;
      default:
        priceInCurrency = parseFloat(plan.priceNGN);
    }

    // Calculate NGN equivalent for display (if not already NGN)
    let ngnEquivalent = "";
    if (selectedCurrency !== "NGN") {
      // Convert from selected currency back to NGN for reference
      const ngnAmount = priceInCurrency / rates[selectedCurrency];
      ngnEquivalent = `≈ ${formatCurrency(ngnAmount, "NGN")}`;
    }

    return {
      ...plan,
      displayPrice: formatCurrency(priceInCurrency, selectedCurrency),
      displayPriceNumeric: priceInCurrency,
      ngnEquivalent,
      selectedCurrency,
    };
  });

  return {
    plans: plansWithCurrency,
    isLoading: plansQuery.isLoading || ratesLoading,
    isError: plansQuery.isError,
    error: plansQuery.error,
    refetch: plansQuery.refetch,
  };
}

export type { PlanWithCurrency };
