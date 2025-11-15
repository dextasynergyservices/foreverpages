import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MdCheckCircle, MdCancel, MdHelp, MdPending, MdTrendingUp, MdPeople } from "react-icons/md";
import { Invitation } from "./Invitations";
import { useTranslations } from "@/hooks/useTranslations";

interface ThemeClasses {
  cardBorder: string;
  cardBg: string;
  textMuted: string;
}

interface RSVPStatsProps {
  invitations: Invitation[];
  themeClasses: ThemeClasses;
  theme: string;
}

export const RSVPStats: React.FC<RSVPStatsProps> = ({ invitations, themeClasses, theme }) => {
  const { t } = useTranslations();
  const { cardBorder, cardBg, textMuted } = themeClasses;

  const stats = useMemo(() => {
    const total = invitations.length;
    const accepted = invitations.filter((inv) => inv.rsvp === "yes").length;
    const declined = invitations.filter((inv) => inv.rsvp === "no").length;
    const maybe = invitations.filter((inv) => inv.rsvp === "maybe").length;
    const pending = invitations.filter((inv) => !inv.rsvp).length;

    const responded = accepted + declined + maybe;
    const responseRate = total > 0 ? (responded / total) * 100 : 0;
    const acceptanceRate = total > 0 ? (accepted / total) * 100 : 0;

    return {
      total,
      accepted,
      declined,
      maybe,
      pending,
      responded,
      responseRate,
      acceptanceRate,
    };
  }, [invitations]);

  const StatCard = ({
    icon: Icon,
    value,
    label,
    color,
    bgColor,
  }: {
    icon: React.ElementType;
    value: number;
    label: string;
    color: string;
    bgColor: string;
  }) => (
    <Card className={`border ${cardBorder} ${cardBg}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${textMuted}`}>{label}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${bgColor}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 mb-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={MdCheckCircle}
          value={stats.accepted}
          label={t("dashboard.invitations.rsvpTab.stats.attending", {}, "Attending")}
          color="text-green-600"
          bgColor={theme === "dark" ? "bg-green-900/20" : "bg-green-50"}
        />
        <StatCard
          icon={MdCancel}
          value={stats.declined}
          label={t("dashboard.invitations.rsvpTab.stats.declined", {}, "Declined")}
          color="text-red-600"
          bgColor={theme === "dark" ? "bg-red-900/20" : "bg-red-50"}
        />
        <StatCard
          icon={MdHelp}
          value={stats.maybe}
          label={t("dashboard.invitations.rsvpTab.stats.maybe", {}, "Maybe")}
          color="text-yellow-600"
          bgColor={theme === "dark" ? "bg-yellow-900/20" : "bg-yellow-50"}
        />
        <StatCard
          icon={MdPending}
          value={stats.pending}
          label={t("dashboard.invitations.rsvpTab.stats.pending", {}, "Pending")}
          color="text-gray-600"
          bgColor={theme === "dark" ? "bg-gray-800" : "bg-gray-50"}
        />
      </div>

      {/* Progress & Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={`border ${cardBorder} ${cardBg}`}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MdTrendingUp className="h-5 w-5" />
              {t("dashboard.invitations.rsvpTab.stats.responseRate", {}, "Response Rate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={textMuted}>
                  {t(
                    "dashboard.invitations.rsvpTab.stats.responseRateDescription",
                    { responded: stats.responded, total: stats.total },
                    `${stats.responded} of ${stats.total} responded`
                  )}
                </span>
                <span className="font-bold">{stats.responseRate.toFixed(1)}%</span>
              </div>
              <Progress value={stats.responseRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border ${cardBorder} ${cardBg}`}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MdPeople className="h-5 w-5" />
              {t("dashboard.invitations.rsvpTab.stats.acceptanceRate", {}, "Acceptance Rate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={textMuted}>
                  {t(
                    "dashboard.invitations.rsvpTab.stats.acceptanceRateDescription",
                    { accepted: stats.accepted, total: stats.total },
                    `${stats.accepted} of ${stats.total} attending`
                  )}
                </span>
                <span className="font-bold">{stats.acceptanceRate.toFixed(1)}%</span>
              </div>
              <Progress value={stats.acceptanceRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
