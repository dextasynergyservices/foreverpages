"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut, User } from "lucide-react";
import { LanguageSwitcherCompact } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";
import { useSession } from "next-auth/react";
import { useLogout } from "@/hooks/useLogout";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function DashboardHeader({ isCollapsed, onToggleCollapse }: DashboardHeaderProps) {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const { data: session } = useSession();
  const { logout, isLoggingOut } = useLogout();
  const searchParams = useSearchParams();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeSection = searchParams.get("section") || "analytics";

  // Get page title based on active section
  const getPageTitle = () => {
    const titles: Record<string, string> = {
      analytics: t("dashboard.sidebar.nav.analytics"),
      gallery: t("dashboard.sidebar.nav.gallery"),
      "funeral-builder": t("dashboard.sidebar.nav.builder"),
      invitations: t("dashboard.sidebar.nav.invitations"),
      tributes: t("dashboard.sidebar.nav.tributes"),
      settings: t("dashboard.sidebar.nav.settings"),
    };
    return titles[activeSection] || "Dashboard";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  const sidebarBgClass = theme === "dark" ? "bg-black text-white" : "bg-white text-black";

  return (
    <header
      className={`hidden lg:flex items-center justify-between px-6 py-4 border-b border-border ${sidebarBgClass} sticky top-0 z-30`}
    >
      {/* Left: Collapse button and page title */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-9 w-9 p-0"
          aria-label={isCollapsed ? t("dashboard.sidebar.expand") : t("dashboard.sidebar.collapse")}
          title={isCollapsed ? t("dashboard.sidebar.expand") : t("dashboard.sidebar.collapse")}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{getPageTitle()}</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <NotificationBell />

        {/* Language Switcher */}
        <div className="border-l border-border pl-3">
          <LanguageSwitcherCompact />
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Profile Dropdown */}
        <div className="relative border-l border-border pl-3" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 hover:bg-secondary rounded-lg px-3 py-2 transition-colors"
            aria-label="User menu"
          >
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="text-left hidden xl:block">
              <p className="font-medium text-sm text-foreground truncate max-w-[150px]">
                {session?.user?.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                {session?.user?.email || "user@email.com"}
              </p>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-popover border border-border rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-border">
                <p className="font-medium text-sm text-foreground truncate">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session?.user?.email || "user@email.com"}
                </p>
              </div>
              <div className="p-2">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>
                    {isLoggingOut ? t("login.loggingOut") : t("dashboard.sidebar.logout")}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
