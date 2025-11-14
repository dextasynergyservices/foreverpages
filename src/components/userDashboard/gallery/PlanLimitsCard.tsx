"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon, Video as VideoIcon, TrendingUp } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";

interface PlanLimitsData {
  name: string;
  limits: {
    images: {
      used: number;
      max: number;
      remaining: number;
      percentage: number;
    };
    videos: {
      used: number;
      max: number;
      remaining: number;
      percentage: number;
    };
  };
}

interface PlanLimitsCardProps {
  planData: PlanLimitsData;
}

export const PlanLimitsCard: React.FC<PlanLimitsCardProps> = ({ planData }) => {
  const { theme } = useTheme();
  const { t } = useTranslations();

  const isDark = theme === "dark";
  const cardBg = isDark ? "bg-black border-white/10" : "bg-white border-gray-200";
  const textMuted = isDark ? "text-white/70" : "text-gray-600";
  const textPrimary = isDark ? "text-white" : "text-black";

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-500";
    if (percentage >= 70) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <Card className={`${cardBg} border shadow-lg`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 text-lg ${textPrimary}`}>
          <TrendingUp className="h-5 w-5" />
          {planData.name} {t("dashboard.gallery.planLimits.planUsage")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Images Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className={`h-5 w-5 ${textMuted}`} />
              <span className={`font-medium ${textPrimary}`}>
                {t("dashboard.gallery.planLimits.photos")}
              </span>
            </div>
            <span
              className={`text-sm font-semibold ${getStatusColor(planData.limits.images.percentage)}`}
            >
              {planData.limits.images.used} / {planData.limits.images.max}
            </span>
          </div>
          <div className="space-y-2">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
              <div
                className={`h-full transition-all ${getProgressColor(planData.limits.images.percentage)}`}
                style={{ width: `${planData.limits.images.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className={textMuted}>
                {planData.limits.images.percentage}% {t("dashboard.gallery.planLimits.used")}
              </span>
              <span className={textMuted}>
                {planData.limits.images.remaining} {t("dashboard.gallery.planLimits.remaining")}
              </span>
            </div>
          </div>
        </div>

        {/* Videos Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <VideoIcon className={`h-5 w-5 ${textMuted}`} />
              <span className={`font-medium ${textPrimary}`}>
                {t("dashboard.gallery.planLimits.videos")}
              </span>
            </div>
            <span
              className={`text-sm font-semibold ${getStatusColor(planData.limits.videos.percentage)}`}
            >
              {planData.limits.videos.used} / {planData.limits.videos.max}
            </span>
          </div>
          <div className="space-y-2">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
              <div
                className={`h-full transition-all ${getProgressColor(planData.limits.videos.percentage)}`}
                style={{ width: `${planData.limits.videos.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className={textMuted}>
                {planData.limits.videos.percentage}% {t("dashboard.gallery.planLimits.used")}
              </span>
              <span className={textMuted}>
                {planData.limits.videos.remaining} {t("dashboard.gallery.planLimits.remaining")}
              </span>
            </div>
          </div>
        </div>

        {/* Warning if near limit */}
        {(planData.limits.images.percentage >= 90 || planData.limits.videos.percentage >= 90) && (
          <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              ⚠️ {t("dashboard.gallery.planLimits.storageWarning")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
