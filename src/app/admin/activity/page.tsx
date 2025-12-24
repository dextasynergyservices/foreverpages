"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, Activity, X } from "lucide-react";
import { ResponsiveTable, TableColumn } from "@/components/admin/ResponsiveTable";
import { Button } from "@/components/ui/button";

interface ActivityLog {
  id: string;
  eventType: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function AdminActivityPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-activity", page, limit, search, eventType, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(eventType && { eventType }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const res = await fetch(`/api/admin/activity?${params}`);
      if (!res.ok) throw new Error("Failed to fetch activity logs");
      return res.json();
    },
  });

  const activities: ActivityLog[] = data?.data?.activities || [];
  const pagination = data?.data?.pagination || { page: 1, limit: 10, total: 0, pages: 0 };

  const clearFilters = () => {
    setSearch("");
    setEventType("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  // Define table columns
  const columns: TableColumn<ActivityLog>[] = [
    {
      key: "user",
      label: "User",
      render: (activity) =>
        activity.user ? (
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{activity.user.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{activity.user.email}</p>
          </div>
        ) : (
          <span className="text-sm text-gray-500">System</span>
        ),
    },
    {
      key: "event",
      label: "Event",
      render: (activity) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            activity.eventType === "USER_REGISTRATION"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              : activity.eventType === "EMAIL_VERIFICATION"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                : activity.eventType === "PAYMENT_COMPLETED"
                  ? "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
          }`}
        >
          {activity.eventType?.replace(/_/g, " ") || "Unknown"}
        </span>
      ),
    },
    {
      key: "details",
      label: "Details",
      render: (activity) =>
        activity.metadata && Object.keys(activity.metadata).length > 0 ? (
          <details className="cursor-pointer">
            <summary className="text-gray-900 dark:text-gray-100 hover:text-gray-90">
              View details
            </summary>
            <pre className="mt-2 rounded bg-gray-100 p-2 text-xs dark:bg-gray-900">
              {JSON.stringify(activity.metadata, null, 2)}
            </pre>
          </details>
        ) : (
          <span className="text-gray-500">No metadata</span>
        ),
    },
    {
      key: "timestamp",
      label: "Timestamp",
      render: (activity) => (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(activity.createdAt).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-400">
            {new Date(activity.createdAt).toLocaleTimeString()}
          </p>
        </div>
      ),
    },
  ];

  // Mobile card renderer
  const renderMobileCard = (activity: ActivityLog) => (
    <div
      key={activity.id}
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          {activity.user ? (
            <>
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {activity.user.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {activity.user.email}
              </p>
            </>
          ) : (
            <p className="font-medium text-gray-500">System</p>
          )}
        </div>
        <span
          className={`ml-2 inline-flex flex-shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            activity.eventType === "USER_REGISTRATION"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              : activity.eventType === "EMAIL_VERIFICATION"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                : activity.eventType === "PAYMENT_COMPLETED"
                  ? "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
          }`}
        >
          {activity.eventType?.replace(/_/g, " ") || "Unknown"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Timestamp:</span>
          <p className="text-gray-900 dark:text-white">
            {new Date(activity.createdAt).toLocaleDateString()} at{" "}
            {new Date(activity.createdAt).toLocaleTimeString()}
          </p>
        </div>
        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
          <div>
            <details className="cursor-pointer">
              <summary className="text-gray-900 dark:text-gray-100 hover:text-gray-90text-sm">
                View metadata
              </summary>
              <pre className="mt-2 rounded bg-gray-100 p-2 text-xs dark:bg-gray-900 overflow-x-auto">
                {JSON.stringify(activity.metadata, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Responsive */}
      <div className="flex items-center gap-3">
        <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-gray-900 dark:text-gray-100 flex-shrink-0" />
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            Activity Logs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {pagination.total} total activities
          </p>
        </div>
      </div>

      {/* Filters - Collapsible on Mobile */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="lg:hidden rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {filtersOpen ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
          </button>
        </div>

        <div
          className={`mt-4 grid gap-4 ${filtersOpen ? "grid-cols-1" : "hidden"} sm:grid-cols-2 lg:grid lg:grid-cols-5`}
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Name or email..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-gray-700 dark:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-700 dark:ring-gray-300 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Event Type
            </label>
            <select
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-gray-700 dark:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-700 dark:ring-gray-300 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Events</option>
              <option value="USER_REGISTRATION">User Registration</option>
              <option value="EMAIL_VERIFICATION">Email Verification</option>
              <option value="PAYMENT_COMPLETED">Payment Completed</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-gray-700 dark:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-700 dark:ring-gray-300 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-gray-700 dark:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-700 dark:ring-gray-300 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={clearFilters} className="w-full">
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Table/Cards - Responsive */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-900 dark:border-gray-100 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">Failed to load activity logs</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No activity logs found</p>
          </div>
        ) : (
          <>
            <ResponsiveTable
              columns={columns}
              data={activities}
              renderMobileCard={renderMobileCard}
              keyExtractor={(activity) => activity.id}
            />

            {/* Pagination - Responsive */}
            <div className="flex flex-col gap-4 border-t border-gray-200 px-4 py-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total)} of{" "}
                  {pagination.total} results
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">Rows per page:</label>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="rounded-lg border border-gray-300 bg-white py-1 px-2 text-sm shadow-sm focus:border-gray-700 dark:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-700 dark:ring-gray-300 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Page {page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
