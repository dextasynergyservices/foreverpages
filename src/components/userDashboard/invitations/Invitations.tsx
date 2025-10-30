"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";
import { InvitationsHeader } from "./InvitationsHeader";
import { CreateInvitationTab } from "./CreateInvitationTab";
import { ManageInvitationsTab } from "./ManageInvitationsTab";
import { RSVPTab } from "./RSVPTab";

export interface Invitation {
  id: number;
  email: string;
  name: string;
  status: "sent" | "pending" | "delivered";
  rsvp: "yes" | "no" | "maybe" | null;
}

const Invitations = () => {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const [invitations, setInvitations] = useState<Invitation[]>([
    { id: 1, email: "family@email.com", name: "Family Members", status: "sent", rsvp: "yes" },
    { id: 2, email: "friends@email.com", name: "Close Friends", status: "pending", rsvp: null },
    {
      id: 3,
      email: "colleagues@email.com",
      name: "Work Colleagues",
      status: "sent",
      rsvp: "maybe",
    },
  ]);

  const handleRemoveInvitation = (id: number) => {
    setInvitations(invitations.filter((inv) => inv.id !== id));
  };

  const handleResendInvitation = (id: number) => {
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
          <ManageInvitationsTab
            invitations={invitations}
            onRemoveInvitation={handleRemoveInvitation}
            onResendInvitation={handleResendInvitation}
            theme={theme}
            themeClasses={themeClasses}
            t={safeT}
          />
        </TabsContent>

        <TabsContent value="rsvp" className="space-y-6">
          <RSVPTab invitations={invitations} themeClasses={themeClasses} t={safeT} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Invitations;
