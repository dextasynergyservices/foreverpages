"use client";

import { useState, useEffect, useRef } from "react";
import DashboardNavbar from "@/components/userDashboard/DashboardNavbar";
import DashboardHeader from "@/components/userDashboard/DashboardHeader";
import { Heart, User, LogOut } from "lucide-react";
import { LanguageSwitcherCompact } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";
import { useSession } from "next-auth/react";
import { useLogout } from "@/hooks/useLogout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const { data: session } = useSession();
  const { logout } = useLogout();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileUserMenuOpen, setIsMobileUserMenuOpen] = useState(false);
  const mobileUserMenuRef = useRef<HTMLDivElement>(null);

  // Load collapse state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") {
      setIsCollapsed(true);
    }
  }, []);

  // Handle click outside mobile user menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileUserMenuRef.current && !mobileUserMenuRef.current.contains(event.target as Node)) {
        setIsMobileUserMenuOpen(false);
      }
    }

    if (isMobileUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileUserMenuOpen]);

  // Save collapse state to localStorage
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem("sidebar-collapsed", String(newValue));
      return newValue;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col">
      {/* Mobile Header */}
      <div
        className={`lg:hidden sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between ${
          theme === "dark" ? "bg-black text-white" : "bg-white text-black"
        }`}
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
          <NotificationBell variant="compact" />
          <LanguageSwitcherCompact />
          <ThemeToggle />

          {/* Mobile User Menu */}
          <div className="relative" ref={mobileUserMenuRef}>
            <button
              onClick={() => setIsMobileUserMenuOpen(!isMobileUserMenuOpen)}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
              aria-label="User menu"
            >
              <User className="h-4 w-4 text-primary" />
            </button>

            {isMobileUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-popover border border-border rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-border">
                  <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setIsMobileUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-accent transition-colors text-red-600 dark:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  {t("dashboard.sidebar.logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout with Sidebar and Header */}
      <div className="flex flex-1 overflow-hidden">
        <DashboardNavbar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isCollapsed}
        />

        {/* Main Content Area with Desktop Header */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop Header */}
          <DashboardHeader isCollapsed={isCollapsed} onToggleCollapse={toggleCollapse} />

          {/* Page Content */}
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
