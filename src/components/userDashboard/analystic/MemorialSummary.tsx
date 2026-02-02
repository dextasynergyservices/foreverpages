import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import Link from "next/link";

interface ThemeClasses {
  cardBorder: string;
  cardBg: string;
  textMuted: string;
  bgMuted: string;
}

interface MemorialSummaryData {
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  photoCount: number;
  approvedTributes: number;
  serviceRsvps: number;
}

interface MemorialSummaryProps {
  themeClasses: ThemeClasses;
  memorialSummary?: MemorialSummaryData | null;
}

export const MemorialSummary: React.FC<MemorialSummaryProps> = ({ memorialSummary }) => {
  const { theme } = useTheme();
  const { t, locale } = useTranslations();

  const cardBorder = theme === "dark" ? "border-white" : "border-black";
  const cardBg = theme === "dark" ? "bg-black text-white" : "bg-white text-black";
  const textMuted = theme === "dark" ? "text-white/70" : "text-black/70";
  const bgMuted = theme === "dark" ? "bg-white/10" : "bg-black/10";

  // Format date based on locale
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!memorialSummary) {
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
        <CardContent className="p-4 md:p-6 pt-0">
          <p className={`text-sm ${textMuted}`}>
            {t("dashboard.analytics.memorialSummary.noMemorial", {}, "No memorial found")}
          </p>
        </CardContent>
      </Card>
    );
  }

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
          <div className="text-2xl font-semibold">{memorialSummary.name}</div>
          <div className={`text-sm ${textMuted}`}>
            {t("dashboard.analytics.memorialSummary.memorialPage")}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className={`text-sm ${textMuted}`}>
              {t("dashboard.analytics.memorialSummary.created")}
            </span>
            <span className="text-sm font-medium">{formatDate(memorialSummary.createdAt)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${textMuted}`}>
              {t("dashboard.analytics.memorialSummary.status")}
            </span>
            <span
              className={`text-sm font-medium capitalize ${
                memorialSummary.status === "live" ? "text-green-600" : "text-yellow-600"
              }`}
            >
              {memorialSummary.status === "live"
                ? t("dashboard.analytics.memorialSummary.statusLive", {}, "Live")
                : t("dashboard.analytics.memorialSummary.statusDraft", {}, "Draft")}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${textMuted}`}>
              {t("dashboard.analytics.memorialSummary.photos")}
            </span>
            <span className="text-sm font-medium">{memorialSummary.photoCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${textMuted}`}>
              {t("dashboard.analytics.memorialSummary.approvedTributes")}
            </span>
            <span className="text-sm font-medium">{memorialSummary.approvedTributes}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm ${textMuted}`}>
              {t("dashboard.analytics.memorialSummary.serviceRsvps")}
            </span>
            <span className="text-sm font-medium">{memorialSummary.serviceRsvps}</span>
          </div>
        </div>

        <Link href={`/${memorialSummary.slug}`} passHref>
          <Button
            variant={theme === "dark" ? "memorial-outline" : "outline"}
            className="w-full mt-4"
          >
            {t("dashboard.analytics.memorialSummary.viewMemorial")}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};
