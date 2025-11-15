import React from "react";
import { RecentActivity } from "./RecentActivity";
import { MemorialSummary } from "./MemorialSummary";

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

interface ActivityAndSummaryProps {
  recentActivity: ActivityItem[];
  themeClasses: ThemeClasses;
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export const ActivityAndSummary: React.FC<ActivityAndSummaryProps> = ({
  recentActivity,
  themeClasses,
  t,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 p-4 md:p-8 pt-0 md:pt-0">
      <RecentActivity recentActivity={recentActivity} themeClasses={themeClasses} t={t} />

      <MemorialSummary themeClasses={themeClasses} />
    </div>
  );
};
