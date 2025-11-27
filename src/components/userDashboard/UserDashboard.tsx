"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Analytics from "@/components/userDashboard/analystic/Analytics";
import Gallery from "@/components/userDashboard/gallery/Gallery";
import CreateMemorial from "@/components/userDashboard/pageBuilder/CreateMemorial";
import Invitations from "@/components/userDashboard/invitations/Invitations";
import Tributes from "@/components/userDashboard/Tribute";
import Livestreams from "@/components/userDashboard/livestreams/Livestreams";
import Settings from "@/components/userDashboard/Settings";
import TemplatesTab from "@/components/userDashboard/templates/TemplatesTab";
import EmailVerificationBanner from "@/components/userDashboard/EmailVerificationBanner";
import TwoFactorBanner from "@/components/userDashboard/TwoFactorBanner";
import { useTranslations } from "@/hooks/useTranslations";
import { useCollaboratorTranslations } from "@/lib/utils/collaborator-translations";
import { useTheme } from "@/hooks/useTheme";
import { canAccessDashboardSection, getRoleWelcomeMessage } from "@/hooks/useMemorialAccess";
import { MemorialRole } from "@/generated/prisma";
import { AlertCircle } from "lucide-react";

export interface DashboardProps {
  activeSection: string;
  onSectionChange?: (section: string) => void; // Made optional
}

export const Dashboard: React.FC<DashboardProps> = ({ activeSection }) => {
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  const memorialId = searchParams?.get("memorial");
  const [userRole, setUserRole] = useState<MemorialRole | null>(null);
  const [memorialName, setMemorialName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(true);
  const [isRevokedCollaborator, setIsRevokedCollaborator] = useState(false);

  const { t } = useTranslations();
  const ct = useCollaboratorTranslations();

  // Fetch user's role for the memorial context
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

            console.log("🔍 UserDashboard - Memorials check:", {
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
              setMemorialName(collaboratorMemorials[0].name);
              setLoading(false);
              return;
            }

            // If user has NO memorials at all (owned + collaborator), check subscription
            if (ownedMemorials.length === 0 && collaboratorMemorials.length === 0) {
              console.log("⚠️ No memorials found - checking subscription status");

              // Check if user has active subscription
              const subscriptionResponse = await fetch("/api/user/subscription");
              console.log("📡 Subscription check - Response status:", subscriptionResponse.status);

              if (subscriptionResponse.ok) {
                const subscriptionData = await subscriptionResponse.json();
                console.log("📊 Subscription data:", {
                  hasActiveSubscription: subscriptionData.data?.hasActiveSubscription,
                  status: subscriptionData.data?.status,
                  isCollaborator: subscriptionData.data?.isCollaborator,
                  fullData: subscriptionData,
                });

                // Check if user has active subscription (either their own or as collaborator)
                if (subscriptionData.data?.hasActiveSubscription) {
                  console.log("✅ User has active subscription - allowing dashboard access");
                  setHasActiveSubscription(true);
                  setUserRole("OWNER"); // Set OWNER role so they can create memorials
                  setLoading(false);
                  return;
                } else {
                  // User has no active subscription
                  console.log("❌ No active subscription found");
                  setHasActiveSubscription(false);
                }
              } else {
                console.error("❌ Subscription fetch failed:", await subscriptionResponse.text());
                setHasActiveSubscription(false);
              }

              // Check for revoked/expired collaborator invitations
              const invitationsResponse = await fetch("/api/invitations");
              let hasRevokedInvitations = false;

              if (invitationsResponse.ok) {
                const invitationsData = await invitationsResponse.json();
                // Check if user has any expired or revoked invitations
                hasRevokedInvitations = invitationsData.invitations?.some(
                  (inv: { status: string }) => inv.status === "REVOKED" || inv.status === "EXPIRED"
                );
              }

              setIsRevokedCollaborator(hasRevokedInvitations);
              setUserRole("OWNER"); // Set OWNER so they can see dashboard tabs
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
          setMemorialName(data.data.memorialName);
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

  const renderSection = () => {
    // SCENARIO 1: User has NO active subscription (not related to memorial roles)
    // This shows for: Google OAuth users without subscription OR revoked collaborators without subscription
    if (!loading && !hasActiveSubscription) {
      const sectionKey = isRevokedCollaborator ? "accessRevoked" : "noSubscription";
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
            <AlertCircle className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-4">
              {t(`dashboard.${sectionKey}.title`)}
            </h2>
            <p className="text-blue-700 dark:text-blue-300 mb-6 text-lg">
              {t(`dashboard.${sectionKey}.message`)}
            </p>
            <p className="text-blue-600 dark:text-blue-400 mb-8">
              {t(`dashboard.${sectionKey}.description`)}
            </p>
            <Link
              href="/packages"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              {t(`dashboard.${sectionKey}.button`)}
            </Link>
          </div>
        </div>
      );
    }

    // SCENARIO 2: User HAS subscription but their memorial ROLE doesn't allow access to this specific section
    // This shows for: Collaborators (VIEWER, CONTRIBUTOR) trying to access restricted sections
    // Example: VIEWER trying to access Analytics (only ADMIN/EDITOR/OWNER can view)
    if (!loading && !canAccessDashboardSection(userRole, activeSection)) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              {t("collaborators.roleRestriction.title")}
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              {t("collaborators.roleRestriction.description", {
                role: userRole ? ct.getRoleName(userRole) : "",
              })}
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              {t("collaborators.roleRestriction.contactOwner")}
            </p>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case "analytics":
        return <Analytics />;
      case "gallery":
        return <Gallery />;
      case "templates":
        return <TemplatesTab />;
      case "funeral-builder":
        return <CreateMemorial />;
      case "invitations":
        return <Invitations />;
      case "tributes":
        return <Tributes />;
      case "livestreams":
        return <Livestreams />;
      case "settings":
        return <Settings />;
      default:
        return <Analytics />;
    }
  };

  const welcomeMessage = getRoleWelcomeMessage(userRole, memorialName);

  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      <div className="flex">
        {/* Main Content (sidebar is now rendered by DashboardLayout) */}
        <main className="flex-1 lg:ml-0">
          {/* Notification Banners */}
          <div className="p-4 lg:p-6">
            <EmailVerificationBanner />
            <TwoFactorBanner />

            {/* Role-based Welcome Message */}
            {!loading && memorialId && userRole !== "OWNER" && (
              <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-semibold">{welcomeMessage}</span> -{" "}
                  <span className="capitalize">{userRole}</span> access
                </p>
              </div>
            )}
          </div>

          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
