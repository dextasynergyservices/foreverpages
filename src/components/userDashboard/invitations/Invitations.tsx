"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";
import { InvitationsHeader } from "./InvitationsHeader";
import { CreateInvitationTab } from "./CreateInvitationTab";
import { ManageInvitationsTab } from "./ManageInvitationsTab";
import { RSVPTab } from "./RSVPTab";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { GuestListView } from "./GuestListView";
import { InvitationCardSkeleton } from "@/components/ui/skeleton";
import { useInvitations } from "@/hooks/useQueries";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";
import { InvitationListSkeleton } from "./SkeletonLoaders";
import { useInvitationPolling } from "@/hooks/useInvitationPolling";
import RealTimeStatusIndicator from "./RealTimeStatusIndicator";
import {
  showStatusChangeNotification,
  showBatchStatusChangeNotification,
} from "./StatusChangeNotification";

export interface Invitation {
  id: string;
  email: string;
  name: string;
  phone?: string;
  status: "pending" | "accepted" | "declined" | "expired" | "revoked" | "sent" | "delivered";
  rsvp: "yes" | "no" | "maybe" | null;
  rsvpStatus?: "ATTENDING" | "NOT_ATTENDING" | "MAYBE" | null;
  rsvpMessage?: string | null;
  rsvpAt?: string | null;
  message?: string | null;
  expiresAt?: string;
  sentViaEmail?: boolean;
  sentViaWhatsApp?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Guest management fields
  plusOnes?: number;
  dietaryRestrictions?: string;
  accessibilityNeeds?: string;
  specialRequests?: string;
}

const Invitations = () => {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const { data: invitationsData, isLoading, error, refetch, isRefetching } = useInvitations();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isPollingEnabled] = useState(true);

  // Update local state when data loads
  React.useEffect(() => {
    if (invitationsData?.data?.invitations) {
      setInvitations(invitationsData.data.invitations);
      setLastUpdate(new Date());
    }
  }, [invitationsData]);

  // Real-time polling for status updates
  // Using empty memorialId since API fetches all user's invitations
  const { refresh } = useInvitationPolling({
    memorialId: "", // API handles filtering by user
    enabled: isPollingEnabled,
    interval: 30000, // Poll every 30 seconds
    onStatusChange: (changes) => {
      setLastUpdate(new Date());

      // Show notifications for status changes
      if (changes.length === 1) {
        showStatusChangeNotification(changes[0], theme);
      } else if (changes.length > 1) {
        showBatchStatusChangeNotification(changes, theme);
      }
    },
  });

  const themeClasses = {
    cardBorder: theme === "dark" ? "border-white/10" : "border-gray-200",
    cardBg: theme === "dark" ? "bg-black" : "bg-white",
    textMuted: theme === "dark" ? "text-white/70" : "text-gray-600",
  };
  const activeTabClasses =
    theme === "dark"
      ? "data-[state=active]:bg-white data-[state=active]:text-black"
      : "data-[state=active]:bg-black data-[state=active]:text-white";

  // Create a type-safe wrapper for the t function
  const safeT = (key: string, params?: unknown, fallback?: string): string => {
    return t(key, params as Record<string, string | number> | undefined, fallback);
  };

  // Manual refresh handler
  const handleRefresh = () => {
    refetch();
    setLastUpdate(new Date());
  };

  return (
    <div
      className={`min-h-screen p-4 md:p-8 ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      <InvitationsHeader
        theme={theme}
        t={safeT}
        textMuted={themeClasses.textMuted}
        onRefresh={handleRefresh}
        isRefreshing={isRefetching}
      />

      {/* Real-time Status Indicator */}
      <div className="mb-4">
        <RealTimeStatusIndicator
          isPolling={isPollingEnabled}
          lastUpdate={lastUpdate}
          onRefresh={refresh}
          theme={theme}
          t={safeT}
        />
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2">
          <TabsTrigger
            value="create"
            className={`px-2 py-2 text-xs md:text-base whitespace-nowrap ${activeTabClasses}`}
          >
            {safeT("dashboard.invitations.tabs.create")}
          </TabsTrigger>
          <TabsTrigger
            value="manage"
            className={`px-2 py-2 text-xs md:text-base whitespace-nowrap ${activeTabClasses}`}
          >
            {safeT("dashboard.invitations.tabs.manage")}
          </TabsTrigger>
          <TabsTrigger
            value="guests"
            className={`px-2 py-2 text-xs md:text-base whitespace-nowrap ${activeTabClasses}`}
          >
            {safeT("dashboard.invitations.tabs.guests", {}, "Guests")}
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className={`px-2 py-2 text-xs md:text-base whitespace-nowrap ${activeTabClasses}`}
          >
            {safeT("dashboard.invitations.tabs.analytics", {}, "Analytics")}
          </TabsTrigger>
          <TabsTrigger
            value="rsvp"
            className={`px-2 py-2 text-xs md:text-base whitespace-nowrap ${activeTabClasses}`}
          >
            {safeT("dashboard.invitations.tabs.rsvp")}
          </TabsTrigger>
        </TabsList>
        <div className="h-12 md:hidden" aria-hidden />

        <TabsContent value="create" className="space-y-6">
          <CreateInvitationTab theme={theme} themeClasses={themeClasses} t={safeT} />
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          {isLoading ? (
            <InvitationListSkeleton count={3} />
          ) : error ? (
            <QueryErrorBoundary>
              <div
                className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">
                      {t("invitations.error", {}, "Unable to load invitations data")}
                    </p>
                  </div>
                </div>
              </div>
            </QueryErrorBoundary>
          ) : (
            <ManageInvitationsTab
              invitations={invitations}
              theme={theme}
              themeClasses={themeClasses}
              t={safeT}
            />
          )}
        </TabsContent>

        <TabsContent value="guests" className="space-y-6">
          {isLoading ? (
            <InvitationListSkeleton count={3} />
          ) : error ? (
            <QueryErrorBoundary>
              <div
                className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">
                      {t("invitations.error", {}, "Unable to load guest data")}
                    </p>
                  </div>
                </div>
              </div>
            </QueryErrorBoundary>
          ) : (
            <GuestListView invitations={invitations} themeClasses={themeClasses} t={safeT} />
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {isLoading ? (
            <InvitationListSkeleton count={3} />
          ) : error ? (
            <QueryErrorBoundary>
              <div
                className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">
                      {t("invitations.error", {}, "Unable to load analytics data")}
                    </p>
                  </div>
                </div>
              </div>
            </QueryErrorBoundary>
          ) : (
            <AnalyticsCharts
              invitations={invitations}
              theme={theme}
              themeClasses={themeClasses}
              t={safeT}
            />
          )}
        </TabsContent>

        <TabsContent value="rsvp" className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <InvitationCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <QueryErrorBoundary>
              <div
                className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">
                      {t("invitations.error", {}, "Unable to load invitations data")}
                    </p>
                  </div>
                </div>
              </div>
            </QueryErrorBoundary>
          ) : (
            <RSVPTab invitations={invitations} theme={theme} themeClasses={themeClasses} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Invitations;
