"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textArea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@radix-ui/react-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  User,
  Shield,
  Globe,
  Trash2,
  Download,
  LogOut,
  AlertTriangle,
  Archive,
} from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";
import { useUser, useUserMemorials, useMemorialDetails } from "@/hooks/useQueries";
import { useLogout } from "@/hooks/useLogout";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/skeleton-loader";
import SecurityTab from "./SecurityTab";
import AccountDetailsTab from "./AccountDetailsTab";
import CollaboratorsTab from "./CollaboratorsTab";
import NotificationPreferencesSettings from "@/components/settings/NotificationPreferencesSettings";
import toastNotification from "@/lib/toastNotifications";

const SettingsContent = () => {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const { data: userData, isLoading, error } = useUser();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [adminEmails, setAdminEmails] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("VIEWER");
  const [personalMessage, setPersonalMessage] = useState("");
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(false);
  const [isSendingInvites, setIsSendingInvites] = useState(false);

  // Use TanStack Query for fetching user memorials
  const { data: memorialsData } = useUserMemorials();

  // Get the first owned memorial ID
  const userMemorialId = useMemo(() => {
    const ownedMemorials = memorialsData?.ownedMemorials || [];
    return ownedMemorials.length > 0 ? ownedMemorials[0].id : null;
  }, [memorialsData]);

  // Fetch memorial details using TanStack Query (only when we have a memorial ID)
  const { data: memorialDetails } = useMemorialDetails(userMemorialId);

  // Derive memorial slug and name from the query data
  const memorialSlug = useMemo(() => {
    if (memorialDetails?.slug) return memorialDetails.slug;
    if (userMemorialId) return userMemorialId;
    return "";
  }, [memorialDetails, userMemorialId]);

  const memorialName = useMemo(() => {
    if (memorialDetails?.firstName || memorialDetails?.lastName) {
      return `${memorialDetails.firstName || ""} ${memorialDetails.lastName || ""}`.trim();
    }
    const ownedMemorials = memorialsData?.ownedMemorials || [];
    if (ownedMemorials.length > 0) {
      return (
        ownedMemorials[0].name || t("dashboard.settings.advanced.danger.deleteDialog.memorialLabel")
      );
    }
    return t("dashboard.settings.advanced.danger.deleteDialog.memorialLabel");
  }, [memorialDetails, memorialsData, t]);

  // Set active tab from URL parameter on mount
  useEffect(() => {
    const tab = (searchParams?.get("tab") as string | null) || null;
    if (
      tab &&
      ["profile", "security", "collaborators", "privacy", "notifications", "advanced"].includes(tab)
    ) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleSaveProfile = () => {
    toastNotification.info("Profile settings save functionality coming soon");
  };

  const handleSavePrivacySettings = () => {
    toastNotification.info("Privacy settings save functionality coming soon");
  };

  // State for advanced tab
  const [isExporting, setIsExporting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteMemorialDialog, setShowDeleteMemorialDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deleteMemorialConfirmText, setDeleteMemorialConfirmText] = useState("");
  const [archiveConfirmText, setArchiveConfirmText] = useState("");
  const [deleteAccountConfirmText, setDeleteAccountConfirmText] = useState("");

  const handleExportData = async () => {
    if (!userMemorialId) {
      toastNotification.error("No memorial found to export");
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch(`/api/memorial/${userMemorialId}/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `memorial-data-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toastNotification.success("Memorial data exported successfully!");
      } else {
        // Fallback: export basic memorial info from the API we already have
        const memorialResponse = await fetch("/api/user/memorials");
        if (memorialResponse.ok) {
          const data = await memorialResponse.json();
          const ownedMemorials = data.ownedMemorials || [];
          const memorial = ownedMemorials.find((m: { id: string }) => m.id === userMemorialId);
          if (memorial) {
            const exportData = {
              exportedAt: new Date().toISOString(),
              memorial: memorial,
            };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
              type: "application/json",
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `memorial-data-${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toastNotification.success("Memorial data exported successfully!");
          }
        } else {
          toastNotification.error("Failed to export memorial data");
        }
      }
    } catch (error) {
      console.error("Export error:", error);
      toastNotification.error("Failed to export memorial data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleArchiveMemorial = async () => {
    if (!userMemorialId) {
      toastNotification.error(
        t("dashboard.settings.advanced.danger.archiveDialog.noMemorial") || "No memorial found"
      );
      return;
    }

    if (archiveConfirmText.toLowerCase() !== "archive") {
      toastNotification.error(
        t("dashboard.settings.advanced.danger.archiveDialog.confirmError") ||
          "Please type ARCHIVE to confirm"
      );
      return;
    }

    setIsArchiving(true);
    try {
      const response = await fetch(`/api/user/memorials/${userMemorialId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: false }),
      });

      if (response.ok) {
        toastNotification.success(
          t("dashboard.settings.advanced.danger.archiveDialog.success") ||
            "Memorial has been archived. It is no longer publicly visible."
        );
        setShowArchiveDialog(false);
        setArchiveConfirmText("");
      } else {
        const data = await response.json();
        toastNotification.error(
          data.message ||
            t("dashboard.settings.advanced.danger.archiveDialog.error") ||
            "Failed to archive memorial"
        );
      }
    } catch (error) {
      console.error("Archive error:", error);
      toastNotification.error(
        t("dashboard.settings.advanced.danger.archiveDialog.error") || "Failed to archive memorial"
      );
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDeleteMemorial = async () => {
    if (!userMemorialId) {
      toastNotification.error(
        t("dashboard.settings.advanced.danger.deleteDialog.noMemorial") || "No memorial found"
      );
      return;
    }

    if (deleteMemorialConfirmText !== memorialSlug) {
      toastNotification.error(
        t("dashboard.settings.advanced.danger.deleteDialog.confirmError", { slug: memorialSlug }) ||
          `Please type "${memorialSlug}" to confirm`
      );
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/user/memorials/${userMemorialId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toastNotification.success(
          t("dashboard.settings.advanced.danger.deleteDialog.success") ||
            "Memorial has been permanently deleted."
        );
        setShowDeleteMemorialDialog(false);
        setDeleteMemorialConfirmText("");
        // Redirect to dashboard
        window.location.href = "/user-dashboard";
      } else {
        const data = await response.json();
        toastNotification.error(
          data.message ||
            t("dashboard.settings.advanced.danger.deleteDialog.error") ||
            "Failed to delete memorial"
        );
      }
    } catch (error) {
      console.error("Delete error:", error);
      toastNotification.error(
        t("dashboard.settings.advanced.danger.deleteDialog.error") || "Failed to delete memorial"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const userName = userData?.user?.name || "";
    if (!userName) {
      toastNotification.error(
        t("dashboard.settings.advanced.danger.deleteAccountDialog.noAccount") ||
          "Unable to verify account"
      );
      return;
    }

    if (deleteAccountConfirmText !== userName) {
      toastNotification.error(
        t("dashboard.settings.advanced.danger.deleteAccountDialog.confirmError", {
          username: userName,
        }) || `Please type your username "${userName}" to confirm`
      );
      return;
    }

    setIsDeletingAccount(true);
    try {
      const response = await fetch("/api/user/account", {
        method: "DELETE",
      });

      if (response.ok) {
        toastNotification.success(
          t("dashboard.settings.advanced.danger.deleteAccountDialog.success") ||
            "Your account has been permanently deleted."
        );
        setShowDeleteAccountDialog(false);
        setDeleteAccountConfirmText("");
        // Sign out and redirect
        window.location.href = "/";
      } else {
        const data = await response.json();
        toastNotification.error(
          data.message ||
            t("dashboard.settings.advanced.danger.deleteAccountDialog.error") ||
            "Failed to delete account"
        );
      }
    } catch (error) {
      console.error("Delete account error:", error);
      toastNotification.error(
        t("dashboard.settings.advanced.danger.deleteAccountDialog.error") ||
          "Failed to delete account"
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const { logout: handleSignOut, isLoggingOut } = useLogout();

  const handleSendAdminInvitations = async () => {
    // Validate at least one contact method
    if (!adminEmails.trim() && !phoneNumbers.trim()) {
      toastNotification.error("Please enter at least one email address or phone number");
      return;
    }

    if (!userMemorialId) {
      toastNotification.error("Memorial not found. Please create a memorial first.");
      return;
    }

    setIsSendingInvites(true);

    // Parse email addresses (comma, semicolon, or newline separated)
    const emailList = adminEmails
      .split(/[,;\n]/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    // Parse phone numbers
    const phoneList = phoneNumbers
      .split(/[,;\n]/)
      .map((phone) => phone.trim())
      .filter((phone) => phone.length > 0);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailList.filter((email) => !emailRegex.test(email));

    if (invalidEmails.length > 0) {
      toastNotification.error(
        `Invalid email address${invalidEmails.length > 1 ? "es" : ""}: ${invalidEmails.join(", ")}`
      );
      setIsSendingInvites(false);
      return;
    }

    // Basic phone validation (must start with +)
    const phoneRegex = /^\+\d{10,15}$/;
    const invalidPhones = phoneList.filter((phone) => !phoneRegex.test(phone));

    if (invalidPhones.length > 0) {
      toastNotification.error(
        `Invalid phone number${invalidPhones.length > 1 ? "s" : ""}: ${invalidPhones.join(", ")}. Phone numbers must include country code (e.g., +234XXXXXXXXXX)`
      );
      setIsSendingInvites(false);
      return;
    }

    try {
      const invitations: Array<{
        email?: string;
        phone?: string;
      }> = [];

      // Combine emails and phones (emails take priority)
      const maxLength = Math.max(emailList.length, phoneList.length);
      for (let i = 0; i < maxLength; i++) {
        const invitation: { email?: string; phone?: string } = {};
        if (emailList[i]) invitation.email = emailList[i];
        if (phoneList[i]) invitation.phone = phoneList[i];
        if (invitation.email || invitation.phone) {
          invitations.push(invitation);
        }
      }

      // Send invitations
      const results = await Promise.allSettled(
        invitations.map(async (invitation) => {
          const response = await fetch("/api/invitations", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: invitation.email,
              phone: invitation.phone,
              role: selectedRole,
              memorialId: userMemorialId,
              sendViaEmail: !!invitation.email,
              sendViaWhatsApp: sendViaWhatsApp && !!invitation.phone,
              message: personalMessage || "You've been invited to help manage this memorial page.",
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to send invitation");
          }

          return response.json();
        })
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (successful > 0 && failed === 0) {
        toastNotification.success(
          `Successfully sent ${successful} invitation${successful > 1 ? "s" : ""}!`
        );
        // Clear form on success
        setAdminEmails("");
        setPhoneNumbers("");
        setPersonalMessage("");
      } else if (successful > 0 && failed > 0) {
        toastNotification.info(
          `Sent ${successful} invitation${successful > 1 ? "s" : ""}, but ${failed} failed. Please try again for the failed ones.`
        );
      } else {
        toastNotification.error("Failed to send invitations. Please try again.");
      }
    } catch (error) {
      console.error("Error sending invitations:", error);
      toastNotification.error("An error occurred while sending invitations. Please try again.");
    } finally {
      setIsSendingInvites(false);
    }
  };

  const cardBorder = theme === "dark" ? "border-white" : "border-black";
  const cardBg = theme === "dark" ? "bg-black" : "bg-white";
  const textMuted = theme === "dark" ? "text-white" : "text-black";
  const activeTabClasses =
    theme === "dark"
      ? "data-[state=active]:bg-white data-[state=active]:text-black"
      : "data-[state=active]:bg-black data-[state=active]:text-white";
  // Danger panel colors — tuned for light and dark mode for better contrast
  const dangerBg = theme === "dark" ? "bg-red-900/20" : "bg-red-50";
  const dangerBorder = theme === "dark" ? "border-red-600/40" : "border-red-200";
  const dangerTitle = theme === "dark" ? "text-red-300" : "text-red-700";

  if (isLoading) {
    return (
      <div
        className={`min-h-screen p-4 md:p-8 ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
      >
        <div className="mb-6 md:mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="w-full lg:max-w-4xl xl:max-w-5xl mx-auto">
          <Skeleton className="h-12 w-full mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <QueryErrorBoundary>
        <div
          className={`min-h-screen p-4 md:p-8 ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
        >
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-serif font-bold">
              {t("dashboard.settings.title")}
            </h1>
            <p className={`mt-2 ${textMuted}`}>{t("dashboard.settings.subtitle")}</p>
          </div>
          <div className="w-full lg:max-w-4xl xl:max-w-5xl mx-auto">
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {t("settings.error", {}, "Unable to load settings")}
              </p>
            </div>
          </div>
        </div>
      </QueryErrorBoundary>
    );
  }

  // API returns { message, user } directly (not wrapped in data)
  if (!userData?.user) {
    return (
      <div
        className={`min-h-screen p-4 md:p-8 ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
      >
        <div className="mb-6 md:mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="w-full lg:max-w-4xl xl:max-w-5xl mx-auto">
          <Skeleton className="h-12 w-full mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const user = userData.user;

  return (
    <div
      className={`min-h-screen p-4 md:p-8 ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-serif font-bold">
          {t("dashboard.settings.title")}
        </h1>
        <p className={`mt-2 ${textMuted}`}>{t("dashboard.settings.subtitle")}</p>
      </div>

      <div className="w-full lg:max-w-4xl xl:max-w-5xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 gap-2 md:grid-cols-7">
            <TabsTrigger
              value="profile"
              className={`px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
            >
              {t("dashboard.settings.tabs.profile")}
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className={`px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
            >
              Security
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className={`px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
            >
              {t("dashboard.settings.tabs.account", {}, "Account")}
            </TabsTrigger>
            <TabsTrigger
              value="collaborators"
              className={`px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
            >
              Collaborators
            </TabsTrigger>
            <TabsTrigger
              value="privacy"
              className={`px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
            >
              {t("dashboard.settings.tabs.privacy")}
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className={`px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
            >
              {t("dashboard.settings.tabs.notifications")}
            </TabsTrigger>
            <TabsTrigger
              value="advanced"
              className={`px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
            >
              {t("dashboard.settings.tabs.advanced")}
            </TabsTrigger>
          </TabsList>
          <div className="h-12 md:hidden" aria-hidden />

          <TabsContent value="profile" className="space-y-6">
            <Card className={`border ${cardBorder} ${cardBg}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t("dashboard.settings.profile.title")}
                </CardTitle>
                <CardDescription className={textMuted}>
                  {t("dashboard.settings.profile.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first-name">{t("dashboard.settings.profile.firstName")}</Label>
                    <Input id="first-name" defaultValue={user.name?.split(" ")[0] || ""} />
                  </div>
                  <div>
                    <Label htmlFor="last-name">{t("dashboard.settings.profile.lastName")}</Label>
                    <Input
                      id="last-name"
                      defaultValue={user.name?.split(" ").slice(1).join(" ") || ""}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">{t("dashboard.settings.profile.email")}</Label>
                  <Input id="email" type="email" defaultValue={user.email || ""} />
                </div>
                <div>
                  <Label htmlFor="phone">{t("dashboard.settings.profile.phone")}</Label>
                  <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
                </div>
                <div>
                  <Label htmlFor="relationship">
                    {t("dashboard.settings.profile.relationship")}
                  </Label>
                  <Select defaultValue="family">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="family">Other Family</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="colleague">Colleague</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="memorial"
                  className={`w-50 justify-center align-center ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
                  onClick={handleSaveProfile}
                >
                  {t("dashboard.settings.profile.save")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecurityTab />
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <AccountDetailsTab />
          </TabsContent>

          <TabsContent value="collaborators" className="space-y-6">
            <CollaboratorsTab
              memorialId={userMemorialId || ""}
              textMuted={textMuted}
              cardBorder={cardBorder}
              cardBg={cardBg}
              isOwner={true}
            />
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card className={`border ${cardBorder} ${cardBg}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t("dashboard.settings.privacy.title")}
                </CardTitle>
                <CardDescription className={textMuted}>
                  {t("dashboard.settings.privacy.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="memorial-visibility">
                    {t("dashboard.settings.privacy.visibility")}
                  </Label>
                  <Select defaultValue="public">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Anyone can view</SelectItem>
                      <SelectItem value="unlisted">Unlisted - Only with direct link</SelectItem>
                      <SelectItem value="private">Private - Invited users only</SelectItem>
                      <SelectItem value="family">Family Only - Approved family members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="search-engines">{t("dashboard.settings.privacy.indexing")}</Label>
                  <Select defaultValue="allow">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allow">Allow search engines to index</SelectItem>
                      <SelectItem value="block">Block search engine indexing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-3">
                    {t("dashboard.settings.privacy.access.title")}
                  </h4>
                  <div className="space-y-4">
                    {/* Role Selection */}
                    <div>
                      <Label htmlFor="invitation-role">
                        Role <span className="text-red-500">*</span>
                      </Label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger id="invitation-role">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">
                            <div className="flex flex-col items-start">
                              <span className="font-semibold">Admin</span>
                              <span className="text-xs text-gray-500">
                                Full control - manage settings, approve content, invite others
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="EDITOR">
                            <div className="flex flex-col items-start">
                              <span className="font-semibold">Editor</span>
                              <span className="text-xs text-gray-500">
                                Edit content, approve tributes, manage gallery
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="CONTRIBUTOR">
                            <div className="flex flex-col items-start">
                              <span className="font-semibold">Contributor</span>
                              <span className="text-xs text-gray-500">
                                Add photos, videos, and tributes
                              </span>
                            </div>
                          </SelectItem>
                          <SelectItem value="VIEWER">
                            <div className="flex flex-col items-start">
                              <span className="font-semibold">Viewer</span>
                              <span className="text-xs text-gray-500">
                                Read-only access to memorial content
                              </span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className={`text-xs mt-1 ${textMuted}`}>
                        Choose the level of access for invited collaborators
                      </p>
                    </div>

                    {/* Email Addresses */}
                    <div>
                      <Label htmlFor="admin-emails">
                        Email Addresses <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="admin-emails"
                        placeholder="Enter email addresses separated by commas or new lines"
                        rows={3}
                        value={adminEmails}
                        onChange={(e) => setAdminEmails(e.target.value)}
                      />
                      <p className={`text-xs mt-1 ${textMuted}`}>
                        Example: admin@example.com, manager@example.com
                      </p>
                    </div>

                    {/* WhatsApp Toggle */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="send-whatsapp"
                        checked={sendViaWhatsApp}
                        onCheckedChange={setSendViaWhatsApp}
                      />
                      <Label htmlFor="send-whatsapp" className="cursor-pointer">
                        Also send via WhatsApp
                      </Label>
                    </div>

                    {/* Phone Numbers (conditional) */}
                    {sendViaWhatsApp && (
                      <div>
                        <Label htmlFor="phone-numbers">Phone Numbers (with country code)</Label>
                        <Textarea
                          id="phone-numbers"
                          placeholder="Enter phone numbers with country code (e.g., +234XXXXXXXXXX)"
                          rows={2}
                          value={phoneNumbers}
                          onChange={(e) => setPhoneNumbers(e.target.value)}
                        />
                        <p className={`text-xs mt-1 ${textMuted}`}>
                          Example: +234XXXXXXXXXX, +1XXXXXXXXXX
                        </p>
                      </div>
                    )}

                    {/* Personal Message */}
                    <div>
                      <Label htmlFor="personal-message">Personal Message (Optional)</Label>
                      <Textarea
                        id="personal-message"
                        placeholder="Add a personal message to your invitation..."
                        rows={3}
                        value={personalMessage}
                        onChange={(e) => setPersonalMessage(e.target.value)}
                      />
                      <p className={`text-xs mt-1 ${textMuted}`}>
                        This message will be included in the invitation
                      </p>
                    </div>

                    {/* Send Button */}
                    <Button
                      variant={theme === "dark" ? "memorial-outline" : "outline"}
                      onClick={handleSendAdminInvitations}
                      disabled={isSendingInvites || !adminEmails.trim()}
                    >
                      {isSendingInvites
                        ? "Sending..."
                        : t("dashboard.settings.privacy.access.sendAdminInvites")}
                    </Button>
                  </div>
                </div>

                <Button
                  variant="memorial"
                  className={`w-50 justify-center align-center ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
                  onClick={handleSavePrivacySettings}
                >
                  {t("dashboard.settings.privacy.save")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            {/* User Notification Preferences - Connected to Backend */}
            <NotificationPreferencesSettings />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card className={`border ${cardBorder} ${cardBg}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {t("dashboard.settings.advanced.title")}
                </CardTitle>
                <CardDescription className={textMuted}>
                  {t("dashboard.settings.advanced.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">
                    {t("dashboard.settings.advanced.export.title")}
                  </h4>
                  <p className={`text-sm mb-4 ${textMuted}`}>
                    {t("dashboard.settings.advanced.export.description")}
                  </p>
                  <Button
                    variant={theme === "dark" ? "memorial-outline" : "outline"}
                    onClick={handleExportData}
                    disabled={isExporting || !userMemorialId}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? "Exporting..." : t("dashboard.settings.advanced.export.button")}
                  </Button>
                  {!userMemorialId && (
                    <p className={`text-xs mt-2 ${textMuted}`}>
                      Create a memorial first to export data
                    </p>
                  )}
                </div>

                <Separator />

                {/* Danger Zone */}
                <div>
                  <h4 className="font-semibold text-destructive mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {t("dashboard.settings.advanced.danger.title")}
                  </h4>
                  <div className="space-y-3">
                    {/* Archive Memorial */}
                    <div className={`p-4 border ${dangerBorder} rounded-lg ${dangerBg}`}>
                      <h5 className={`font-medium mb-2 ${dangerTitle} flex items-center gap-2`}>
                        <Archive className="h-4 w-4" />
                        {t("dashboard.settings.advanced.danger.archive")}
                      </h5>
                      <p className={`text-sm mb-3 ${textMuted}`}>
                        {t("dashboard.settings.advanced.danger.archiveDescription")}
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowArchiveDialog(true)}
                        disabled={!userMemorialId}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        {t("dashboard.settings.advanced.danger.archive")}
                      </Button>
                    </div>

                    {/* Delete Memorial */}
                    <div className={`p-4 border ${dangerBorder} rounded-lg ${dangerBg}`}>
                      <h5 className={`font-medium mb-2 ${dangerTitle} flex items-center gap-2`}>
                        <Trash2 className="h-4 w-4" />
                        {t("dashboard.settings.advanced.danger.delete")}
                      </h5>
                      <p className={`text-sm mb-3 ${textMuted}`}>
                        {t("dashboard.settings.advanced.danger.deleteDescription")}
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDeleteMemorialDialog(true)}
                        disabled={!userMemorialId}
                      >
                        {t("dashboard.settings.advanced.danger.delete")}
                      </Button>
                    </div>

                    {/* Delete Account */}
                    <div className={`p-4 border ${dangerBorder} rounded-lg ${dangerBg}`}>
                      <h5 className={`font-medium mb-2 ${dangerTitle} flex items-center gap-2`}>
                        <Trash2 className="h-4 w-4" />
                        {t("dashboard.settings.advanced.danger.deleteAccount")}
                      </h5>
                      <p className={`text-sm mb-3 ${textMuted}`}>
                        {t("dashboard.settings.advanced.danger.deleteAccountDescription")}
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDeleteAccountDialog(true)}
                      >
                        {t("dashboard.settings.advanced.danger.deleteAccount")}
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Account Section */}
                <div>
                  <h4 className="font-semibold mb-3">
                    {t("dashboard.settings.advanced.account.title")}
                  </h4>
                  <div
                    className={`p-4 border rounded-lg ${theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"}`}
                  >
                    <h5 className="font-medium mb-2">
                      {t("dashboard.settings.advanced.account.signOut")}
                    </h5>
                    <p className={`text-sm mb-3 ${textMuted}`}>
                      Sign out of your ForeverPages account
                    </p>
                    <Button
                      variant={theme === "dark" ? "memorial-ghost" : "outline"}
                      className={theme === "dark" ? "hover:bg-white/10" : "hover:bg-gray-100"}
                      onClick={handleSignOut}
                      disabled={isLoggingOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {isLoggingOut
                        ? "Signing out..."
                        : t("dashboard.settings.advanced.account.signOut")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Archive Memorial Dialog */}
            <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
              <DialogContent
                className={theme === "dark" ? "bg-gray-900 border-white/10" : "bg-white"}
              >
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-amber-600">
                    <Archive className="h-5 w-5" />
                    {t("dashboard.settings.advanced.danger.archiveDialog.title")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("dashboard.settings.advanced.danger.archiveDialog.description")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-lg ${theme === "dark" ? "bg-amber-900/20 border border-amber-500/30" : "bg-amber-50 border border-amber-200"}`}
                  >
                    <h4 className="font-medium text-amber-700 dark:text-amber-400 mb-2">
                      {t("dashboard.settings.advanced.danger.archiveDialog.warningTitle")}
                    </h4>
                    <ul className="text-sm text-amber-600 dark:text-amber-300 space-y-1 list-disc list-inside">
                      <li>{t("dashboard.settings.advanced.danger.archiveDialog.warning1")}</li>
                      <li>{t("dashboard.settings.advanced.danger.archiveDialog.warning2")}</li>
                      <li>{t("dashboard.settings.advanced.danger.archiveDialog.warning3")}</li>
                    </ul>
                  </div>

                  {memorialName && (
                    <div
                      className={`p-3 rounded-lg ${theme === "dark" ? "bg-white/5" : "bg-gray-50"}`}
                    >
                      <p className={`text-sm ${textMuted}`}>
                        {t("dashboard.settings.advanced.danger.archiveDialog.memorialLabel")}
                      </p>
                      <p className="font-medium">{memorialName}</p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="archive-confirm" className="text-sm">
                      {t("dashboard.settings.advanced.danger.archiveDialog.confirmLabel", {
                        word: "",
                      })}{" "}
                      <span className="font-bold text-amber-600">
                        {t("dashboard.settings.advanced.danger.archiveDialog.confirmWord")}
                      </span>
                    </Label>
                    <Input
                      id="archive-confirm"
                      value={archiveConfirmText}
                      onChange={(e) => setArchiveConfirmText(e.target.value)}
                      placeholder={t(
                        "dashboard.settings.advanced.danger.archiveDialog.confirmPlaceholder"
                      )}
                      className="mt-2"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowArchiveDialog(false);
                      setArchiveConfirmText("");
                    }}
                  >
                    {t("dashboard.settings.advanced.danger.archiveDialog.cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleArchiveMemorial}
                    disabled={isArchiving || archiveConfirmText.toLowerCase() !== "archive"}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {isArchiving ? (
                      <>
                        <Spinner className="h-4 w-4 mr-2 animate-spin" />
                        {t("dashboard.settings.advanced.danger.archiveDialog.archiving")}
                      </>
                    ) : (
                      t("dashboard.settings.advanced.danger.archiveDialog.confirm")
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Memorial Dialog */}
            <Dialog open={showDeleteMemorialDialog} onOpenChange={setShowDeleteMemorialDialog}>
              <DialogContent
                className={theme === "dark" ? "bg-gray-900 border-white/10" : "bg-white"}
              >
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    {t("dashboard.settings.advanced.danger.deleteDialog.title")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("dashboard.settings.advanced.danger.deleteDialog.description")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-lg ${theme === "dark" ? "bg-red-900/20 border border-red-500/30" : "bg-red-50 border border-red-200"}`}
                  >
                    <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">
                      {t("dashboard.settings.advanced.danger.deleteDialog.warningTitle")}
                    </h4>
                    <ul className="text-sm text-red-600 dark:text-red-300 space-y-1 list-disc list-inside">
                      <li>{t("dashboard.settings.advanced.danger.deleteDialog.warning1")}</li>
                      <li>{t("dashboard.settings.advanced.danger.deleteDialog.warning2")}</li>
                      <li>{t("dashboard.settings.advanced.danger.deleteDialog.warning3")}</li>
                      <li>{t("dashboard.settings.advanced.danger.deleteDialog.warning4")}</li>
                      <li>{t("dashboard.settings.advanced.danger.deleteDialog.warning5")}</li>
                    </ul>
                  </div>

                  {memorialName && (
                    <div
                      className={`p-3 rounded-lg ${theme === "dark" ? "bg-white/5" : "bg-gray-50"}`}
                    >
                      <p className={`text-sm ${textMuted}`}>
                        {t("dashboard.settings.advanced.danger.deleteDialog.memorialLabel")}
                      </p>
                      <p className="font-medium">{memorialName}</p>
                      <p className={`text-sm ${textMuted}`}>
                        {t("dashboard.settings.advanced.danger.deleteDialog.slugLabel")}{" "}
                        <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
                          {memorialSlug}
                        </code>
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="delete-memorial-confirm" className="text-sm">
                      {t("dashboard.settings.advanced.danger.deleteDialog.confirmLabel", {
                        slug: "",
                      })}{" "}
                      <span className="font-bold text-destructive">{memorialSlug}</span>
                    </Label>
                    <Input
                      id="delete-memorial-confirm"
                      value={deleteMemorialConfirmText}
                      onChange={(e) => setDeleteMemorialConfirmText(e.target.value)}
                      placeholder={t(
                        "dashboard.settings.advanced.danger.deleteDialog.confirmPlaceholder",
                        { slug: memorialSlug }
                      )}
                      className="mt-2"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteMemorialDialog(false);
                      setDeleteMemorialConfirmText("");
                    }}
                  >
                    {t("dashboard.settings.advanced.danger.deleteDialog.cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteMemorial}
                    disabled={isDeleting || deleteMemorialConfirmText !== memorialSlug}
                  >
                    {isDeleting ? (
                      <>
                        <Spinner className="h-4 w-4 mr-2 animate-spin" />
                        {t("dashboard.settings.advanced.danger.deleteDialog.deleting")}
                      </>
                    ) : (
                      t("dashboard.settings.advanced.danger.deleteDialog.confirm")
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Account Dialog */}
            <Dialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
              <DialogContent
                className={theme === "dark" ? "bg-gray-900 border-white/10" : "bg-white"}
              >
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    {t("dashboard.settings.advanced.danger.deleteAccountDialog.title")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("dashboard.settings.advanced.danger.deleteAccountDialog.description")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-lg ${theme === "dark" ? "bg-red-900/20 border border-red-500/30" : "bg-red-50 border border-red-200"}`}
                  >
                    <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">
                      {t("dashboard.settings.advanced.danger.deleteAccountDialog.warningTitle")}
                    </h4>
                    <ul className="text-sm text-red-600 dark:text-red-300 space-y-1 list-disc list-inside">
                      <li>
                        {t("dashboard.settings.advanced.danger.deleteAccountDialog.warning1")}
                      </li>
                      <li>
                        {t("dashboard.settings.advanced.danger.deleteAccountDialog.warning2")}
                      </li>
                      <li>
                        {t("dashboard.settings.advanced.danger.deleteAccountDialog.warning3")}
                      </li>
                      <li>
                        {t("dashboard.settings.advanced.danger.deleteAccountDialog.warning4")}
                      </li>
                      <li>
                        {t("dashboard.settings.advanced.danger.deleteAccountDialog.warning5")}
                      </li>
                    </ul>
                  </div>

                  {userData?.user?.name && (
                    <div
                      className={`p-3 rounded-lg ${theme === "dark" ? "bg-white/5" : "bg-gray-50"}`}
                    >
                      <p className={`text-sm ${textMuted}`}>
                        {t("dashboard.settings.advanced.danger.deleteAccountDialog.accountLabel")}
                      </p>
                      <p className="font-medium">{userData.user.name}</p>
                      <p className={`text-sm ${textMuted}`}>{userData.user.email}</p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="delete-account-confirm" className="text-sm">
                      {t("dashboard.settings.advanced.danger.deleteAccountDialog.confirmLabel", {
                        username: "",
                      })}{" "}
                      <span className="font-bold text-destructive">{userData?.user?.name}</span>
                    </Label>
                    <Input
                      id="delete-account-confirm"
                      value={deleteAccountConfirmText}
                      onChange={(e) => setDeleteAccountConfirmText(e.target.value)}
                      placeholder={t(
                        "dashboard.settings.advanced.danger.deleteAccountDialog.confirmPlaceholder",
                        { username: userData?.user?.name || "" }
                      )}
                      className="mt-2"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteAccountDialog(false);
                      setDeleteAccountConfirmText("");
                    }}
                  >
                    {t("dashboard.settings.advanced.danger.deleteAccountDialog.cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={
                      isDeletingAccount || deleteAccountConfirmText !== userData?.user?.name
                    }
                  >
                    {isDeletingAccount ? (
                      <>
                        <Spinner className="h-4 w-4 mr-2 animate-spin" />
                        {t("dashboard.settings.advanced.danger.deleteAccountDialog.deleting")}
                      </>
                    ) : (
                      t("dashboard.settings.advanced.danger.deleteAccountDialog.confirm")
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsContent;
