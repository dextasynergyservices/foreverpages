import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MdSend,
  MdCheckCircle,
  MdCancel,
  MdPending,
  MdEmail,
  MdPhone,
  MdDownload,
} from "react-icons/md";
import { Invitation } from "./Invitations";
import { differenceInHours, isPast } from "date-fns";
import { exportAnalyticsToCSV } from "@/lib/exportUtils";
import { toast } from "react-hot-toast";

interface AnalyticsTabProps {
  invitations: Invitation[];
  themeClasses: {
    cardBorder: string;
    cardBg: string;
    textMuted: string;
  };
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ invitations, themeClasses, t }) => {
  const { cardBorder, cardBg, textMuted } = themeClasses;

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalSent = invitations.length;
    // Count successfully delivered invitations (not expired or revoked)
    const delivered = invitations.filter(
      (i) => i.status !== "expired" && i.status !== "revoked"
    ).length;
    const accepted = invitations.filter((i) => i.rsvp === "yes").length;
    const declined = invitations.filter((i) => i.rsvp === "no").length;
    const maybe = invitations.filter((i) => i.rsvp === "maybe").length;
    const pending = invitations.filter((i) => !i.rsvp).length;
    const emailDelivery = invitations.filter((i) => i.sentViaEmail).length;
    const whatsappDelivery = invitations.filter((i) => i.sentViaWhatsApp).length;
    const expired = invitations.filter((i) => i.expiresAt && isPast(new Date(i.expiresAt))).length;

    // Calculate average response time for those who responded
    const responseTimes = invitations
      .filter((i) => i.rsvp && i.createdAt)
      .map((i) => {
        // Assuming response time is roughly creation to now (would need actual response timestamp)
        return differenceInHours(new Date(), new Date(i.createdAt!));
      });
    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    // Calculate rates
    const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
    const acceptanceRate = totalSent > 0 ? (accepted / totalSent) * 100 : 0;
    const responseRate = totalSent > 0 ? ((accepted + declined + maybe) / totalSent) * 100 : 0;

    return {
      totalSent,
      delivered,
      accepted,
      declined,
      maybe,
      pending,
      emailDelivery,
      whatsappDelivery,
      expired,
      averageResponseTime,
      deliveryRate,
      acceptanceRate,
      responseRate,
    };
  }, [invitations]);

  const handleExportAnalytics = () => {
    try {
      const filename = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
      exportAnalyticsToCSV(
        {
          totalSent: analytics.totalSent,
          delivered: analytics.delivered,
          opened: analytics.delivered, // Using delivered as proxy for opened
          accepted: analytics.accepted,
          declined: analytics.declined,
          pending: analytics.pending,
          emailDelivery: analytics.emailDelivery,
          whatsappDelivery: analytics.whatsappDelivery,
          averageResponseTime: analytics.averageResponseTime,
        },
        filename
      );
      toast.success(
        t("dashboard.invitations.analytics.exportSuccess", {}, "Analytics exported successfully")
      );
    } catch (error) {
      toast.error(
        t("dashboard.invitations.analytics.exportError", {}, "Failed to export analytics")
      );
      console.error("Export error:", error);
    }
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
    subtitle,
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }) => (
    <Card className={`border ${cardBorder} ${cardBg}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={`text-sm font-medium ${textMuted}`}>{title}</p>
            <h3 className="text-3xl font-bold mt-2">{value}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {t("dashboard.invitations.analytics.title", {}, "Invitation Analytics")}
          </h2>
          <p className={textMuted}>
            {t(
              "dashboard.invitations.analytics.description",
              {},
              "Track and analyze your invitation performance"
            )}
          </p>
        </div>
        <Button variant="outline" onClick={handleExportAnalytics}>
          <MdDownload className="h-4 w-4 mr-2" />
          {t("dashboard.invitations.analytics.exportData", {}, "Export Data")}
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("dashboard.invitations.analytics.stats.totalSent", {}, "Total Sent")}
          value={analytics.totalSent}
          icon={<MdSend className="h-6 w-6" />}
          color="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          title={t("dashboard.invitations.analytics.stats.accepted", {}, "Accepted (Yes)")}
          value={analytics.accepted}
          icon={<MdCheckCircle className="h-6 w-6" />}
          color="bg-green-500/10 text-green-500"
          subtitle={t(
            "dashboard.invitations.analytics.stats.acceptanceRate",
            { rate: analytics.acceptanceRate.toFixed(1) },
            `${analytics.acceptanceRate.toFixed(1)}% acceptance rate`
          )}
        />
        <StatCard
          title={t("dashboard.invitations.analytics.stats.declined", {}, "Declined (No)")}
          value={analytics.declined}
          icon={<MdCancel className="h-6 w-6" />}
          color="bg-red-500/10 text-red-500"
        />
        <StatCard
          title={t("dashboard.invitations.analytics.stats.pending", {}, "Pending")}
          value={analytics.pending}
          icon={<MdPending className="h-6 w-6" />}
          color="bg-yellow-500/10 text-yellow-500"
          subtitle={t(
            "dashboard.invitations.analytics.stats.responseRate",
            { rate: analytics.responseRate.toFixed(1) },
            `${analytics.responseRate.toFixed(1)}% response rate`
          )}
        />
      </div>

      {/* Delivery Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={`border ${cardBorder} ${cardBg}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MdEmail className="h-5 w-5" />
              {t("dashboard.invitations.analytics.deliveryMethods", {}, "Delivery Methods")}
            </CardTitle>
            <CardDescription className={textMuted}>
              {t(
                "dashboard.invitations.analytics.deliveryMethodsDescription",
                {},
                "Distribution of delivery channels"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MdEmail className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">
                    {t("dashboard.invitations.analytics.deliveryChannels.email", {}, "Email")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${analytics.totalSent > 0 ? (analytics.emailDelivery / analytics.totalSent) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold w-12 text-right">
                    {analytics.emailDelivery}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MdPhone className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">
                    {t("dashboard.invitations.analytics.deliveryChannels.whatsapp", {}, "WhatsApp")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${analytics.totalSent > 0 ? (analytics.whatsappDelivery / analytics.totalSent) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold w-12 text-right">
                    {analytics.whatsappDelivery}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Breakdown */}
        <Card className={`border ${cardBorder} ${cardBg}`}>
          <CardHeader>
            <CardTitle>
              {t("dashboard.invitations.analytics.responses", {}, "Response Breakdown")}
            </CardTitle>
            <CardDescription className={textMuted}>
              {t(
                "dashboard.invitations.analytics.responsesDescription",
                {},
                "RSVP status distribution"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t("dashboard.invitations.analytics.responseTypes.accepted", {}, "Accepted")}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${analytics.totalSent > 0 ? (analytics.accepted / analytics.totalSent) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold w-12 text-right">{analytics.accepted}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t("dashboard.invitations.analytics.responseTypes.maybe", {}, "Maybe")}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500"
                      style={{
                        width: `${analytics.totalSent > 0 ? (analytics.maybe / analytics.totalSent) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold w-12 text-right">{analytics.maybe}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t("dashboard.invitations.analytics.responseTypes.declined", {}, "Declined")}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{
                        width: `${analytics.totalSent > 0 ? (analytics.declined / analytics.totalSent) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold w-12 text-right">{analytics.declined}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t("dashboard.invitations.analytics.responseTypes.noResponse", {}, "No Response")}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-500"
                      style={{
                        width: `${analytics.totalSent > 0 ? (analytics.pending / analytics.totalSent) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold w-12 text-right">{analytics.pending}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`border ${cardBorder} ${cardBg}`}>
          <CardHeader>
            <CardTitle className="text-base">
              {t("dashboard.invitations.analytics.metrics.deliveryRate", {}, "Delivery Rate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.deliveryRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t(
                "dashboard.invitations.analytics.metrics.deliveryRateDescription",
                { delivered: analytics.delivered, total: analytics.totalSent },
                `${analytics.delivered} of ${analytics.totalSent} delivered`
              )}
            </p>
          </CardContent>
        </Card>

        <Card className={`border ${cardBorder} ${cardBg}`}>
          <CardHeader>
            <CardTitle className="text-base">
              {t(
                "dashboard.invitations.analytics.metrics.avgResponseTime",
                {},
                "Avg. Response Time"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {analytics.averageResponseTime > 24
                ? `${Math.round(analytics.averageResponseTime / 24)}d`
                : `${Math.round(analytics.averageResponseTime)}h`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t(
                "dashboard.invitations.analytics.metrics.avgResponseTimeDescription",
                {},
                "From send to response"
              )}
            </p>
          </CardContent>
        </Card>

        <Card className={`border ${cardBorder} ${cardBg}`}>
          <CardHeader>
            <CardTitle className="text-base">
              {t(
                "dashboard.invitations.analytics.metrics.expiredInvitations",
                {},
                "Expired Invitations"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.expired}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t(
                "dashboard.invitations.analytics.metrics.expiredDescription",
                {},
                "Past expiration date"
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
