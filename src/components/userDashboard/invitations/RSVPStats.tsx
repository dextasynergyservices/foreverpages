import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ThemeClasses {
  cardBorder: string;
  cardBg: string;
  textMuted: string;
}

interface RSVPStatsProps {
  themeClasses: ThemeClasses;
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export const RSVPStats: React.FC<RSVPStatsProps> = ({ themeClasses, t }) => {
  const { cardBorder, cardBg, textMuted } = themeClasses;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
      <Card className={`border ${cardBorder} ${cardBg}`}>
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold">24</div>
          <div className={`text-sm ${textMuted}`}>{t("dashboard.invitations.rsvp.attending")}</div>
        </CardContent>
      </Card>
      <Card className={`border ${cardBorder} ${cardBg}`}>
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-destructive">3</div>
          <div className={`text-sm ${textMuted}`}>
            {t("dashboard.invitations.rsvp.cannotAttend")}
          </div>
        </CardContent>
      </Card>
      <Card className={`border ${cardBorder} ${cardBg}`}>
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-secondary">8</div>
          <div className={`text-sm ${textMuted}`}>{t("dashboard.invitations.rsvp.noResponse")}</div>
        </CardContent>
      </Card>
    </div>
  );
};
