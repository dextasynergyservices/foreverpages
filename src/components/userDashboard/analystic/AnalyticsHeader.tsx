import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";

interface AnalyticsHeaderProps {
  theme: string;
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({ theme, t }) => {
  const textMuted = theme === "dark" ? "text-white/70" : "text-black/70";

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8 p-4 md:p-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold">
          {t("dashboard.analytics.title")}
        </h1>
        <p className={`mt-2 ${textMuted}`}>{t("dashboard.analytics.subtitle")}</p>
      </div>
      <div className="flex gap-2">
        <Select defaultValue="30days">
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">{t("dashboard.analytics.timeRanges.7days")}</SelectItem>
            <SelectItem value="30days">{t("dashboard.analytics.timeRanges.30days")}</SelectItem>
            <SelectItem value="90days">{t("dashboard.analytics.timeRanges.90days")}</SelectItem>
            <SelectItem value="1year">{t("dashboard.analytics.timeRanges.1year")}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={theme === "dark" ? "memorial-outline" : "outline"}>
          <Download className="h-4 w-4 mr-2" />
          {t("dashboard.analytics.exportReport")}
        </Button>
      </div>
    </div>
  );
};
