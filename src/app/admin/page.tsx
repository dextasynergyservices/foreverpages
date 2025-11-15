"use client";

import { useEffect, useState } from "react";
import { Users, CheckCircle, DollarSign, CreditCard, TrendingUp, TrendingDown } from "lucide-react";

interface DashboardStats {
  overview: {
    totalUsers: number;
    verifiedUsers: number;
    verificationRate: number;
    totalRevenue: number;
    totalPayments: number;
    activeSubscriptions: number;
  };
  growth: {
    usersToday: number;
    usersThisMonth: number;
    usersLastMonth: number;
    userGrowth: number;
    revenueThisMonth: number;
    revenueLastMonth: number;
    revenueGrowth: number;
  };
  recentSignups: Array<{
    id: string;
    name: string;
    email: string;
    verified: boolean;
    plan: string;
    amount: string;
    signupDate: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/stats");
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch stats");
      }

      setStats(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
        <p className="font-medium">Error loading dashboard</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-lg bg-yellow-50 p-4 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.overview.totalUsers}
          icon={<Users className="h-6 w-6" />}
          color="purple"
          subtitle={`${stats.growth.usersToday} new today`}
        />
        <StatsCard
          title="Verified Users"
          value={stats.overview.verifiedUsers}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
          subtitle={`${stats.overview.verificationRate.toFixed(1)}% verified`}
        />
        <StatsCard
          title="Total Revenue"
          value={`₦${stats.overview.totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          color="blue"
          subtitle={`${stats.overview.totalPayments} payments`}
        />
        <StatsCard
          title="Active Subscriptions"
          value={stats.overview.activeSubscriptions}
          icon={<CreditCard className="h-6 w-6" />}
          color="indigo"
          subtitle="Current subscribers"
        />
      </div>

      {/* Growth Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        <GrowthCard
          title="User Growth"
          thisMonth={stats.growth.usersThisMonth}
          lastMonth={stats.growth.usersLastMonth}
          growth={stats.growth.userGrowth}
          label="signups this month"
        />
        <GrowthCard
          title="Revenue Growth"
          thisMonth={stats.growth.revenueThisMonth}
          lastMonth={stats.growth.revenueLastMonth}
          growth={stats.growth.revenueGrowth}
          label="revenue this month"
          isCurrency
        />
      </div>

      {/* Recent Signups */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Signups</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Latest {stats.recentSignups.length} user registrations
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {stats.recentSignups.map((signup) => (
                <tr key={signup.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{signup.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{signup.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">{signup.plan}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {signup.amount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {signup.verified ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(signup.signupDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: "purple" | "green" | "blue" | "indigo";
  subtitle: string;
}) {
  const colorClasses = {
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

function GrowthCard({
  title,
  thisMonth,
  lastMonth,
  growth,
  label,
  isCurrency,
}: {
  title: string;
  thisMonth: number;
  lastMonth: number;
  growth: number;
  label: string;
  isCurrency?: boolean;
}) {
  const isPositive = growth >= 0;
  const displayValue = isCurrency ? `₦${thisMonth.toLocaleString()}` : thisMonth;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <div className="mt-4">
        <div className="flex items-baseline space-x-2">
          <p className="text-4xl font-bold text-gray-900 dark:text-white">{displayValue}</p>
          <span
            className={`flex items-center text-sm font-medium ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="mr-1 h-4 w-4" />
            ) : (
              <TrendingDown className="mr-1 h-4 w-4" />
            )}
            {Math.abs(growth).toFixed(1)}%
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          vs {isCurrency ? `₦${lastMonth.toLocaleString()}` : lastMonth} last month
        </p>
      </div>
    </div>
  );
}
