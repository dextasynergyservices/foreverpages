"use client";

/**
 * Modern Donut/Pie Chart Component using Tremor
 * Replaces the old Recharts implementation with a more professional look
 */

import { Card, DonutChart as TremorDonutChart, Title, Text } from "@tremor/react";

interface PieChartData {
  name: string;
  value: number;
}

interface AnalyticsDonutChartProps {
  data: PieChartData[];
  title: string;
  subtitle?: string;
  colors?: string[];
  centerLabel?: string;
  centerValue?: string | number;
}

const defaultTremorColors = ["purple", "cyan", "emerald", "amber", "rose", "indigo", "teal"];

export function AnalyticsDonutChart({
  data,
  title,
  subtitle,
  colors = defaultTremorColors,
  centerLabel,
}: AnalyticsDonutChartProps) {
  const total = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <Card className="ring-1 ring-gray-200 dark:ring-gray-700 dark:bg-gray-800">
      <Title className="dark:text-white">{title}</Title>
      {subtitle && <Text className="dark:text-gray-300">{subtitle}</Text>}
      <div className="relative">
        <TremorDonutChart
          className="mt-4 h-72"
          data={data}
          category="value"
          index="name"
          colors={colors}
          showAnimation={true}
          showLabel={false}
        />
        {centerLabel && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center" style={{ marginTop: "-2rem" }}>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {total.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{centerLabel}</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// Keep the old PieChart export for backward compatibility
export function AnalyticsPieChart(props: AnalyticsDonutChartProps) {
  return <AnalyticsDonutChart {...props} />;
}
