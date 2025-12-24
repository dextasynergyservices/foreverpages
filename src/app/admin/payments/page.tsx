"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, X } from "lucide-react";
import { ResponsiveTable, TableColumn } from "@/components/admin/ResponsiveTable";
import { Button } from "@/components/ui/button";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  reference: string;
  status: string;
  paidAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  plan: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-payments", page, limit, search, status, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(status && { status }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const res = await fetch(`/api/admin/payments?${params}`);
      if (!res.ok) throw new Error("Failed to fetch payments");
      return res.json();
    },
  });

  const payments: Payment[] = data?.data?.payments || [];
  const pagination = data?.data?.pagination || { page: 1, limit: 10, total: 0, pages: 0 };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  // Define table columns
  const columns: TableColumn<Payment>[] = [
    {
      key: "user",
      label: "User",
      render: (payment) =>
        payment.user ? (
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{payment.user.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{payment.user.email}</p>
          </div>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">Guest User</span>
        ),
    },
    {
      key: "plan",
      label: "Plan",
      render: (payment) => (
        <span className="text-sm text-gray-900 dark:text-white">{payment.plan.name}</span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (payment) => (
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {payment.currency} {payment.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: "reference",
      label: "Reference",
      render: (payment) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">{payment.reference}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (payment) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            payment.status === "COMPLETED"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : payment.status === "FAILED"
                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
          }`}
        >
          {payment.status}
        </span>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (payment) => (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(payment.paidAt).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-400">{new Date(payment.paidAt).toLocaleTimeString()}</p>
        </div>
      ),
    },
  ];

  // Mobile card renderer
  const renderMobileCard = (payment: Payment) => (
    <div
      key={payment.id}
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {payment.user?.name || "Guest User"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {payment.user?.email || "N/A"}
          </p>
        </div>
        <span
          className={`ml-2 inline-flex flex-shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            payment.status === "COMPLETED"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : payment.status === "FAILED"
                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
          }`}
        >
          {payment.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Plan:</span>
          <p className="font-medium text-gray-900 dark:text-white">{payment.plan.name}</p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Amount:</span>
          <p className="font-medium text-gray-900 dark:text-white">
            {payment.currency} {payment.amount.toLocaleString()}
          </p>
        </div>
        <div className="col-span-2">
          <span className="text-gray-500 dark:text-gray-400">Reference:</span>
          <p className="text-gray-900 dark:text-white font-mono text-xs">{payment.reference}</p>
        </div>
        <div className="col-span-2">
          <span className="text-gray-500 dark:text-gray-400">Date:</span>
          <p className="text-gray-900 dark:text-white">
            {new Date(payment.paidAt).toLocaleDateString()} at{" "}
            {new Date(payment.paidAt).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Responsive */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Payments</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {pagination.total} total payments
        </p>
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
                placeholder="Name, email, reference..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-gray-700 dark:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-700 dark:ring-gray-300 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-gray-700 dark:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-700 dark:ring-gray-300 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
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
            <p className="text-sm text-red-600 dark:text-red-400">Failed to load payments</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No payments found</p>
          </div>
        ) : (
          <>
            <ResponsiveTable
              columns={columns}
              data={payments}
              renderMobileCard={renderMobileCard}
              keyExtractor={(payment) => payment.id}
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
