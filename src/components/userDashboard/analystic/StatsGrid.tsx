"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Users, Heart, TrendingUp } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface Stat {
  title: string;
  value: string;
  change: string;
  trend: string;
  icon: string;
  description: string;
}

interface ThemeClasses {
  cardBorder: string;
  cardBg: string;
  textMuted: string;
  bgMuted: string;
}

interface StatsGridProps {
  stats: Stat[];
  themeClasses: ThemeClasses;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  const { theme } = useTheme();

  // Use hook-derived classes so component can respond at runtime
  const cardBorder = theme === "dark" ? "border-white" : "border-black";
  const cardBg = theme === "dark" ? "bg-black text-white" : "bg-white text-black";
  const textMuted = theme === "dark" ? "text-white/70" : "text-black/70";
  const bgMuted = theme === "dark" ? "bg-white/20" : "bg-black/20";

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Eye":
        return Eye;
      case "Users":
        return Users;
      case "Heart":
        return Heart;
      case "TrendingUp":
        return TrendingUp;
      default:
        return Eye;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 p-4 md:p-8 pt-0 md:pt-0">
      {stats.map((stat, index) => {
        const IconComponent = getIconComponent(stat.icon);
        return (
          <Card key={index} className={`border ${cardBorder} ${cardBg} shadow-sm`}>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${textMuted}`}>{stat.title}</p>
                  <p className="text-2xl md:text-3xl font-semibold leading-none tracking-tight">
                    {stat.value}
                  </p>
                  <p className={`text-sm mt-1 ${textMuted}`}>{stat.change} from last period</p>
                </div>
                <div className={`p-3 rounded-full ${bgMuted}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
