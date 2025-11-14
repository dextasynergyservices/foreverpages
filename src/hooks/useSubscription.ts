import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";

export interface SubscriptionData {
  hasActiveSubscription: boolean;
  hasLifetimeAccess?: boolean;
  subscription?: {
    id: string;
    status: string;
    startDate: string;
    expiresAt: string;
    autoRenew: boolean;
  };
  plan: {
    id: string;
    name: string;
    nameKey?: string;
    slug: string;
    description?: string;
    descriptionKey?: string;
    priceNGN: string;
    priceUSD?: string;
    priceGBP?: string;
    priceEUR?: string;
    currency: string;
    durationDays: number;
    badgeText?: string;
    badgeTextKey?: string;
    badgeColor?: string;
  };
  renewal?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    priceNGN: string;
    priceUSD?: string;
    priceGBP?: string;
    priceEUR?: string;
    badgeText?: string;
    badgeColor?: string;
  };
  daysRemaining: number;
  status: "ACTIVE" | "EXPIRED" | "CANCELED" | "PENDING_PAYMENT" | "GRACE_PERIOD";
  statusKey?: string;
  alertLevel: "none" | "info" | "warning" | "critical" | "expired" | "grace";
  shouldShowRenewButton?: boolean;
  shouldSendEmail?: boolean;
}

interface SubscriptionResponse {
  success: boolean;
  data?: SubscriptionData;
  error?: string;
}

/**
 * Hook to fetch and manage user subscription status
 * Calculates days remaining, alert levels, and renewal requirements
 */
export function useSubscription() {
  const { locale } = useLanguage();

  return useQuery<SubscriptionResponse>({
    queryKey: ["subscription", locale],
    queryFn: async () => {
      const response = await fetch(`/api/user/subscription?lang=${locale}`);

      if (!response.ok) {
        throw new Error("Failed to fetch subscription");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

/**
 * Get color scheme based on alert level
 */
export function getAlertColors(alertLevel: SubscriptionData["alertLevel"]) {
  const colorSchemes = {
    none: {
      bg: "bg-green-50 dark:bg-green-950",
      border: "border-green-200 dark:border-green-800",
      text: "text-green-900 dark:text-green-100",
      badge: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
      progress: "bg-green-500",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-950",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-900 dark:text-blue-100",
      badge: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
      progress: "bg-blue-500",
    },
    warning: {
      bg: "bg-yellow-50 dark:bg-yellow-950",
      border: "border-yellow-200 dark:border-yellow-800",
      text: "text-yellow-900 dark:text-yellow-100",
      badge: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
      progress: "bg-yellow-500",
    },
    critical: {
      bg: "bg-red-50 dark:bg-red-950",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-900 dark:text-red-100",
      badge: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
      progress: "bg-red-500",
    },
    grace: {
      bg: "bg-orange-50 dark:bg-orange-950",
      border: "border-orange-200 dark:border-orange-800",
      text: "text-orange-900 dark:text-orange-100",
      badge: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
      progress: "bg-orange-500",
    },
    expired: {
      bg: "bg-gray-50 dark:bg-gray-950",
      border: "border-gray-200 dark:border-gray-800",
      text: "text-gray-900 dark:text-gray-100",
      badge: "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200",
      progress: "bg-gray-400",
    },
  };

  return colorSchemes[alertLevel];
}

/**
 * Format expiration date
 */
export function formatExpirationDate(expiresAt: string, locale = "en"): string {
  const date = new Date(expiresAt);
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Calculate progress percentage for visual display
 */
export function calculateProgress(daysRemaining: number, totalDays: number): number {
  if (daysRemaining <= 0) return 0;
  if (daysRemaining >= totalDays) return 100;
  return Math.round((daysRemaining / totalDays) * 100);
}
