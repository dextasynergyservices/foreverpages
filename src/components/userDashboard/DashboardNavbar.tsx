// components/dashboard/SidebarNavigation.tsx
"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Heart,
  Images,
  FileText,
  Mail,
  MessageSquare,
  Settings,
  Users,
  BarChart3,
} from "lucide-react";
import { X } from "lucide-react";
import { LanguageSwitcherCompact } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "../ui/button";

interface DashboardNavbarProps {
  isOpen: boolean;
  onClose: () => void;
}

const DashboardNavbar = ({ isOpen, onClose }: DashboardNavbarProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSection = searchParams.get("section") || "analytics";
  const { t } = useTranslations();
  const { theme } = useTheme();

  // Use explicit black/white backgrounds and contrasting text per request
  const sidebarBgClass = theme === "dark" ? "bg-black text-white" : "bg-white text-black";

  const navigation = [
    { name: t("dashboard.sidebar.nav.analytics"), href: "analytics", icon: BarChart3 },
    { name: t("dashboard.sidebar.nav.gallery"), href: "gallery", icon: Images },
    { name: t("dashboard.sidebar.nav.builder"), href: "funeral-builder", icon: FileText },
    { name: t("dashboard.sidebar.nav.invitations"), href: "invitations", icon: Mail },
    { name: t("dashboard.sidebar.nav.tributes"), href: "tributes", icon: MessageSquare },
    { name: t("dashboard.sidebar.nav.settings"), href: "settings", icon: Settings },
  ];

  const handleNavigation = (href: string) => {
    router.push(`/user-dashboard?section=${href}`, { scroll: false });
    onClose();
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 w-64 ${sidebarBgClass} shadow-soft border-r border-border flex flex-col z-50
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        role="navigation"
        aria-label={t("dashboard.sidebar.navLabel") || "Dashboard navigation"}
      >
        {/* Brand Header (desktop) */}
        <div className="p-6 border-b border-border hidden lg:block">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-serif font-bold">{t("dashboard.sidebar.brand")}</h1>
          </div>
        </div>

        {/* Mobile header with close button */}
        <div className="p-4 border-b border-border lg:hidden flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-serif font-bold">{t("dashboard.sidebar.brand")}</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label={t("dashboard.sidebar.close") || "Close menu"}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors w-full text-left ${
                  activeSection === item.href
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}

          <div className="hidden lg:block p-4 space-y-2">
            {/* Expand click target: clicking anywhere in the bordered box will toggle the inner control */}
            <div
              className="p-3 rounded-lg border border-border bg-background cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={(e) => {
                // Delegate click to inner button (LanguageSwitcherCompact) if present
                const btn = (e.currentTarget as HTMLElement).querySelector("button");
                if (btn) btn.click();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  const btn = (e.currentTarget as HTMLElement).querySelector("button");
                  if (btn) btn.click();
                }
              }}
            >
              <LanguageSwitcherCompact />
            </div>

            <div
              className="p-3 rounded-lg border border-border bg-background cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={(e) => {
                const btn = (e.currentTarget as HTMLElement).querySelector("button");
                if (btn) btn.click();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  const btn = (e.currentTarget as HTMLElement).querySelector("button");
                  if (btn) btn.click();
                }
              }}
            >
              <ThemeToggle />
            </div>
          </div>
        </nav>

        {/* User Profile */}
        <div className="mt-auto p-4">
          <div className="bg-secondary rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium">Sarah Johnson</p>
                <p className="text-sm text-muted-foreground">Family Admin</p>
              </div>
            </div>
          </div>
        </div>

        {/* logout button */}
        <div className="p-4">
          <Button variant="memorial-outline" size="sm" className="w-full">
            Logout
          </Button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/40 lg:hidden z-40" onClick={onClose} />}
    </>
  );
};

export default DashboardNavbar;
