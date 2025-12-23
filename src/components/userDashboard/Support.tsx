"use client";

import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart,
  ArrowDownLeft,
  Calendar,
  Users,
  ExternalLink,
  MessageCircle,
  Mail,
  Send,
  Phone,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useTranslations } from "@/hooks/useTranslations";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Label } from "@/components/ui/label";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/textArea";
import { Checkbox } from "@/components/ui/checkbox";

interface SupportItem {
  id: string;
  amount: number;
  currency: string;
  message?: string;
  donorName?: string;
  donorEmail?: string;
  accountType: string;
  createdAt: string;
  memorial?: {
    id: string;
    slug: string;
    firstName: string;
    lastName: string;
  };
  donor?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface SupportResponse {
  supports: SupportItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface SupportStats {
  totalReceived: number;
  totalSent: number;
  receivedCount: number;
  sentCount: number;
  averageSupport: number;
  lastSupportDate: string | null;
  topSupporterName: string | null;
  topSupportAmount: number;
  currentMonthTotal: number;
  lastMonthTotal: number;
}

const Support = () => {
  const { theme } = useTheme();
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState("received");
  const [preferredCurrency, setPreferredCurrency] = useState("USD");

  // Pagination state
  const [receivedPage, setReceivedPage] = useState(1);
  // Page for the supporters selector (send messages tab)
  const [supportersPage, setSupportersPage] = useState(1);
  const pageSize = 10;

  // Cache duration for exchange rates
  const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  // API functions
  const fetchExchangeRates = useCallback(
    async (baseCurrency: string = "USD"): Promise<Record<string, number>> => {
      const cacheKey = `exchange_rates_${baseCurrency}`;
      const cacheTimeKey = `exchange_rates_time_${baseCurrency}`;
      const now = Date.now();

      // Check localStorage cache first
      try {
        const cachedRates = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheTimeKey);

        if (cachedRates && cachedTime && now - parseInt(cachedTime) < CACHE_DURATION) {
          return JSON.parse(cachedRates);
        }
      } catch (error) {
        console.warn("Cache read failed:", error);
      }

      try {
        // Use our own API endpoint that handles the exchange rates server-side
        const response = await fetch(`/api/exchange-rates?base=${baseCurrency}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const rates = data.rates;

        // Cache the results
        try {
          localStorage.setItem(cacheKey, JSON.stringify(rates));
          localStorage.setItem(cacheTimeKey, now.toString());
        } catch (error) {
          console.warn("Cache write failed:", error);
        }

        return rates;
      } catch (error) {
        console.error("Exchange rate fetch failed:", error);

        // Fallback rates
        return {
          USD: 1,
          EUR: 0.85,
          GBP: 0.73,
          NGN: 1650,
          CAD: 1.25,
          AUD: 1.35,
        };
      }
    },
    [CACHE_DURATION]
  );

  const fetchReceivedSupports = async (page: number = 1): Promise<SupportResponse> => {
    const response = await fetch(`/api/user/supports/received?page=${page}&limit=${pageSize}`);
    if (!response.ok) throw new Error("Failed to fetch received supports");
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to fetch received supports");
    return {
      supports: data.supports || [],
      pagination: data.pagination,
    };
  };

  const fetchSupportStats = async (): Promise<SupportStats> => {
    const response = await fetch("/api/user/supports/stats");
    if (!response.ok) throw new Error("Failed to fetch support stats");
    const data = await response.json();
    if (!data.success) throw new Error(data.error || "Failed to fetch support stats");
    return (
      data.stats || {
        totalReceived: 0,
        totalSent: 0,
        receivedCount: 0,
        sentCount: 0,
        averageSupport: 0,
        lastSupportDate: null,
        topSupporterName: null,
        topSupportAmount: 0,
        currentMonthTotal: 0,
        lastMonthTotal: 0,
      }
    );
  };

  // TanStack Query hooks
  const {
    data: exchangeRates = {},
    isLoading: ratesLoading,
    dataUpdatedAt: ratesLastFetched,
  } = useQuery({
    queryKey: ["exchangeRates", "USD"],
    queryFn: () => fetchExchangeRates("USD"),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION * 2,
  });

  const {
    data: receivedData,
    isLoading: receivedIsLoading,
    error: receivedError,
    refetch: receivedRefetch,
  } = useQuery({
    queryKey: ["supports", "received", receivedPage],
    queryFn: () => fetchReceivedSupports(receivedPage),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Paginated supporters used in the "Send Messages" selector
  const { data: supportersData, isLoading: supportersIsLoading } = useQuery({
    queryKey: ["supports", "selection", supportersPage],
    queryFn: () => fetchReceivedSupports(supportersPage),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const {
    data: stats = {
      totalReceived: 0,
      totalSent: 0,
      receivedCount: 0,
      sentCount: 0,
      averageSupport: 0,
      lastSupportDate: null,
      topSupporterName: null,
      topSupportAmount: 0,
      currentMonthTotal: 0,
      lastMonthTotal: 0,
    },
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["supports", "stats"],
    queryFn: fetchSupportStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Messaging state
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [sendViaEmail, setSendViaEmail] = useState(true);
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(false);
  const [selectedSupporters, setSelectedSupporters] = useState<Set<string>>(new Set());

  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // Combined loading state
  const loading = receivedIsLoading || statsLoading;

  // (refetchAll removed - not used)

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      supporterIds: string[];
      subject?: string;
      message: string;
      sendViaEmail: boolean;
      sendViaWhatsApp: boolean;
    }) => {
      const response = await fetch("/api/user/supports/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send message");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Messages sent successfully!");
      setMessageSubject("");
      setMessageContent("");
      setSelectedSupporters(new Set());
      setActiveTab("received");
      // Invalidate and refetch support data
      queryClient.invalidateQueries({ queryKey: ["supports"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send messages: ${error.message}`);
    },
  });

  // Handle sending messages to supporters
  const handleSendMessages = () => {
    if (selectedSupporters.size === 0) {
      toast.error("Please select at least one supporter to message");
      return;
    }

    if (!messageContent.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!sendViaEmail && !sendViaWhatsApp) {
      toast.error("Please select at least one delivery method");
      return;
    }

    sendMessageMutation.mutate({
      supporterIds: Array.from(selectedSupporters),
      subject: messageSubject.trim() || undefined,
      message: messageContent.trim(),
      sendViaEmail,
      sendViaWhatsApp,
    });
  };

  // Toggle supporter selection
  const toggleSupporterSelection = (supportId: string) => {
    const newSelection = new Set(selectedSupporters);
    if (newSelection.has(supportId)) {
      newSelection.delete(supportId);
    } else {
      newSelection.add(supportId);
    }
    setSelectedSupporters(newSelection);
  };

  // Select all supporters
  const toggleSelectAll = () => {
    // Default to toggling current selector page supporters
    const pageSupports = supportersData?.supports || [];
    const pageIds = pageSupports.map((s) => s.id);

    const allSelectedOnPage = pageIds.every((id) => selectedSupporters.has(id));
    const newSelection = new Set(selectedSupporters);

    if (allSelectedOnPage) {
      // Deselect all on the current page
      pageIds.forEach((id) => newSelection.delete(id));
    } else {
      // Select all on the current page
      pageIds.forEach((id) => newSelection.add(id));
    }

    setSelectedSupporters(newSelection);
  };

  // Global select all across all pages (with safeguard)
  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const selectAllAcrossPages = async () => {
    const total = supportersData?.pagination?.total ?? receivedData?.pagination?.total ?? 0;
    const limit = 2000; // safety cap
    if (total > limit) {
      toast.error(
        t(
          "dashboard.support.messaging.selectAllTooMany",
          {},
          "Too many supporters to select at once"
        )
      );
      return;
    }

    const pages =
      supportersData?.pagination?.totalPages ?? receivedData?.pagination?.totalPages ?? 1;
    const allIds: string[] = [];

    type ReceivedApiResponse = {
      success?: boolean;
      supports?: SupportItem[];
      pagination?: SupportResponse["pagination"];
      error?: string;
    };
    for (let p = 1; p <= pages; p++) {
      try {
        const resp = await fetch(`/api/user/supports/received?page=${p}&limit=${pageSize}`);
        if (!resp.ok) throw new Error("Failed to fetch supporters");
        const data: ReceivedApiResponse = await resp.json();
        const ids = (data.supports || []).map((s) => s.id);
        ids.forEach((id) => allIds.push(id));
      } catch (err) {
        console.error("Failed to fetch page", p, err);
      }
    }

    const newSelection = new Set(selectedSupporters);
    allIds.forEach((id) => newSelection.add(id));
    setSelectedSupporters(newSelection);
    toast.success(t("dashboard.support.messaging.selectAllSuccess", {}, "Selected all supporters"));
  };

  // Currency conversion function
  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;

    // Convert through USD as base currency
    if (fromCurrency === "USD") {
      const rate = exchangeRates[toCurrency];
      return rate ? amount * rate : amount;
    } else if (toCurrency === "USD") {
      const rate = exchangeRates[fromCurrency];
      return rate ? amount / rate : amount;
    } else {
      // Convert from -> USD -> to
      const fromRate = exchangeRates[fromCurrency];
      const toRate = exchangeRates[toCurrency];

      if (!fromRate || !toRate) return amount;

      const usdAmount = amount / fromRate;
      return usdAmount * toRate;
    }
  };

  const formatCurrency = (amount: number, currency: string, originalCurrency?: string) => {
    // Convert currency if needed
    const convertedAmount =
      originalCurrency && originalCurrency !== currency
        ? convertCurrency(amount, originalCurrency, currency)
        : amount;

    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      NGN: "₦",
      CAD: "CA$",
      AUD: "AU$",
      JPY: "¥",
      CNY: "¥",
      INR: "₹",
      ZAR: "R",
      GHS: "₵",
      KES: "KSh",
    };

    const symbol = symbols[currency] || `${currency} `;

    // For currencies without symbols, show code before amount
    if (!symbols[currency]) {
      return `${currency} ${Math.round(convertedAmount).toLocaleString()}`;
    }

    return `${symbol}${Math.round(convertedAmount).toLocaleString()}`;
  };

  const getAccountTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      bank: "Bank Transfer",
      mobile_money: "Mobile Money",
      paypal: "PayPal",
      stripe: "Credit Card",
    };
    return types[type] || type;
  };

  const SupportCard = ({ support, type }: { support: SupportItem; type: "received" | "sent" }) => {
    const isReceived = type === "received";
    const name = isReceived
      ? support.donorName || support.donor?.name || "Anonymous"
      : `${support.memorial?.firstName} ${support.memorial?.lastName}`;

    return (
      <Card
        className={`transition-all hover:shadow-md ${theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200"}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${isReceived ? "bg-green-100 dark:bg-green-900/20" : "bg-blue-100 dark:bg-blue-900/20"}`}
              >
                {isReceived ? (
                  <ArrowDownLeft className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {formatCurrency(support.amount, preferredCurrency, support.currency)}
                </h3>
                {support.currency !== preferredCurrency && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("dashboard.support.originalAmount", {}, "Original")}:{" "}
                    {formatCurrency(support.amount, support.currency)}
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isReceived
                    ? t("dashboard.support.receivedFrom", {}, "Received from")
                    : t("dashboard.support.sentTo", {}, "Sent to")}{" "}
                  {name}
                </p>
              </div>
            </div>
            <Badge variant={isReceived ? "default" : "secondary"}>
              {getAccountTypeDisplay(support.accountType)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {support.message && (
            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-start gap-2">
                <MessageCircle className="h-4 w-4 text-gray-500 mt-0.5" />
                <p className="text-sm italic">{support.message}</p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>{formatDistanceToNow(new Date(support.createdAt), { addSuffix: true })}</span>
            </div>
            {!isReceived && support.memorial && (
              <Link
                href={`/memorial/${support.memorial.slug}`}
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>{t("dashboard.support.viewMemorial", {}, "View memorial")}</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }) => (
    <Card
      className={`transition-all hover:shadow-md ${theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200"}`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );

  // Pagination Component
  const PaginationControls = ({
    pagination,
    currentPage,
    onPageChange,
    isLoading,
  }: {
    pagination: SupportResponse["pagination"] | undefined;
    currentPage: number;
    onPageChange: (page: number) => void;
    isLoading: boolean;
  }) => {
    if (!pagination) return null;

    const { totalPages, hasNext, hasPrev, total } = pagination;

    return (
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of{" "}
          {total} results
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPrev || isLoading}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  disabled={isLoading}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNext || isLoading}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Support Skeleton Component
  const SupportSkeleton = () => (
    <div
      className={`min-h-screen p-8 ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <Skeleton className="w-8 h-8 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-6">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Support Cards Skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="space-y-2 mb-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <SupportSkeleton />;
  }

  return (
    <div
      className={`min-h-screen p-8 ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      {confirmDialog}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              {t("dashboard.support.title", {}, "Support History")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t(
                "dashboard.support.subtitle",
                {},
                "Track supports sent and received for memorials"
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("dashboard.support.displayCurrency", {}, "Display Currency:")}
            </label>
            <div className="relative">
              <Select
                value={preferredCurrency}
                onValueChange={setPreferredCurrency}
                disabled={ratesLoading}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">🇺🇸 USD</SelectItem>
                  <SelectItem value="EUR">🇪🇺 EUR</SelectItem>
                  <SelectItem value="GBP">🇬🇧 GBP</SelectItem>
                  <SelectItem value="NGN">🇳🇬 NGN</SelectItem>
                  <SelectItem value="CAD">🇨🇦 CAD</SelectItem>
                  <SelectItem value="AUD">🇦🇺 AUD</SelectItem>
                </SelectContent>
              </Select>
              {ratesLoading && (
                <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            {ratesLastFetched > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t("dashboard.support.ratesUpdated", {}, "Rates updated")}:{" "}
                {new Date(ratesLastFetched).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title={t("dashboard.support.stats.totalReceived", {}, "Total Received")}
            value={formatCurrency(
              convertCurrency(stats.totalReceived, "USD", preferredCurrency),
              preferredCurrency
            )}
            icon={ArrowDownLeft}
            color="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
          />
          <StatCard
            title={t("dashboard.support.stats.averageSupport", {}, "Average Support")}
            value={
              stats.receivedCount > 0
                ? formatCurrency(
                    convertCurrency(stats.averageSupport, "USD", preferredCurrency),
                    preferredCurrency
                  )
                : formatCurrency(0, preferredCurrency)
            }
            icon={TrendingUp}
            color="bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
          />
          <StatCard
            title={t("dashboard.support.stats.recentActivity", {}, "Recent Activity")}
            value={
              stats.lastSupportDate
                ? new Date(stats.lastSupportDate).toLocaleDateString()
                : t("dashboard.support.stats.noActivity", {}, "No activity")
            }
            icon={Calendar}
            color="bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
          />
          <StatCard
            title={t("dashboard.support.stats.supportsSent", {}, "Supports Sent")}
            value={stats.sentCount.toString()}
            icon={Users}
            color="bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
          />
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="received" className="flex items-center gap-2">
              <ArrowDownLeft className="h-4 w-4" />
              {t("dashboard.support.tabs.received", {}, "Received")} (
              {receivedData?.pagination?.total || 0})
            </TabsTrigger>
            <TabsTrigger value="message" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              {t("dashboard.support.tabs.message", {}, "Send Messages")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-6 mt-6">
            {receivedError ? (
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t("dashboard.support.error.title", {}, "Error loading data")}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{receivedError.message}</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    receivedRefetch();
                    refetchStats();
                  }}
                >
                  {t("dashboard.support.tryAgain", {}, "Try Again")}
                </Button>
              </div>
            ) : receivedData?.supports.length ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {receivedData.supports.map((support) => (
                    <SupportCard key={support.id} support={support} type="received" />
                  ))}
                </div>
                {receivedData?.pagination && (
                  <PaginationControls
                    pagination={receivedData?.pagination}
                    currentPage={receivedPage}
                    onPageChange={setReceivedPage}
                    isLoading={receivedIsLoading}
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t("dashboard.support.empty.received.title", {}, "No supports received yet")}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t(
                    "dashboard.support.empty.received.description",
                    {},
                    "When people support your memorials, they'll appear here."
                  )}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    receivedRefetch();
                    refetchStats();
                  }}
                >
                  {t("dashboard.support.refreshData", {}, "Refresh Data")}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="message" className="space-y-6 mt-6">
            {(supportersData?.pagination?.total ?? receivedData?.pagination?.total ?? 0) > 0 ? (
              <div className="space-y-6">
                {/* Message Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      {t("dashboard.support.messaging.title", {}, "Send Thank You Messages")}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t(
                        "dashboard.support.messaging.description",
                        {},
                        "Send personalized thank you messages to your supporters via email or WhatsApp."
                      )}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Subject Field */}
                    <div>
                      <Label htmlFor="message-subject">
                        {t("dashboard.support.messaging.subject", {}, "Subject (Optional)")}
                      </Label>
                      <input
                        id="message-subject"
                        type="text"
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                        placeholder={t(
                          "dashboard.support.messaging.subjectPlaceholder",
                          {},
                          "Thank you for your support..."
                        )}
                        value={messageSubject}
                        onChange={(e) => setMessageSubject(e.target.value)}
                      />
                    </div>

                    {/* Message Content */}
                    <div>
                      <Label htmlFor="message-content">
                        {t("dashboard.support.messaging.message", {}, "Message")}
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Textarea
                        id="message-content"
                        className="mt-1 min-h-[120px]"
                        placeholder={t(
                          "dashboard.support.messaging.messagePlaceholder",
                          {},
                          "Thank you so much for your generous support. Your kindness means the world to us during this difficult time..."
                        )}
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        rows={6}
                      />
                    </div>

                    {/* Delivery Methods */}
                    <div>
                      <Label className="block mb-3">
                        {t("dashboard.support.messaging.deliveryMethod", {}, "Delivery Method")}
                        <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="email-delivery"
                            checked={sendViaEmail}
                            onCheckedChange={(checked) => setSendViaEmail(checked === true)}
                          />
                          <Label
                            htmlFor="email-delivery"
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Mail className="h-4 w-4 text-blue-600" />
                            {t("dashboard.support.messaging.sendViaEmail", {}, "Send via Email")}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="whatsapp-delivery"
                            checked={sendViaWhatsApp}
                            onCheckedChange={(checked) => setSendViaWhatsApp(checked === true)}
                          />
                          <Label
                            htmlFor="whatsapp-delivery"
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Phone className="h-4 w-4 text-green-600" />
                            {t(
                              "dashboard.support.messaging.sendViaWhatsApp",
                              {},
                              "Send via WhatsApp"
                            )}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Supporters Selection */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {t("dashboard.support.messaging.selectSupporters", {}, "Select Supporters")}
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                        {(() => {
                          const pageIds = (supportersData?.supports || []).map((s) => s.id);
                          const allOnPageSelected =
                            pageIds.length > 0 && pageIds.every((id) => selectedSupporters.has(id));
                          return allOnPageSelected
                            ? t("dashboard.support.messaging.deselectPage", {}, "Deselect Page")
                            : t("dashboard.support.messaging.selectPage", {}, "Select Page");
                        })()}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t(
                        "dashboard.support.messaging.selectDescription",
                        {},
                        "Choose which supporters to send the message to."
                      )}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {t("dashboard.support.messaging.selectedCount", {}, "Selected")}:{" "}
                        {selectedSupporters.size}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            confirm({
                              title: t(
                                "dashboard.support.messaging.selectAllConfirmTitle",
                                {},
                                "Select all supporters?"
                              ),
                              description: t(
                                "dashboard.support.messaging.selectAllConfirmDescription",
                                {},
                                "This will select every supporter across all pages. This action may take some time for large numbers. Do you want to continue?"
                              ),
                              confirmText: t(
                                "dashboard.support.messaging.selectAllConfirm",
                                {},
                                "Select All"
                              ),
                              cancelText: t("common.cancel", {}, "Cancel"),
                              variant: "warning",
                              onConfirm: selectAllAcrossPages,
                            })
                          }
                        >
                          {t("dashboard.support.messaging.selectAll", {}, "Select All Supporters")}
                        </Button>
                        {selectedSupporters.size > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSupporters(new Set())}
                          >
                            {t("dashboard.support.messaging.clearSelection", {}, "Clear Selection")}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {(supportersData?.supports || []).map((support) => (
                        <div
                          key={support.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors $\{
                            selectedSupporters.has(support.id)
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                          }`}
                          onClick={() => toggleSupporterSelection(support.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={selectedSupporters.has(support.id)}
                              onChange={() => {}} // Handled by div click
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium truncate">
                                  {support.donorName || support.donor?.name || "Anonymous"}
                                </p>
                                <Badge variant="secondary">
                                  {formatCurrency(
                                    convertCurrency(
                                      support.amount,
                                      support.currency,
                                      preferredCurrency
                                    ),
                                    preferredCurrency
                                  )}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                {support.donorEmail || support.donor?.email}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {formatDistanceToNow(new Date(support.createdAt))} ago
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Pagination for supporters selector */}
                    <div className="mt-4">
                      <PaginationControls
                        pagination={supportersData?.pagination}
                        currentPage={supportersPage}
                        onPageChange={(p) => setSupportersPage(p)}
                        isLoading={supportersIsLoading}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Send Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSendMessages}
                    disabled={
                      sendMessageMutation.isPending ||
                      selectedSupporters.size === 0 ||
                      !messageContent.trim()
                    }
                    className="flex items-center gap-2"
                  >
                    {sendMessageMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {t("dashboard.support.messaging.sending", {}, "Sending...")}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {t("dashboard.support.messaging.sendMessage", {}, "Send Messages")} (
                        {selectedSupporters.size})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t(
                    "dashboard.support.messaging.noSupporters.title",
                    {},
                    "No supporters to message yet"
                  )}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t(
                    "dashboard.support.messaging.noSupporters.description",
                    {},
                    "When you receive support, you'll be able to send thank you messages to your supporters here."
                  )}
                </p>
                <Button variant="outline" onClick={() => setActiveTab("received")}>
                  {t("dashboard.support.messaging.viewSupport", {}, "View Support")}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Support;
