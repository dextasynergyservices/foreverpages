"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";
import { InvitationsHeader } from "./InvitationsHeader";
import { CreateInvitationTab } from "./CreateInvitationTab";
import { ManageInvitationsTab } from "./ManageInvitationsTab";
import { RSVPTab } from "./RSVPTab";
import { InvitationCardSkeleton } from "@/components/ui/skeleton";
import { useInvitations } from "@/hooks/useQueries";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";

export interface Invitation {
  id: string;
  email: string;
  name: string;
  status: "sent" | "pending" | "delivered";
  rsvp: "yes" | "no" | "maybe" | null;
}

const Invitations = () => {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const { data: invitationsData, isLoading, error } = useInvitations();
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  // Update local state when data loads
  React.useEffect(() => {
    if (invitationsData?.data?.invitations) {
      setInvitations(invitationsData.data.invitations);
    }
  }, [invitationsData]);

  const handleRemoveInvitation = (id: string) => {
    setInvitations(invitations.filter((inv) => inv.id !== id));
  };

  const handleResendInvitation = (id: string) => {
    console.log("Resending invitation:", id);
  };

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

  return (
    <div
      className={`min-h-screen p-4 md:p-8 ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      <InvitationsHeader theme={theme} t={safeT} textMuted={themeClasses.textMuted} />

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 gap-2">
          <TabsTrigger
            value="create"
            className={`px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
          >
            {safeT("dashboard.invitations.tabs.create")}
          </TabsTrigger>
          <TabsTrigger
            value="manage"
            className={`px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
          >
            {safeT("dashboard.invitations.tabs.manage")}
          </TabsTrigger>
          <TabsTrigger
            value="rsvp"
            className={`px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
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
            <ManageInvitationsTab
              invitations={invitations}
              onRemoveInvitation={handleRemoveInvitation}
              onResendInvitation={handleResendInvitation}
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
            <RSVPTab invitations={invitations} themeClasses={themeClasses} t={safeT} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Invitations;
