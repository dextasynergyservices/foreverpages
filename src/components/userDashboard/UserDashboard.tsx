"use client";

import React from "react";
import Analytics from "@/components/userDashboard/analystic/Analytics";
import Gallery from "@/components/userDashboard/gallery/Gallery";
import CreateMemorial from "@/components/userDashboard/pageBuilder/CreateMemorial";
import Invitations from "@/components/userDashboard/invitations/Invitations";
import Tributes from "@/components/userDashboard/Tribute";
import Settings from "@/components/userDashboard/Settings";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";

export interface DashboardProps {
  activeSection: string;
  onSectionChange?: (section: string) => void; // Made optional
}

export const Dashboard: React.FC<DashboardProps> = ({ activeSection }) => {
  const { theme } = useTheme();

  useTranslations();
  const renderSection = () => {
    switch (activeSection) {
      case "analytics":
        return <Analytics />;
      case "gallery":
        return <Gallery />;
      case "funeral-builder":
        return <CreateMemorial />;
      case "invitations":
        return <Invitations />;
      case "tributes":
        return <Tributes />;
      case "settings":
        return <Settings />;
      default:
        return <Analytics />;
    }
  };

  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      <div className="flex">
        {/* Main Content (sidebar is now rendered by DashboardLayout) */}
        <main className="flex-1 lg:ml-0">{renderSection()}</main>
      </div>
    </div>
  );
};

export default Dashboard;
