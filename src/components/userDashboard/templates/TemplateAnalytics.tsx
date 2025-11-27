"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslations } from "@/hooks/useTranslations";
import { TrendingUp, Download, Star, DollarSign, Target, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface TemplateAnalytics {
  totalTemplates: number;
  totalDownloads: number;
  totalRevenue: number;
  averageRating: number;
  totalViews: number;
  popularTemplates: Array<{
    id: string;
    name: string;
    downloads: number;
    rating: number;
    revenue: number;
  }>;
  downloadTrends: Array<{
    date: string;
    downloads: number;
    revenue: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  performanceMetrics: {
    conversionRate: number;
    averageSessionDuration: number;
    bounceRate: number;
  };
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export const TemplateAnalytics = () => {
  const { t } = useTranslations();
  const { data: analytics, isLoading } = useQuery<TemplateAnalytics>({
    queryKey: ["template-analytics"],
    queryFn: async (): Promise<TemplateAnalytics> => {
      const response = await fetch("/api/user/templates/analytics");
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data = await response.json();
      return data.data.analytics;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("dashboard.templates.analytics.metrics.totalTemplates")}
                </p>
                <p className="text-2xl font-bold">{analytics.totalTemplates}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("dashboard.templates.analytics.metrics.totalDownloads")}
                </p>
                <p className="text-2xl font-bold">{analytics.totalDownloads.toLocaleString()}</p>
              </div>
              <Download className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("dashboard.templates.analytics.metrics.totalRevenue")}
                </p>
                <p className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("dashboard.templates.analytics.metrics.averageRating")}
                </p>
                <p className="text-2xl font-bold">{analytics.averageRating.toFixed(1)}</p>
              </div>
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t("dashboard.templates.analytics.charts.performanceMetrics")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {analytics.performanceMetrics.conversionRate.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.templates.analytics.metrics.conversionRateLabel")}
              </p>
              <Progress value={analytics.performanceMetrics.conversionRate} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.floor(analytics.performanceMetrics.averageSessionDuration / 60)}m{" "}
                {analytics.performanceMetrics.averageSessionDuration % 60}s
              </div>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.templates.analytics.metrics.averageSessionDuration")}
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {analytics.performanceMetrics.bounceRate.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.templates.analytics.metrics.bounceRate")}
              </p>
              <Progress value={100 - analytics.performanceMetrics.bounceRate} className="mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Download Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t("dashboard.templates.analytics.metrics.usageTrends")}
            </CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.downloadTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="downloads" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.templates.analytics.charts.templateUsage")}</CardTitle>
            <CardDescription>Template categories by usage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Popular Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            {t("dashboard.templates.analytics.metrics.popularTemplates")}
          </CardTitle>
          <CardDescription>Your most downloaded and highest rated templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.popularTemplates.map((template, index) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                    <span className="text-sm font-semibold">#{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{template.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        {template.downloads}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {template.rating.toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />${template.revenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary">
                  {((template.downloads / analytics.totalDownloads) * 100).toFixed(1)}% of total
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
