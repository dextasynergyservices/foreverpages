import { useQuery } from "@tanstack/react-query";
import { useLocale } from "./useTranslations";

export interface PlanFeatures {
  [key: string]: string;
}

export interface Plan {
  id: string;
  slug: string;
  name: string;
  description: string;
  // Multi-currency pricing
  priceNGN: string;
  priceUSD: string | null;
  priceGBP: string | null;
  priceEUR: string | null;
  currency: string;
  durationDays: number;
  isPopular: boolean;
  badgeText: string | null;
  badgeColor: string | null;
  features: PlanFeatures;
  limits: {
    maxMemorials: number;
    maxPhotosPerMemorial: number;
    maxVideosPerMemorial: number;
    maxAdmins: number;
    maxContributors: number;
    storageQuotaMB: number;
  };
  permissions: {
    allowRSVP: boolean;
    allowGuestbook: boolean;
    allowVirtualTributes: boolean;
  };
}

async function fetchPlans(locale: string): Promise<Plan[]> {
  const response = await fetch(`/api/plans?lang=${locale}`);

  if (!response.ok) {
    throw new Error("Failed to fetch plans");
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to fetch plans");
  }

  return data.data;
}

export const usePlans = () => {
  const { locale } = useLocale();

  return useQuery({
    queryKey: ["plans", locale],
    queryFn: () => fetchPlans(locale),
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Cache for 30 minutes (renamed from cacheTime in v5)
    retry: 2,
    refetchOnWindowFocus: false, // Don't refetch when user returns to tab
  });
};
