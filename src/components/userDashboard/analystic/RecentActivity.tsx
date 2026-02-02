"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Eye, Users, Calendar, TrendingUp } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";

interface ActivityItem {
  actionKey: string;
  actionParams: Record<string, string>;
  time: string;
  type: string;
}

interface ThemeClasses {
  cardBorder: string;
  cardBg: string;
  textMuted: string;
  bgMuted: string;
}

interface RecentActivityProps {
  recentActivity: ActivityItem[];
  themeClasses: ThemeClasses;
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ recentActivity }) => {
  const { theme } = useTheme();
  const { t } = useTranslations();

  const cardBorder = theme === "dark" ? "border-white" : "border-black";
  const cardBg = theme === "dark" ? "bg-black text-white" : "bg-white text-black";
  const textMuted = theme === "dark" ? "text-white/70" : "text-black/70";
  const bgMuted = theme === "dark" ? "bg-white/10" : "bg-black/10";

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "tribute":
        return Heart;
      case "media":
        return Eye;
      case "view":
        return Users;
      case "invitation":
        return Calendar;
      case "share":
        return TrendingUp;
      default:
        return Eye;
    }
  };

  return (
    <Card className={`lg:col-span-2 border ${cardBorder} ${cardBg} shadow-sm`}>
      <CardHeader className="flex flex-col space-y-1.5 p-4 md:p-6">
        <CardTitle className="text-2xl font-semibold leading-none tracking-tight">
          {t("dashboard.analytics.recentActivity.title")}
        </CardTitle>
        <CardDescription className={`text-sm ${textMuted}`}>
          {t("dashboard.analytics.recentActivity.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        <div className="space-y-4">
          {recentActivity.map((activity, index) => {
            const ActivityIcon = getActivityIcon(activity.type);
            return (
              <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${bgMuted}`}>
                <div
                  className={`p-2 rounded-full ${theme === "dark" ? "bg-white/20" : "bg-gray-200"}`}
                >
                  <ActivityIcon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {t(activity.actionKey, activity.actionParams)}
                  </p>
                  <p className={`text-xs ${textMuted}`}>{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
