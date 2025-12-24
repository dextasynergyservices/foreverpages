"use client";

/**
 * Modern Area Chart Component using Tremor
 * Replaces the old Recharts implementation with a more professional look
 */

import { Card, AreaChart as TremorAreaChart, Title, Text } from "@tremor/react";

interface AreaChartData {
  date: string;
  value: number;
}

interface AnalyticsAreaChartProps {
  data: AreaChartData[];
  title: string;
  subtitle?: string;
  color?: string;
  gradientId?: string;
  valueFormatter?: (value: number) => string;
}

export function AnalyticsAreaChart({
  data,
  title,
  subtitle,
  color = "purple",
  valueFormatter,
}: AnalyticsAreaChartProps) {
  // Map color names to Tremor color palette - using monochrome scheme
  const colorMap: Record<string, string> = {
    "#000000": "slate",
    "#10b981": "emerald",
    "#06b6d4": "cyan",
    "#f59e0b": "amber",
    "#ef4444": "red",
    primary: "slate",
    green: "emerald",
    cyan: "cyan",
    amber: "amber",
    red: "red",
  };

  const tremorColor = colorMap[color] || "slate";

  return (
    <Card className="ring-1 ring-gray-200 dark:ring-gray-700 dark:bg-gray-800">
      <Title className="dark:text-white">{title}</Title>
      {subtitle && <Text className="dark:text-gray-300">{subtitle}</Text>}
      <TremorAreaChart
        className="mt-4 h-72"
        data={data}
        index="date"
        categories={["value"]}
        colors={[tremorColor]}
        valueFormatter={valueFormatter}
        showLegend={false}
        showGridLines={false}
        showAnimation={true}
        curveType="natural"
        yAxisWidth={60}
      />
    </Card>
  );
}
