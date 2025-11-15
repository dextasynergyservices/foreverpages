import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";

export interface RenewalData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  badgeText: string | null;
  badgeColor: string | null;
  features: Record<string, string> | null;
  priceNGN: string;
  priceUSD: string;
  priceGBP: string;
  priceEUR: string;
  currency: string;
  isActive: boolean;
}

interface RenewalsResponse {
  success: boolean;
  data: RenewalData[];
  error?: string;
}

/**
 * Hook to fetch available renewal options (Forever Access)
 */
export function useRenewals() {
  const { locale } = useLanguage();

  return useQuery<RenewalData[]>({
    queryKey: ["renewals", locale],
    queryFn: async () => {
      const response = await fetch(`/api/renewals?lang=${locale}`);
      if (!response.ok) {
        throw new Error("Failed to fetch renewals");
      }
      const result: RenewalsResponse = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch renewals");
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
