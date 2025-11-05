"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Check, X, Clock, Heart, Flag } from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";
import { TributeCardSkeleton } from "@/components/ui/skeleton";
import { useTributes } from "@/hooks/useQueries";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";
import { useOfflineTributes } from "@/hooks/useOfflineTributes";
import { useOfflineStatus } from "@/contexts/OfflineContext";
import { OfflineBanner, SyncProgress } from "@/components/ui/offline-indicator";
import { Tribute as OfflineTribute } from "@/lib/offline/db-schema";

interface Tribute {
  id: string;
  author: string;
  email: string;
  message: string;
  date: string;
  status: "pending" | "approved" | "rejected" | "flagged";
}

const Tributes = () => {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const { isOnline } = useOfflineStatus();
  const { data: tributesData, isLoading, error } = useTributes();
  const {
    tributes: offlineTributes,
    isLoading: offlineLoading,
    updateTribute,
  } = useOfflineTributes();
  const [tributes, setTributes] = useState<Tribute[]>([]);

  // Use offline data when offline, online data when available
  const isCurrentlyLoading = isOnline ? isLoading : offlineLoading;

  // Convert offline tribute format to local format
  const convertOfflineTribute = (offlineTribute: OfflineTribute): Tribute => ({
    id: offlineTribute.id,
    author: offlineTribute.author.name || "Anonymous",
    email: offlineTribute.author.email || "",
    message: offlineTribute.message,
    date: offlineTribute.createdAt.toISOString().split("T")[0], // Convert to date string
    status: offlineTribute.status,
  });

  // Update local state when data loads
  React.useEffect(() => {
    if (isOnline && tributesData?.data?.tributes) {
      setTributes(tributesData.data.tributes);
    } else if (!isOnline && offlineTributes) {
      const convertedTributes = offlineTributes.map(convertOfflineTribute);
      setTributes(convertedTributes);
    }
  }, [tributesData, offlineTributes, isOnline]);

  const getStatusColor = (status: Tribute["status"]) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      case "flagged":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: Tribute["status"]) => {
    switch (status) {
      case "approved":
        return Check;
      case "pending":
        return Clock;
      case "rejected":
        return X;
      case "flagged":
        return Flag;
      default:
        return MessageSquare;
    }
  };

  const approveTribute = async (id: string) => {
    if (isOnline) {
      // Online: Update local state optimistically
      setTributes(
        tributes.map((tribute) =>
          tribute.id === id ? { ...tribute, status: "approved" } : tribute
        )
      );
    } else {
      // Offline: Use offline hook
      await updateTribute(id, { status: "approved" });
    }
  };

  const rejectTribute = async (id: string) => {
    if (isOnline) {
      // Online: Update local state optimistically
      setTributes(
        tributes.map((tribute) =>
          tribute.id === id ? { ...tribute, status: "rejected" } : tribute
        )
      );
    } else {
      // Offline: Use offline hook
      await updateTribute(id, { status: "rejected" });
    }
  };

  const flagTribute = async (id: string) => {
    if (isOnline) {
      // Online: Update local state optimistically
      setTributes(
        tributes.map((tribute) => (tribute.id === id ? { ...tribute, status: "flagged" } : tribute))
      );
    } else {
      // Offline: Use offline hook
      await updateTribute(id, { status: "flagged" });
    }
  };

  const pendingCount = tributes.filter((t) => t.status === "pending").length;
  const approvedCount = tributes.filter((t) => t.status === "approved").length;
  const flaggedCount = tributes.filter((t) => t.status === "flagged").length;

  const cardBorder = theme === "dark" ? "border-white/10" : "border-gray-200";
  const cardBg = theme === "dark" ? "bg-black" : "bg-white";
  const textMuted = theme === "dark" ? "text-white/70" : "text-gray-600";
  const activeTabClasses =
    theme === "dark"
      ? "data-[state=active]:bg-white data-[state=active]:text-black"
      : "data-[state=active]:bg-black data-[state=active]:text-white";

  return (
    <div
      className={`min-h-screen p-4 md:p-8 ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      {/* Offline indicators */}
      <OfflineBanner />
      <SyncProgress />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold">
            {t("dashboard.tributes.title")}
          </h1>
          <p className={`mt-2 ${textMuted}`}>{t("dashboard.tributes.subtitle")}</p>
        </div>
        <div className="flex gap-4">
          <Card className={`p-4 border ${cardBorder} ${cardBg}`}>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <div className={`text-sm ${textMuted}`}>{t("dashboard.tributes.tabs.approved")}</div>
          </Card>
          <Card className={`p-4 border ${cardBorder} ${cardBg}`}>
            <div className="text-2xl font-bold text-secondary">{pendingCount}</div>
            <div className={`text-sm ${textMuted}`}>{t("dashboard.tributes.tabs.pending")}</div>
          </Card>
          {flaggedCount > 0 && (
            <Card className={`p-4 border ${cardBorder} ${cardBg}`}>
              <div className="text-2xl font-bold text-destructive">{flaggedCount}</div>
              <div className={`text-sm ${textMuted}`}>{t("dashboard.tributes.tabs.flagged")}</div>
            </Card>
          )}
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 gap-2 md:flex md:gap-2 md:overflow-visible">
          <TabsTrigger
            value="pending"
            className={`flex-shrink-0 px-3 py-2 text-sm md:text-base whitespace-nowrap relative ${activeTabClasses}`}
          >
            {t("dashboard.tributes.tabs.pending")}
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className={`flex-shrink-0 px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
          >
            {t("dashboard.tributes.tabs.approved")}
          </TabsTrigger>
          <TabsTrigger
            value="flagged"
            className={`flex-shrink-0 px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
          >
            {t("dashboard.tributes.tabs.flagged")}
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className={`flex-shrink-0 px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
          >
            {t("dashboard.tributes.tabs.all")}
          </TabsTrigger>
        </TabsList>
        {/* Spacer on small screens to prevent tabs overlapping content when grid rows are taller */}
        <div className="h-12 md:hidden" aria-hidden />

        <TabsContent value="pending" className="space-y-4">
          {isCurrentlyLoading ? (
            Array.from({ length: 3 }).map((_, i) => <TributeCardSkeleton key={i} />)
          ) : error && isOnline ? (
            <QueryErrorBoundary>
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {t("tributes.error", {}, "Unable to load tributes data")}
                </p>
              </div>
            </QueryErrorBoundary>
          ) : (
            <>
              {tributes
                .filter((t) => t.status === "pending")
                .map((tribute) => (
                  <Card key={tribute.id} className={`border ${cardBorder} ${cardBg}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback
                              className={theme === "dark" ? "bg-white/10" : "bg-gray-100"}
                            >
                              {tribute.author
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{tribute.author}</h3>
                              <Badge variant={getStatusColor(tribute.status)}>
                                {tribute.status}
                              </Badge>
                            </div>
                            <p className={`text-sm ${textMuted}`}>
                              {tribute.email} • {tribute.date}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="leading-relaxed mb-4">{tribute.message}</p>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="memorial"
                          size="sm"
                          onClick={() => approveTribute(tribute.id)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          {t("dashboard.tributes.actions.approve")}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => rejectTribute(tribute.id)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          {t("dashboard.tributes.actions.reject")}
                        </Button>
                        <Button
                          variant={theme === "dark" ? "memorial-ghost" : "outline"}
                          size="sm"
                          onClick={() => flagTribute(tribute.id)}
                        >
                          <Flag className="h-4 w-4 mr-2" />
                          {t("dashboard.tributes.actions.flag")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              {tributes.filter((t) => t.status === "pending").length === 0 && (
                <Card className={`border ${cardBorder} ${cardBg}`}>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-60" />
                    <h3 className="text-lg font-semibold mb-2">
                      {t("dashboard.tributes.empty.noPending")}
                    </h3>
                    <p className={textMuted}>{t("dashboard.tributes.empty.allReviewed")}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {isCurrentlyLoading ? (
            Array.from({ length: 3 }).map((_, i) => <TributeCardSkeleton key={i} />)
          ) : error && isOnline ? (
            <QueryErrorBoundary>
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {t("tributes.error", {}, "Unable to load tributes data")}
                </p>
              </div>
            </QueryErrorBoundary>
          ) : (
            tributes
              .filter((t) => t.status === "approved")
              .map((tribute) => (
                <Card key={tribute.id} className={`border ${cardBorder} ${cardBg}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback
                            className={theme === "dark" ? "bg-white/10" : "bg-gray-100"}
                          >
                            {tribute.author
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{tribute.author}</h3>
                            <Badge variant="default">
                              <Heart className="h-3 w-3 mr-1" />
                              {t("dashboard.tributes.live")}
                            </Badge>
                          </div>
                          <p className={`text-sm ${textMuted}`}>{tribute.date}</p>
                        </div>
                      </div>
                      <Button variant={theme === "dark" ? "memorial-ghost" : "outline"} size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed">{tribute.message}</p>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="flagged" className="space-y-4">
          {isCurrentlyLoading ? (
            Array.from({ length: 3 }).map((_, i) => <TributeCardSkeleton key={i} />)
          ) : error && isOnline ? (
            <QueryErrorBoundary>
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {t("tributes.error", {}, "Unable to load tributes data")}
                </p>
              </div>
            </QueryErrorBoundary>
          ) : (
            tributes
              .filter((t) => t.status === "flagged")
              .map((tribute) => (
                <Card key={tribute.id} className={`border ${cardBorder} ${cardBg}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-white/10">
                            {tribute.author
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{tribute.author}</h3>
                            <Badge variant="destructive">
                              <Flag className="h-3 w-3 mr-1" />
                              {t("dashboard.tributes.tabs.flagged")}
                            </Badge>
                          </div>
                          <p className={`text-sm ${textMuted}`}>
                            {tribute.email} • {tribute.date}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed mb-4">{tribute.message}</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="memorial"
                        size="sm"
                        onClick={() => approveTribute(tribute.id)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {t("dashboard.tributes.actions.approve")}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => rejectTribute(tribute.id)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        {t("dashboard.tributes.actions.reject")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {isCurrentlyLoading ? (
            Array.from({ length: 3 }).map((_, i) => <TributeCardSkeleton key={i} />)
          ) : error && isOnline ? (
            <QueryErrorBoundary>
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {t("tributes.error", {}, "Unable to load tributes data")}
                </p>
              </div>
            </QueryErrorBoundary>
          ) : (
            tributes.map((tribute) => {
              const StatusIcon = getStatusIcon(tribute.status);
              return (
                <Card key={tribute.id} className={`border ${cardBorder} ${cardBg}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback
                            className={theme === "dark" ? "bg-white/10" : "bg-gray-100"}
                          >
                            {tribute.author
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{tribute.author}</h3>
                            <Badge variant={getStatusColor(tribute.status)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {tribute.status}
                            </Badge>
                          </div>
                          <p className={`text-sm ${textMuted}`}>
                            {tribute.email} • {tribute.date}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed">{tribute.message}</p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default Tributes;
