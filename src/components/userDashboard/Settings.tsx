"use client";

import React, { useState, useEffect } from "react";
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
import { User, Bell, Shield, Globe, Trash2, Download, LogOut } from "lucide-react";
import { useTranslations } from "@/hooks/useTranslations";
import { useTheme } from "@/hooks/useTheme";
import { useUser } from "@/hooks/useQueries";
import { useLogout } from "@/hooks/useLogout";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import SecurityTab from "./SecurityTab";
import CollaboratorsTab from "./CollaboratorsTab";
import toastNotification from "@/lib/toastNotifications";

const SettingsContent = () => {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const { data: userData, isLoading, error } = useUser();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [publicMemorial, setPublicMemorial] = useState(true);
  const [allowTributes, setAllowTributes] = useState(true);
  const [moderateTributes, setModerateTributes] = useState(true);
  const [adminEmails, setAdminEmails] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("VIEWER");
  const [personalMessage, setPersonalMessage] = useState("");
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(false);
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const [userMemorialId, setUserMemorialId] = useState<string | null>(null);

  // Fetch user's memorial ID on mount
  useEffect(() => {
    const fetchUserMemorial = async () => {
      try {
        const response = await fetch("/api/memorials");
        if (response.ok) {
          const data = await response.json();
          if (data.data?.memorials && data.data.memorials.length > 0) {
            // Get the first memorial (user's primary memorial)
            setUserMemorialId(data.data.memorials[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user memorial:", error);
      }
    };
    fetchUserMemorial();
  }, []);

  // Set active tab from URL parameter on mount
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab &&
      [
        "profile",
        "security",
        "memorial",
        "collaborators",
        "privacy",
        "notifications",
        "advanced",
      ].includes(tab)
    ) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleSaveProfile = () => {
    toastNotification.info("Profile settings save functionality coming soon");
  };

  const handleSaveMemorialSettings = () => {
    toastNotification.info("Memorial settings save functionality coming soon");
  };

  const handleSavePrivacySettings = () => {
    toastNotification.info("Privacy settings save functionality coming soon");
  };

  const handleSaveNotificationSettings = () => {
    toastNotification.info("Notification settings save functionality coming soon");
  };

  const handleExportData = () => {
    toastNotification.info("Data export functionality coming soon");
  };

  const handleConnectDomain = () => {
    toastNotification.info("Custom domain connection functionality coming soon");
  };

  const handleArchiveMemorial = () => {
    toastNotification.info("Memorial archive functionality coming soon");
  };

  const handleDeleteMemorial = () => {
    toastNotification.info("Memorial deletion functionality coming soon");
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
              value="memorial"
              className={`px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
            >
              {t("dashboard.settings.tabs.memorial")}
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

          <TabsContent value="memorial" className="space-y-6">
            <Card className={`border ${cardBorder} ${cardBg}`}>
              <CardHeader>
                <CardTitle>{t("dashboard.settings.memorial.title")}</CardTitle>
                <CardDescription className={textMuted}>
                  {t("dashboard.settings.memorial.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="memorial-title">
                    {t("dashboard.settings.memorial.pageTitle")}
                  </Label>
                  <Input id="memorial-title" defaultValue="In Loving Memory of Sarah Johnson" />
                </div>

                <div>
                  <Label htmlFor="memorial-url">{t("dashboard.settings.memorial.customUrl")}</Label>
                  <div className="flex">
                    <span
                      className={`inline-flex items-center px-3 rounded-l-md border border-r-0 text-sm ${theme === "dark" ? "border-white/20 bg-white/10 text-white/70" : "border-gray-200 bg-gray-100 text-gray-600"}`}
                    >
                      foreverpages.online/
                    </span>
                    <Input
                      id="memorial-url"
                      className="rounded-l-none"
                      placeholder="sarah-johnson-memorial"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="memorial-theme">{t("dashboard.settings.memorial.theme")}</Label>
                  <Select defaultValue="classic">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">Classic Memorial</SelectItem>
                      <SelectItem value="modern">Modern Tribute</SelectItem>
                      <SelectItem value="garden">Garden of Memories</SelectItem>
                      <SelectItem value="celebration">Celebration of Life</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="public-memorial">
                        {t("dashboard.settings.memorial.publicMemorial.label")}
                      </Label>
                      <p className={`text-sm ${textMuted}`}>
                        {t("dashboard.settings.memorial.publicMemorial.description")}
                      </p>
                    </div>
                    <Switch
                      id="public-memorial"
                      checked={publicMemorial}
                      onCheckedChange={setPublicMemorial}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-tributes">
                        {t("dashboard.settings.memorial.allowTributes.label")}
                      </Label>
                      <p className={`text-sm ${textMuted}`}>
                        {t("dashboard.settings.memorial.allowTributes.description")}
                      </p>
                    </div>
                    <Switch
                      id="allow-tributes"
                      checked={allowTributes}
                      onCheckedChange={setAllowTributes}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="moderate-tributes">
                        {t("dashboard.settings.memorial.moderateTributes.label")}
                      </Label>
                      <p className={`text-sm ${textMuted}`}>
                        {t("dashboard.settings.memorial.moderateTributes.description")}
                      </p>
                    </div>
                    <Switch
                      id="moderate-tributes"
                      checked={moderateTributes}
                      onCheckedChange={setModerateTributes}
                    />
                  </div>
                </div>

                <Button
                  variant="memorial"
                  className={`w-50 justify-center align-center ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
                  onClick={handleSaveMemorialSettings}
                >
                  {t("dashboard.settings.memorial.save")}
                </Button>
              </CardContent>
            </Card>
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
            <Card className={`border ${cardBorder} ${cardBg}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  {t("dashboard.settings.notifications.title")}
                </CardTitle>
                <CardDescription className={textMuted}>
                  {t("dashboard.settings.notifications.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="divide-y rounded-md overflow-hidden border" role="list">
                  <div
                    className={`flex items-center justify-between p-4 ${theme === "dark" ? "bg-white/3 hover:bg-white/5" : "bg-white hover:bg-gray-50"}`}
                    role="listitem"
                  >
                    <div>
                      <h4 className="font-medium">
                        {t("dashboard.settings.notifications.email.label")}
                      </h4>
                      <p className={`text-sm ${textMuted}`}>
                        {t("dashboard.settings.notifications.email.description")}
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <div
                    className={`flex items-center justify-between p-4 ${theme === "dark" ? "bg-transparent hover:bg-white/5" : "bg-white hover:bg-gray-50"}`}
                    role="listitem"
                  >
                    <div>
                      <h4 className="font-medium">
                        {t("dashboard.settings.notifications.types.newTributes")}
                      </h4>
                      <p className={`text-sm ${textMuted}`}>
                        When someone leaves a tribute message
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div
                    className={`flex items-center justify-between p-4 ${theme === "dark" ? "bg-transparent hover:bg-white/5" : "bg-white hover:bg-gray-50"}`}
                    role="listitem"
                  >
                    <div>
                      <h4 className="font-medium">
                        {t("dashboard.settings.notifications.types.photoUploads")}
                      </h4>
                      <p className={`text-sm ${textMuted}`}>
                        When new photos are added to the memorial
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div
                    className={`flex items-center justify-between p-4 ${theme === "dark" ? "bg-transparent hover:bg-white/5" : "bg-white hover:bg-gray-50"}`}
                    role="listitem"
                  >
                    <div>
                      <h4 className="font-medium">
                        {t("dashboard.settings.notifications.types.rsvpUpdates")}
                      </h4>
                      <p className={`text-sm ${textMuted}`}>
                        When someone responds to service invitations
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div
                    className={`flex items-center justify-between p-4 ${theme === "dark" ? "bg-transparent hover:bg-white/5" : "bg-white hover:bg-gray-50"}`}
                    role="listitem"
                  >
                    <div>
                      <h4 className="font-medium">
                        {t("dashboard.settings.notifications.types.weeklySummary")}
                      </h4>
                      <p className={`text-sm ${textMuted}`}>Weekly report of memorial activity</p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <div>
                  <Button
                    variant="memorial"
                    className={`w-50 justify-center align-center ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
                    onClick={handleSaveNotificationSettings}
                  >
                    {t("dashboard.settings.notifications.save")}
                  </Button>
                </div>
              </CardContent>
            </Card>
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
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t("dashboard.settings.advanced.export.button")}
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-3">
                    {t("dashboard.settings.advanced.domain.title")}
                  </h4>
                  <p className={`text-sm mb-4 ${textMuted}`}>
                    {t("dashboard.settings.advanced.domain.description")}
                  </p>
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <Input placeholder="www.sarah-memorial.com" className="flex-1" />
                    <Button
                      variant={theme === "dark" ? "memorial-outline" : "outline"}
                      onClick={handleConnectDomain}
                    >
                      {t("dashboard.settings.advanced.domain.connect")}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold text-destructive mb-3 flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    {t("dashboard.settings.advanced.danger.title")}
                  </h4>
                  <div className="space-y-3">
                    <div className={`p-4 border ${dangerBorder} rounded-lg ${dangerBg}`}>
                      <h5 className={`font-medium mb-2 ${dangerTitle}`}>
                        {t("dashboard.settings.advanced.danger.archive")}
                      </h5>
                      <p className={`text-sm mb-3 ${textMuted}`}>
                        {t("dashboard.settings.advanced.danger.archiveDescription")}
                      </p>
                      <Button variant="destructive" size="sm" onClick={handleArchiveMemorial}>
                        {t("dashboard.settings.advanced.danger.archive")}
                      </Button>
                    </div>

                    <div className={`p-4 border ${dangerBorder} rounded-lg ${dangerBg}`}>
                      <h5 className={`font-medium mb-2 ${dangerTitle}`}>
                        {t("dashboard.settings.advanced.danger.delete")}
                      </h5>
                      <p className={`text-sm mb-3 ${textMuted}`}>
                        {t("dashboard.settings.advanced.danger.deleteDescription")}
                      </p>
                      <Button variant="destructive" size="sm" onClick={handleDeleteMemorial}>
                        {t("dashboard.settings.advanced.danger.delete")}
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsContent;
