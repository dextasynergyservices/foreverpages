"use client";

import { useQuery } from "@tanstack/react-query";
import type { CountryCode } from "@/app/api/country-codes/route";

interface CountryCodesResponse {
  success: boolean;
  data: CountryCode[];
  count: number;
  error?: string;
}

export function useCountryCodes() {
  return useQuery({
    queryKey: ["country-codes"],
    queryFn: async (): Promise<CountryCode[]> => {
      const response = await fetch("/api/country-codes");
      if (!response.ok) {
        throw new Error("Failed to fetch country codes");
      }
      const result: CountryCodesResponse = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch country codes");
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
