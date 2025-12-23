"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Heart,
  Images,
  FileText,
  Mail,
  MessageSquare,
  Settings,
  BarChart3,
  Video,
  X,
  // Palette,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { useTranslations } from "@/hooks/useTranslations";
import { useCollaboratorTranslations } from "@/lib/utils/collaborator-translations";
import { useTheme } from "@/hooks/useTheme";
import { getAllowedDashboardSections } from "@/hooks/useMemorialAccess";
import { MemorialRole } from "@/generated/prisma";

interface DashboardNavbarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
}

// Inner component that uses useSearchParams
function DashboardNavbarContent({ isOpen, onClose, isCollapsed }: DashboardNavbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSection = searchParams?.get("section") || "analytics";
  const memorialId = searchParams?.get("memorial"); // Get memorial context
  const { t } = useTranslations();
  const ct = useCollaboratorTranslations();
  const { theme } = useTheme();
  const [userRole, setUserRole] = useState<MemorialRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user's role for the memorial
  useEffect(() => {
    async function fetchUserRole() {
      if (!memorialId) {
        // Check if user is a collaborator without memorial context
        try {
          const memorialsResponse = await fetch("/api/user/memorials");
          if (memorialsResponse.ok) {
            const memorialsData = await memorialsResponse.json();
            const ownedMemorials = memorialsData.ownedMemorials || [];
            const collaboratorMemorials = memorialsData.collaboratorMemorials || [];

            console.log("🔍 DashboardNavbar - Memorials check:", {
              ownedCount: ownedMemorials.length,
              collaboratorCount: collaboratorMemorials.length,
              collaboratorRoles: collaboratorMemorials.map((m: { role: string }) => m.role),
            });

            // If user has NO owned memorials but HAS collaborator access
            if (ownedMemorials.length === 0 && collaboratorMemorials.length > 0) {
              // Set role from first collaborator memorial
              const role = collaboratorMemorials[0].role as MemorialRole;
              console.log("✅ Setting collaborator role:", role);
              setUserRole(role);
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error("Failed to fetch memorials:", error);
        }

        // Default to OWNER if they have owned memorials or on error
        console.log("ℹ️ Defaulting to OWNER role");
        setUserRole("OWNER");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/memorials/${memorialId}/access`);
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.data.role);
        } else {
          setUserRole("OWNER"); // Fallback
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
        setUserRole("OWNER"); // Fallback
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [memorialId]);

  // Use explicit black/white backgrounds and contrasting text per request
  const sidebarBgClass = theme === "dark" ? "bg-black text-white" : "bg-white text-black";

  const allNavigation = [
    { name: t("dashboard.sidebar.nav.analytics"), href: "analytics", icon: BarChart3 },
    { name: t("dashboard.sidebar.nav.gallery"), href: "gallery", icon: Images },
    // { name: t("dashboard.sidebar.nav.templates"), href: "templates", icon: Palette },
    { name: t("dashboard.sidebar.nav.builder"), href: "funeral-builder", icon: FileText },
    { name: t("dashboard.sidebar.nav.invitations"), href: "invitations", icon: Mail },
    { name: t("dashboard.sidebar.nav.tributes"), href: "tributes", icon: MessageSquare },
    { name: t("dashboard.sidebar.nav.support"), href: "support", icon: Heart },
    { name: "Livestreams", href: "livestreams", icon: Video },
    { name: t("dashboard.sidebar.nav.settings"), href: "settings", icon: Settings },
  ];

  // Filter navigation based on user role
  const allowedSections = getAllowedDashboardSections(userRole);
  const navigation = allNavigation.filter((item) => allowedSections.includes(item.href));

  const restrictionNotice = ct.getRoleRestrictionNotice(userRole);

  const handleNavigation = (href: string) => {
    router.push(`/user-dashboard?section=${href}`, { scroll: false });
    onClose();
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 ${
          isCollapsed ? "lg:w-20" : "w-64"
        } ${sidebarBgClass} shadow-soft border-r border-border flex flex-col z-50
          transform transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        role="navigation"
        aria-label={t("dashboard.sidebar.navLabel") || "Dashboard navigation"}
      >
        {/* Brand Header (desktop) */}
        <div className="p-6 border-b border-border hidden lg:flex items-center justify-center">
          {!isCollapsed ? (
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-serif font-bold">{t("dashboard.sidebar.brand")}</h1>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <Heart className="h-8 w-8 text-primary" />
            </div>
          )}
        </div>

        {/* Mobile header with close button */}
        <div className="p-4 border-b border-border lg:hidden flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-serif font-bold">{t("dashboard.sidebar.brand")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell variant="compact" />
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label={t("dashboard.sidebar.close") || "Close menu"}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : (
            navigation.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.name} className="relative group">
                  <button
                    onClick={() => handleNavigation(item.href)}
                    className={`flex items-center ${
                      isCollapsed ? "justify-center" : "space-x-3"
                    } px-4 py-3 rounded-lg transition-colors w-full text-left ${
                      activeSection === item.href
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span className="font-medium">{item.name}</span>}
                  </button>
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="hidden lg:group-hover:block absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-md shadow-lg border border-border whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </nav>

        {/* Role Restrictions Notice */}
        {!isCollapsed && restrictionNotice && (
          <div className="p-4 border-t border-border">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300">{restrictionNotice}</p>
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/40 lg:hidden z-40" onClick={onClose} />}
    </>
  );
}

// Main component with Suspense
const DashboardNavbar = ({ isOpen, onClose, isCollapsed }: DashboardNavbarProps) => {
  const { theme } = useTheme();
  const sidebarBgClass = theme === "dark" ? "bg-black text-white" : "bg-white text-black";

  return (
    <Suspense
      fallback={
        <div
          className={`fixed lg:static inset-y-0 left-0 ${
            isCollapsed ? "lg:w-20" : "w-64"
          } ${sidebarBgClass} shadow-soft border-r border-border flex flex-col z-50 transform transition-all duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <div className="p-6 border-b border-border">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-serif font-bold">Loading...</h1>
            </div>
          </div>
        </div>
      }
    >
      <DashboardNavbarContent isOpen={isOpen} onClose={onClose} isCollapsed={isCollapsed} />
    </Suspense>
  );
};

export default DashboardNavbar;
