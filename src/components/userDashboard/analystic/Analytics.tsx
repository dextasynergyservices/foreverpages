"use client";

import React from "react";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";
import { AnalyticsHeader } from "./AnalyticsHeader";
import { StatsGrid } from "./StatsGrid";
import { ChartsSection } from "./ChartsSection";
import { ActivityAndSummary } from "./ActivityAndSummary";

const Analytics = () => {
  const { t } = useTranslations();
  const { theme } = useTheme();

  const stats = [
    {
      title: "Total Visits",
      value: "2,847",
      change: "+12%",
      trend: "up",
      icon: "Eye",
      description: "Page views this month",
    },
    {
      title: "Unique Visitors",
      value: "1,429",
      change: "+8%",
      trend: "up",
      icon: "Users",
      description: "Individual visitors",
    },
    {
      title: "Tribute Messages",
      value: "47",
      change: "+5",
      trend: "up",
      icon: "Heart",
      description: "New tributes this week",
    },
    {
      title: "Memorial Shares",
      value: "156",
      change: "+23%",
      trend: "up",
      icon: "TrendingUp",
      description: "Social media shares",
    },
  ];

  const recentActivity = [
    { action: "New tribute from Emma Rodriguez", time: "2 hours ago", type: "tribute" },
    { action: "Photo uploaded to gallery", time: "4 hours ago", type: "media" },
    { action: "Memorial page viewed 15 times", time: "6 hours ago", type: "view" },
    { action: "Service invitation sent to 25 people", time: "1 day ago", type: "invitation" },
    { action: "Memorial page shared on Facebook", time: "2 days ago", type: "share" },
  ];

  const topPages = [
    { page: "Memorial Home", views: 1247, percentage: 44 },
    { page: "Photo Gallery", views: 623, percentage: 22 },
    { page: "Tribute Wall", views: 445, percentage: 16 },
    { page: "Service Information", views: 332, percentage: 12 },
    { page: "Biography", views: 200, percentage: 7 },
  ];

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
