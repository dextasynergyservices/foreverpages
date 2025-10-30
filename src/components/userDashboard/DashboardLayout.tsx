"use client";

import React from "react";
import { Heart } from "lucide-react";
import { LanguageSwitcherCompact } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslations } from "@/hooks/useTranslations";
import DashboardNavbar from "./DashboardNavbar";
import { useTheme } from "@/hooks/useTheme";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { t } = useTranslations();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col lg:flex-row">
      <div
        className={`lg:hidden sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
      >
        <button
          aria-label="Open menu"
          onClick={() => setIsSidebarOpen(true)}
          className="text-foreground"
        >
          <span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 6h18M3 12h18M3 18h18"
              />
            </svg>
          </span>
        </button>
        <div className="flex items-center space-x-2">
          <Heart className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-serif font-bold text-foreground">
            {t("dashboard.sidebar.brand")}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcherCompact />
          <ThemeToggle />
        </div>
      </div>

      <DashboardNavbar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
};

export default DashboardLayout;
