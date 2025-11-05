"use client";

import React from "react";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";
import { AnalyticsHeader } from "./AnalyticsHeader";
import { StatsGrid } from "./StatsGrid";
import { ChartsSection } from "./ChartsSection";
import { ActivityAndSummary } from "./ActivityAndSummary";
import { useAnalytics } from "@/hooks/useQueries";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";
import {
  StatsCardSkeleton,
  ChartSkeleton,
  ActivityItemSkeleton,
  Skeleton,
} from "@/components/ui/skeleton";

const Analytics = () => {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const { data: analyticsData, isLoading, error } = useAnalytics();

  const themeClasses = {
    cardBorder: theme === "dark" ? "border-white/10" : "border-gray-200",
    cardBg: theme === "dark" ? "bg-black" : "bg-white",
    textMuted: theme === "dark" ? "text-white/70" : "text-gray-600",
    bgMuted: theme === "dark" ? "bg-white/10" : "bg-gray-100",
  };

  // Create a type-safe wrapper for the t function
  const safeT = (key: string, params?: unknown, fallback?: string): string => {
    return t(key, params as Record<string, string | number> | undefined, fallback);
  };

  if (isLoading) {
    return (
      <div
        className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
      >
        <AnalyticsHeader theme={theme} t={safeT} />

        {/* Loading Stats Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Loading Charts and Activity */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartSkeleton />
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <ActivityItemSkeleton key={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analyticsData?.data) {
    return (
      <QueryErrorBoundary>
        <div
          className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
        >
          <AnalyticsHeader theme={theme} t={safeT} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {t("analytics.error", {}, "Unable to load analytics data")}
              </p>
            </div>
          </div>
        </div>
      </QueryErrorBoundary>
    );
  }

  const { stats, recentActivity, topPages } = analyticsData.data;

  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      <AnalyticsHeader theme={theme} t={safeT} />

      <StatsGrid stats={stats} themeClasses={themeClasses} />

      <ChartsSection topPages={topPages} t={safeT} />

      <ActivityAndSummary recentActivity={recentActivity} themeClasses={themeClasses} t={safeT} />
    </div>
  );
};

export default Analytics;
