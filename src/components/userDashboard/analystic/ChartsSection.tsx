import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

interface TopPage {
  pageKey: string;
  views: number;
  percentage: number;
}

interface DailyVisitorData {
  date: string;
  visitors: number;
}

interface ChartsSectionProps {
  topPages: TopPage[];
  dailyVisitorTrends?: DailyVisitorData[];
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  topPages,
  dailyVisitorTrends = [],
}) => {
  const { theme } = useTheme();
  const { t } = useTranslations();

  // Text colors: black on light mode, white on dark mode
  const cardBorder = theme === "dark" ? "border-white/20" : "border-black/20";
  const cardBg = theme === "dark" ? "bg-black text-white" : "bg-white text-black";
  const textMuted = theme === "dark" ? "text-white/70" : "text-black/70";
  const bgMuted = theme === "dark" ? "bg-white/10" : "bg-black/10";
  const progressFillClass = theme === "dark" ? "bg-white" : "bg-black";

  // Chart colors based on theme
  const chartStrokeColor = theme === "dark" ? "#ffffff" : "#000000";
  const chartFillColor = theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";
  const gridColor = theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";
  const axisColor = theme === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)";

  // Format chart data with short date labels
  const chartData = dailyVisitorTrends.map((item) => ({
    ...item,
    dateLabel: format(parseISO(item.date), "MMM d"),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8 p-4 md:p-8 pt-0 md:pt-0">
      {/* Visitor Trends Chart */}
      <Card className={`border ${cardBorder} ${cardBg} shadow-sm`}>
        <CardHeader className="flex flex-col space-y-1.5 p-4 md:p-6">
          <CardTitle className="text-xl md:text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t("dashboard.analytics.visitorTrends.title")}
          </CardTitle>
          <CardDescription className={`text-sm ${textMuted}`}>
            {t("dashboard.analytics.visitorTrends.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartStrokeColor} stopOpacity={0.4} />
                      <stop offset="50%" stopColor={chartFillColor} stopOpacity={1} />
                      <stop offset="95%" stopColor={chartStrokeColor} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis
                    dataKey="dateLabel"
                    stroke={axisColor}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    tick={{ fill: axisColor }}
                  />
                  <YAxis
                    stroke={axisColor}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: axisColor }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === "dark" ? "#1f1f1f" : "#ffffff",
                      border: `1px solid ${theme === "dark" ? "#333" : "#e5e5e5"}`,
                      borderRadius: "8px",
                      color: theme === "dark" ? "#ffffff" : "#000000",
                    }}
                    labelStyle={{ color: theme === "dark" ? "#ffffff" : "#000000" }}
                    formatter={(value) => [
                      value ?? 0,
                      t("dashboard.analytics.visitorTrends.visitors", {}, "Visitors"),
                    ]}
                    labelFormatter={(label) => String(label)}
                  />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stroke={chartStrokeColor}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#visitorGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className={`h-full rounded-lg flex items-center justify-center ${bgMuted}`}>
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-60" />
                  <p className={textMuted}>
                    {t("dashboard.analytics.noData", {}, "No visitor data available yet")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Pages */}
      <Card className={`border ${cardBorder} ${cardBg} shadow-sm`}>
        <CardHeader className="flex flex-col space-y-1.5 p-4 md:p-6">
          <CardTitle className="text-xl md:text-2xl font-semibold leading-none tracking-tight">
            {t("dashboard.analytics.mostVisited.title")}
          </CardTitle>
          <CardDescription className={`text-sm ${textMuted}`}>
            {t("dashboard.analytics.mostVisited.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          {topPages.length > 0 ? (
            <div className="space-y-4">
              {topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{t(page.pageKey)}</span>
                      <span className={`text-sm ${textMuted}`}>
                        {page.views} {t("dashboard.analytics.mostVisited.views")}
                      </span>
                    </div>
                    <div className={`w-full rounded-full h-2 ${bgMuted}`}>
                      <div
                        className={`rounded-full h-2 transition-all ${progressFillClass}`}
                        style={{ width: `${page.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`h-48 rounded-lg flex items-center justify-center ${bgMuted}`}>
              <p className={textMuted}>
                {t("dashboard.analytics.noData", {}, "No page data available yet")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
