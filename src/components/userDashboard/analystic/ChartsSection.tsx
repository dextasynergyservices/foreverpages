import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";

interface TopPage {
  pageKey: string;
  views: number;
  percentage: number;
}

interface ChartsSectionProps {
  topPages: TopPage[];
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({ topPages }) => {
  const { theme } = useTheme();
  const { t } = useTranslations();

  // Invert card/background/text color intentionally per request:
  // - On light theme: card background should be black with white text
  // - On dark theme: card background should be white with black text
  const cardBorder = theme === "dark" ? "border-white" : "border-black";
  const cardBg = theme === "dark" ? "bg-black text-white" : "bg-white text-black";
  const textMuted = theme === "dark" ? "text-black/70" : "text-white/70";
  const bgMuted = theme === "dark" ? "bg-black/10" : "bg-white/10";

  const progressFillClass = cardBg.includes("bg-black") ? "bg-white" : "bg-black";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8 p-4 md:p-8 pt-0 md:pt-0">
      {/* Visitor Chart */}
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
          <div className={`h-64 rounded-lg flex items-center justify-center ${bgMuted}`}>
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-60" />
              <p className={textMuted}>Interactive chart would display here</p>
              <p className={`text-sm mt-1 ${textMuted}`}>Showing visitor patterns and trends</p>
            </div>
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
        </CardContent>
      </Card>
    </div>
  );
};
