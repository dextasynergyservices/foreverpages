"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users,
  DollarSign,
  CreditCard,
  CheckCircle,
  LayoutTemplate,
  Heart,
  RefreshCcw,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { StatsCard, LargeStatsCard } from "./StatsCard";
import { AnalyticsAreaChart } from "./AreaChart";
import { AnalyticsBarChart } from "./BarChart";
import { AnalyticsDonutChart } from "./PieChart";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    verifiedUsers: number;
    verificationRate: number;
    totalRevenue: number;
    totalPayments: number;
    activeSubscriptions: number;
    totalMemorials: number;
    totalTemplates: number;
  };
  growth: {
    users: { current: number; previous: number; percentage: number };
    revenue: { current: number; previous: number; percentage: number };
  };
  charts: {
    users: Array<{ date: string; value: number }>;
    revenue: Array<{ date: string; value: number }>;
    plans: Array<{ name: string; value: number }>;
    memorials: Array<{ name: string; value: number }>;
    templates: Array<{ name: string; value: number }>;
  };
  recentActivity: {
    payments: Array<{
      id: string;
      amount: number;
      currency: string;
      userName: string;
      userEmail: string;
      planName: string;
      date: string;
    }>;
    signups: Array<{
      id: string;
      name: string;
      email: string;
      verified: boolean;
      plan: string;
      date: string;
    }>;
  };
}

async function fetchAnalytics(range: string): Promise<AnalyticsData> {
  const res = await fetch(`/api/admin/analytics?range=${range}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Failed to fetch analytics");
  return data.data;
}

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState("30d");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-analytics", dateRange],
    queryFn: () => fetchAnalytics(dateRange),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });

  const formatCurrency = (value: number) => `₦${value.toLocaleString()}`;

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">
          Failed to load analytics
        </h3>
        <p className="text-sm text-red-600 dark:text-red-400">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header with controls - Responsive */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Platform performance and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Key Metrics - Large Cards - Responsive Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        <LargeStatsCard
          title="Total Users"
          value={data.overview.totalUsers.toLocaleString()}
          icon={<Users className="h-6 w-6" />}
          color="purple"
          trend={{
            value: data.growth.users.percentage,
            label: "vs last period",
          }}
          sparklineData={data.charts.users.map((d) => d.value)}
        />
        <LargeStatsCard
          title="Total Revenue"
          value={formatCurrency(data.overview.totalRevenue)}
          icon={<DollarSign className="h-6 w-6" />}
          color="green"
          trend={{
            value: data.growth.revenue.percentage,
            label: "vs last period",
          }}
          sparklineData={data.charts.revenue.map((d) => d.value)}
        />
      </div>

      {/* Secondary Metrics - Responsive Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Verified Users"
          value={data.overview.verifiedUsers.toLocaleString()}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
          subtitle={`${data.overview.verificationRate.toFixed(1)}% verification rate`}
        />
        <StatsCard
          title="Active Subscriptions"
          value={data.overview.activeSubscriptions.toLocaleString()}
          icon={<CreditCard className="h-5 w-5" />}
          color="blue"
          subtitle={`${data.overview.totalPayments} total payments`}
        />
        <StatsCard
          title="Total Memorials"
          value={data.overview.totalMemorials.toLocaleString()}
          icon={<Heart className="h-5 w-5" />}
          color="rose"
          subtitle="Created memorials"
        />
        <StatsCard
          title="Active Templates"
          value={data.overview.totalTemplates.toLocaleString()}
          icon={<LayoutTemplate className="h-5 w-5" />}
          color="indigo"
          subtitle="Available templates"
        />
      </div>

      {/* Charts Row 1 - Responsive Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <AnalyticsAreaChart
          data={data.charts.users}
          title="User Signups"
          subtitle={`${data.growth.users.current} new users this period`}
          color="purple"
        />
        <AnalyticsAreaChart
          data={data.charts.revenue}
          title="Revenue"
          subtitle={`${formatCurrency(data.growth.revenue.current)} this period`}
          color="green"
          valueFormatter={formatCurrency}
        />
      </div>

      {/* Charts Row 2 - Responsive Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <AnalyticsDonutChart
          data={data.charts.plans}
          title="Plan Distribution"
          subtitle="Users by subscription plan"
          centerLabel="Users"
        />
        <AnalyticsDonutChart
          data={data.charts.memorials}
          title="Memorial Status"
          subtitle="Memorials by status"
          colors={["emerald", "amber", "red", "indigo"]}
          centerLabel="Total"
        />
        <AnalyticsBarChart
          data={data.charts.templates}
          title="Popular Templates"
          subtitle="Most used templates"
        />
      </div>

      {/* Recent Activity - Responsive Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Recent Payments */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 p-4 sm:p-6 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Recent Payments
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Latest successful payments</p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.recentActivity.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="hidden sm:flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {payment.userName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {payment.planName}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                    ₦{payment.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(payment.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {data.recentActivity.payments.length === 0 && (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No recent payments
              </div>
            )}
          </div>
        </div>

        {/* Recent Signups */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 p-4 sm:p-6 dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Recent Signups
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Latest user registrations</p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.recentActivity.signups.map((signup) => (
              <div key={signup.id} className="flex items-center justify-between p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="hidden sm:flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <Users className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {signup.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {signup.email}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 sm:px-2.5 py-0.5 text-xs font-medium ${
                      signup.verified
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}
                  >
                    {signup.verified ? "Verified" : "Pending"}
                  </span>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(signup.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {data.recentActivity.signups.length === 0 && (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No recent signups
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-6 sm:h-8 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-10 w-full sm:w-36 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-80 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
    </div>
  );
}
