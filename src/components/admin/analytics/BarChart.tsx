"use client";

/**
 * Modern Bar Chart Component using Tremor
 * Replaces the old Recharts implementation with a more professional look
 */

import { Card, BarList, Title, Text } from "@tremor/react";

interface BarChartData {
  name: string;
  value: number;
}

interface AnalyticsBarChartProps {
  data: BarChartData[];
  title: string;
  subtitle?: string;
  color?: string;
}

export function AnalyticsBarChart({
  data,
  title,
  subtitle,
  color = "purple",
}: AnalyticsBarChartProps) {
  // Map color names to Tremor color palette
  const colorMap: Record<string, string> = {
    purple: "purple",
    green: "emerald",
    blue: "blue",
    cyan: "cyan",
    amber: "amber",
    red: "red",
    indigo: "indigo",
  };

  const tremorColor = colorMap[color] || "purple";

  return (
    <Card className="ring-1 ring-gray-200 dark:ring-gray-700 dark:bg-gray-800">
      <Title className="dark:text-white">{title}</Title>
      {subtitle && <Text className="dark:text-gray-300">{subtitle}</Text>}
      <BarList data={data} className="mt-4" color={tremorColor} showAnimation={true} />
    </Card>
  );
}
