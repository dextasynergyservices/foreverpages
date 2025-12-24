"use client";

/**
 * Modern Stats Card Components using Tremor
 * Enhanced with better visuals and responsiveness
 */

import { Card, Metric, Text, Flex, BadgeDelta } from "@tremor/react";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color?: "purple" | "green" | "blue" | "indigo" | "amber" | "rose" | "cyan" | "teal";
  subtitle?: string;
}

const colorStyles = {
  purple: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-900 dark:text-gray-100",
    decoration: "slate" as const,
  },
  green: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
    decoration: "emerald" as const,
  },
  blue: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-900 dark:text-gray-100",
    decoration: "slate" as const,
  },
  indigo: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-900 dark:text-gray-100",
    decoration: "slate" as const,
  },
  amber: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    decoration: "amber" as const,
  },
  rose: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-300",
    decoration: "red" as const,
  },
  cyan: {
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
    text: "text-cyan-700 dark:text-cyan-300",
    decoration: "cyan" as const,
  },
  teal: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-900 dark:text-gray-100",
    decoration: "slate" as const,
  },
};

export function StatsCard({
  title,
  value,
  icon,
  trend,
  color = "purple",
  subtitle,
}: StatsCardProps) {
  const styles = colorStyles[color];

  return (
    <Card decoration="top" decorationColor={styles.decoration}>
      <Flex justifyContent="between" alignItems="start">
        <div className="flex-1">
          <Text className="dark:text-gray-300">{title}</Text>
          <Metric className="mt-2 dark:text-white">{value}</Metric>

          {trend && (
            <BadgeDelta
              deltaType={trend.value > 0 ? "increase" : trend.value < 0 ? "decrease" : "unchanged"}
              className="mt-2"
            >
              {trend.value > 0 && "+"}
              {trend.value.toFixed(1)}% {trend.label}
            </BadgeDelta>
          )}

          {subtitle && !trend && <Text className="mt-1 dark:text-gray-400">{subtitle}</Text>}
        </div>

        <div className={`rounded-xl p-3 ${styles.bg} ring-1 ring-${color}-500/20`}>
          <div className={styles.text}>{icon}</div>
        </div>
      </Flex>
    </Card>
  );
}

// Large stats card with sparkline
interface LargeStatsCardProps extends StatsCardProps {
  sparklineData?: number[];
}

export function LargeStatsCard({
  title,
  value,
  icon,
  trend,
  color = "purple",
  sparklineData,
}: LargeStatsCardProps) {
  const styles = colorStyles[color];

  // Simple SVG sparkline renderer
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;

    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    const width = 120;
    const height = 40;

    const points = sparklineData
      .map((val, i) => {
        const x = (i / (sparklineData.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");

    const colorMap: Record<string, string> = {
      purple: "#1f2937",
      green: "#10b981",
      blue: "#1f2937",
      indigo: "#1f2937",
      amber: "#f59e0b",
      rose: "#ef4444",
      cyan: "#06b6d4",
      teal: "#1f2937",
    };

    const strokeColor = colorMap[color] || "#1f2937";

    return (
      <svg width={width} height={height} className="opacity-70">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <Card
      decoration="top"
      decorationColor={styles.decoration}
      className="relative overflow-hidden dark:bg-gray-800"
    >
      {/* Decorative gradient background */}
      <div
        className={`absolute top-0 right-0 h-32 w-32 rounded-full ${styles.bg} opacity-30 blur-3xl`}
      />

      <div className="relative">
        <Flex justifyContent="start" alignItems="center" className="gap-3">
          <div className={`rounded-xl p-3 ${styles.bg}`}>
            <div className={styles.text}>{icon}</div>
          </div>
          <div>
            <Text className="dark:text-gray-300">{title}</Text>
            {trend && (
              <BadgeDelta
                deltaType={
                  trend.value > 0 ? "increase" : trend.value < 0 ? "decrease" : "unchanged"
                }
                size="xs"
              >
                {trend.value > 0 && "+"}
                {trend.value.toFixed(1)}% {trend.label}
              </BadgeDelta>
            )}
          </div>
        </Flex>

        <Flex justifyContent="between" alignItems="end" className="mt-4">
          <Metric className="dark:text-white">{value}</Metric>
          {sparklineData && sparklineData.length > 0 && (
            <div className="w-32">{renderSparkline()}</div>
          )}
        </Flex>
      </div>
    </Card>
  );
}
