import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

interface ThemeClasses {
  cardBorder: string;
  cardBg: string;
  textMuted: string;
  bgMuted: string;
}

interface MemorialSummaryProps {
  themeClasses: ThemeClasses;
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export const MemorialSummary: React.FC<MemorialSummaryProps> = ({ t }) => {
  const { theme } = useTheme();

  const cardBorder = theme === "dark" ? "border-white" : "border-black";
  const cardBg = theme === "dark" ? "bg-black text-white" : "bg-white text-black";
  const textMuted = theme === "dark" ? "text-black/70" : "text-white/70";
  const bgMuted = theme === "dark" ? "bg-black/10" : "bg-white/10";

  return (
    <Card className={`border ${cardBorder} ${cardBg} shadow-sm`}>
      <CardHeader className="flex flex-col space-y-1.5 p-4 md:p-6">
        <CardTitle className="text-2xl font-semibold leading-none tracking-tight">
          {t("dashboard.analytics.memorialSummary.title")}
        </CardTitle>
        <CardDescription className={`text-sm ${textMuted}`}>
          {t("dashboard.analytics.memorialSummary.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 space-y-4">
        <div className={`p-4 rounded-lg ${bgMuted}`}>
          <div className="text-2xl font-semibold">Sarah Johnson</div>
          <div className={`text-sm ${textMuted}`}>Memorial Page</div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className={`text-sm ${textMuted}`}>Created</span>
            <span className="text-sm font-medium">Jan 10, 2024</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${textMuted}`}>Status</span>
            <span className="text-sm font-medium">Live</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${textMuted}`}>Photos</span>
            <span className="text-sm font-medium">24</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${textMuted}`}>Approved Tributes</span>
            <span className="text-sm font-medium">47</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${textMuted}`}>Service RSVPs</span>
            <span className="text-sm font-medium">32</span>
          </div>
        </div>

        <Button variant={theme === "dark" ? "memorial-outline" : "outline"} className="w-full mt-4">
          {t("dashboard.analytics.memorialSummary.viewMemorial")}
        </Button>
      </CardContent>
    </Card>
  );
};
