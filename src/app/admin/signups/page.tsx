"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Download, Filter, ChevronLeft, ChevronRight, X } from "lucide-react";
import { ResponsiveTable, TableColumn } from "@/components/admin/ResponsiveTable";
import { Button } from "@/components/ui/button";

interface Signup {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  verified: boolean;
  verifiedAt: string | null;
  plan: {
    id: string;
    name: string;
    slug: string;
  };
  payment: {
    id: string;
    amount: number;
    currency: string;
    reference: string;
    paidAt: string;
  } | null;
  subscription: {
    id: string;
    status: string;
    startDate: string;
    expiresAt: string;
  } | null;
  signupDate: string;
}

export default function AdminSignupsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [planId, setPlanId] = useState("");
  const [verified, setVerified] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-signups", page, limit, search, planId, verified, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(planId && { planId }),
        ...(verified && { verified }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const res = await fetch(`/api/admin/signups?${params}`);
      if (!res.ok) throw new Error("Failed to fetch signups");
      return res.json();
    },
  });

  const signups: Signup[] = data?.data?.users || [];
  const pagination = data?.data?.pagination || { page: 1, limit: 10, total: 0, pages: 0 };

  async function exportCSV() {
    try {
      const params = new URLSearchParams({
        ...(planId && { planId }),
        ...(verified && { verified }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const url = `/api/admin/export?${params}`;
      window.open(url, "_blank");
    } catch {
      alert("Failed to export CSV");
    }
  }

  const clearFilters = () => {
    setSearch("");
    setPlanId("");
    setVerified("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  // Define table columns
  const columns: TableColumn<Signup>[] = [
    {
      key: "user",
      label: "User",
      render: (signup) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{signup.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{signup.email}</p>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (signup) => (
        <span className="text-sm text-gray-900 dark:text-white">{signup.phone || "-"}</span>
      ),
    },
    {
      key: "plan",
      label: "Plan",
      render: (signup) => (
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {signup.plan.name}
        </span>
      ),
    },
    {
      key: "payment",
      label: "Payment",
      render: (signup) =>
        signup.payment ? (
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {signup.payment.currency} {signup.payment.amount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{signup.payment.reference}</p>
          </div>
        ) : (
          <span className="text-sm text-gray-500">-</span>
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (signup) =>
        signup.verified ? (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Verified
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Pending
          </span>
        ),
    },
    {
      key: "subscription",
      label: "Subscription",
      render: (signup) =>
        signup.subscription ? (
          <div>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                signup.subscription.status === "ACTIVE"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {signup.subscription.status}
            </span>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Expires: {new Date(signup.subscription.expiresAt).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <span className="text-sm text-gray-500">-</span>
        ),
    },
    {
      key: "signupDate",
      label: "Signup Date",
      render: (signup) => (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(signup.signupDate).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-400">
            {new Date(signup.signupDate).toLocaleTimeString()}
          </p>
        </div>
      ),
    },
  ];

  // Mobile card renderer
  const renderMobileCard = (signup: Signup) => (
    <div
      key={signup.id}
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 dark:text-white truncate">{signup.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{signup.email}</p>
        </div>
        <span
          className={`ml-2 inline-flex flex-shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            signup.verified
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
          }`}
        >
          {signup.verified ? "Verified" : "Pending"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Plan:</span>
          <p className="font-medium text-gray-900 dark:text-white">{signup.plan.name}</p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Phone:</span>
          <p className="text-gray-900 dark:text-white">{signup.phone || "-"}</p>
        </div>
        {signup.payment && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">Payment:</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {signup.payment.currency} {signup.payment.amount.toLocaleString()}
            </p>
          </div>
        )}
        {signup.subscription && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">Subscription:</span>
            <p className="text-gray-900 dark:text-white">{signup.subscription.status}</p>
          </div>
        )}
        <div className="col-span-2">
          <span className="text-gray-500 dark:text-gray-400">Signup Date:</span>
          <p className="text-gray-900 dark:text-white">
            {new Date(signup.signupDate).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Signups</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {pagination.total} total registrations
          </p>
        </div>
        <Button onClick={exportCSV} className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
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
              Verification Status
            </label>
            <select
              value={verified}
              onChange={(e) => {
                setVerified(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-gray-700 dark:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-700 dark:ring-gray-300 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Pending</option>
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
            <p className="text-sm text-red-600 dark:text-red-400">
              {error instanceof Error ? error.message : "Failed to load signups"}
            </p>
          </div>
        ) : signups.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No signups found</p>
          </div>
        ) : (
          <>
            <ResponsiveTable
              columns={columns}
              data={signups}
              renderMobileCard={renderMobileCard}
              keyExtractor={(signup) => signup.id}
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
