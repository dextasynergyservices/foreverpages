"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MdSend, MdCheckCircle, MdPending, MdDownload, MdTrendingUp } from "react-icons/md";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Invitation } from "./Invitations";
import { differenceInHours, isPast, format, subDays } from "date-fns";
import { exportAnalyticsToCSV } from "@/lib/exportUtils";
import { invitationToasts, invitationErrors } from "@/lib/invitationToasts";

interface AnalyticsChartsProps {
  invitations: Invitation[];
  theme: string;
  themeClasses: {
    cardBorder: string;
    cardBg: string;
    textMuted: string;
  };
  t: (key: string, params?: unknown, fallback?: string) => string;
}

const CHART_COLORS = {
  accepted: "#10B981",
  declined: "#EF4444",
  maybe: "#F59E0B",
  pending: "#6B7280",
  email: "#3B82F6",
  whatsapp: "#10B981",
};

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  invitations,
  theme,
  themeClasses,
  t,
}) => {
  const { cardBorder, cardBg, textMuted } = themeClasses;
  const isDark = theme === "dark";

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalSent = invitations.length;
    const delivered = invitations.filter((i) => i.status !== "pending").length;
    const accepted = invitations.filter((i) => i.rsvp === "yes").length;
    const declined = invitations.filter((i) => i.rsvp === "no").length;
    const maybe = invitations.filter((i) => i.rsvp === "maybe").length;
    const pending = invitations.filter((i) => !i.rsvp).length;
    const emailDelivery = invitations.filter((i) => i.sentViaEmail).length;
    const whatsappDelivery = invitations.filter((i) => i.sentViaWhatsApp).length;
    const expired = invitations.filter((i) => i.expiresAt && isPast(new Date(i.expiresAt))).length;

    // Calculate average response time
    const responseTimes = invitations
      .filter((i) => i.rsvp && i.createdAt)
      .map((i) => differenceInHours(new Date(), new Date(i.createdAt!)));
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

  // Prepare data for invitations over time chart (last 30 days)
  const timelineData = useMemo(() => {
    const days = 30;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "MM/dd");

      const dayInvitations = invitations.filter((inv) => {
        if (!inv.createdAt) return false;
        const invDate = new Date(inv.createdAt);
        return format(invDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
      });

      const sent = dayInvitations.length;
      const accepted = dayInvitations.filter((i) => i.rsvp === "yes").length;
      const declined = dayInvitations.filter((i) => i.rsvp === "no").length;

      data.push({ date: dateStr, sent, accepted, declined });
    }

    return data;
  }, [invitations]);

  // Prepare data for response breakdown pie chart
  const responseData = [
    { name: "Accepted", value: analytics.accepted, color: CHART_COLORS.accepted },
    { name: "Declined", value: analytics.declined, color: CHART_COLORS.declined },
    { name: "Maybe", value: analytics.maybe, color: CHART_COLORS.maybe },
    { name: "No Response", value: analytics.pending, color: CHART_COLORS.pending },
  ];

  // Prepare data for delivery methods bar chart
  const deliveryData = [
    { method: "Email", count: analytics.emailDelivery, color: CHART_COLORS.email },
    { method: "WhatsApp", count: analytics.whatsappDelivery, color: CHART_COLORS.whatsapp },
  ];

  const handleExportAnalytics = () => {
    try {
      const filename = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
      exportAnalyticsToCSV(
        {
          totalSent: analytics.totalSent,
          delivered: analytics.delivered,
          opened: analytics.delivered,
          accepted: analytics.accepted,
          declined: analytics.declined,
          pending: analytics.pending,
          emailDelivery: analytics.emailDelivery,
          whatsappDelivery: analytics.whatsappDelivery,
          averageResponseTime: analytics.averageResponseTime,
        },
        filename
      );
      invitationToasts.exported("CSV");
    } catch {
      invitationErrors.exportFailed("CSV");
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`${cardBg} ${cardBorder} border`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.invitations.analyticsCharts.stats.totalSent", {}, "Total Sent")}
            </CardTitle>
            <MdSend className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSent}</div>
            <p className={`text-xs ${textMuted}`}>
              {t(
                "dashboard.invitations.analyticsCharts.stats.allInvitations",
                {},
                "All invitations"
              )}
            </p>
          </CardContent>
        </Card>

        <Card className={`${cardBg} ${cardBorder} border`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.invitations.analyticsCharts.stats.accepted", {}, "Accepted")}
            </CardTitle>
            <MdCheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.accepted}</div>
            <p className={`text-xs ${textMuted}`}>
              {t(
                "dashboard.invitations.analyticsCharts.stats.acceptanceRate",
                { rate: analytics.acceptanceRate.toFixed(1) },
                `${analytics.acceptanceRate.toFixed(1)}% acceptance rate`
              )}
            </p>
          </CardContent>
        </Card>

        <Card className={`${cardBg} ${cardBorder} border`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.invitations.analyticsCharts.stats.responseRate", {}, "Response Rate")}
            </CardTitle>
            <MdTrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.responseRate.toFixed(1)}%</div>
            <p className={`text-xs ${textMuted}`}>
              {t(
                "dashboard.invitations.analyticsCharts.stats.responses",
                { count: analytics.accepted + analytics.declined + analytics.maybe },
                `${analytics.accepted + analytics.declined + analytics.maybe} responses`
              )}
            </p>
          </CardContent>
        </Card>

        <Card className={`${cardBg} ${cardBorder} border`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.invitations.analyticsCharts.stats.pending", {}, "Pending")}
            </CardTitle>
            <MdPending className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pending}</div>
            <p className={`text-xs ${textMuted}`}>
              {t(
                "dashboard.invitations.analyticsCharts.stats.awaitingResponse",
                {},
                "Awaiting response"
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invitations Over Time Chart */}
      <Card className={`${cardBg} ${cardBorder} border`}>
        <CardHeader>
          <CardTitle>
            {t("dashboard.invitations.analyticsCharts.timeline.title", {}, "Invitations Over Time")}
          </CardTitle>
          <CardDescription>
            {t(
              "dashboard.invitations.analyticsCharts.timeline.description",
              {},
              "Last 30 days activity"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
              <XAxis dataKey="date" stroke={isDark ? "#9ca3af" : "#6b7280"} />
              <YAxis stroke={isDark ? "#9ca3af" : "#6b7280"} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#1f2937" : "#ffffff",
                  border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                  borderRadius: "6px",
                }}
                labelStyle={{ color: isDark ? "#ffffff" : "#000000" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="sent"
                stroke="#3B82F6"
                strokeWidth={2}
                name={t("dashboard.invitations.analyticsCharts.timeline.sent", {}, "Sent")}
              />
              <Line
                type="monotone"
                dataKey="accepted"
                stroke="#10B981"
                strokeWidth={2}
                name={t("dashboard.invitations.analyticsCharts.timeline.accepted", {}, "Accepted")}
              />
              <Line
                type="monotone"
                dataKey="declined"
                stroke="#EF4444"
                strokeWidth={2}
                name={t("dashboard.invitations.analyticsCharts.timeline.declined", {}, "Declined")}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Breakdown Pie Chart */}
        <Card className={`${cardBg} ${cardBorder} border`}>
          <CardHeader>
            <CardTitle>
              {t("dashboard.invitations.analyticsCharts.breakdown.title", {}, "Response Breakdown")}
            </CardTitle>
            <CardDescription>
              {t(
                "dashboard.invitations.analyticsCharts.breakdown.description",
                {},
                "RSVP status distribution"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={responseData.map((entry) => ({
                    ...entry,
                    name: t(
                      `dashboard.invitations.analyticsCharts.breakdown.${entry.name.toLowerCase().replace(" ", "")}`,
                      {},
                      entry.name
                    ),
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {responseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                    borderRadius: "6px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Delivery Methods Bar Chart */}
        <Card className={`${cardBg} ${cardBorder} border`}>
          <CardHeader>
            <CardTitle>
              {t("dashboard.invitations.analyticsCharts.delivery.title", {}, "Delivery Methods")}
            </CardTitle>
            <CardDescription>
              {t(
                "dashboard.invitations.analyticsCharts.delivery.description",
                {},
                "Email vs WhatsApp distribution"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={deliveryData.map((entry) => ({
                  ...entry,
                  method: t(
                    `dashboard.invitations.analyticsCharts.delivery.${entry.method.toLowerCase()}`,
                    {},
                    entry.method
                  ),
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                <XAxis dataKey="method" stroke={isDark ? "#9ca3af" : "#6b7280"} />
                <YAxis stroke={isDark ? "#9ca3af" : "#6b7280"} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                    borderRadius: "6px",
                  }}
                  labelStyle={{ color: isDark ? "#ffffff" : "#000000" }}
                />
                <Bar
                  dataKey="count"
                  name={t(
                    "dashboard.invitations.analyticsCharts.delivery.invitations",
                    {},
                    "Invitations"
                  )}
                >
                  {deliveryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={handleExportAnalytics} className="flex items-center gap-2">
          <MdDownload className="h-4 w-4" />
          {t("dashboard.invitations.analyticsCharts.export", {}, "Export Analytics")}
        </Button>
      </div>
    </div>
  );
};
