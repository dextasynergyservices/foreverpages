"use client";

import React, { useState } from "react";
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

const Settings = () => {
  const { t } = useTranslations();
  const { theme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [publicMemorial, setPublicMemorial] = useState(true);
  const [allowTributes, setAllowTributes] = useState(true);
  const [moderateTributes, setModerateTributes] = useState(true);

  const handleSaveProfile = () => {
    console.log("Saving profile changes");
  };

  const handleSaveMemorialSettings = () => {
    console.log("Saving memorial settings");
  };

  const handleSavePrivacySettings = () => {
    console.log("Saving privacy settings");
  };

  const handleSaveNotificationSettings = () => {
    console.log("Saving notification settings");
  };

  const handleExportData = () => {
    console.log("Exporting memorial data");
  };

  const handleConnectDomain = () => {
    console.log("Connecting domain");
  };

  const handleArchiveMemorial = () => {
    console.log("Archiving memorial");
  };

  const handleDeleteMemorial = () => {
    console.log("Deleting memorial");
  };

  const handleSignOut = () => {
    console.log("Signing out");
  };

  const handleSendAdminInvitations = () => {
    console.log("Sending admin invitations");
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
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 gap-2 md:grid-cols-5">
            <TabsTrigger
              value="profile"
              className={`px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
            >
              {t("dashboard.settings.tabs.profile")}
            </TabsTrigger>
            <TabsTrigger
              value="memorial"
              className={`px-3 py-2 text-sm md:text-base whitespace-nowrap ${activeTabClasses}`}
            >
              {t("dashboard.settings.tabs.memorial")}
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
                    <Input id="first-name" defaultValue="Sarah" />
                  </div>
                  <div>
                    <Label htmlFor="last-name">{t("dashboard.settings.profile.lastName")}</Label>
                    <Input id="last-name" defaultValue="Johnson" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">{t("dashboard.settings.profile.email")}</Label>
                  <Input id="email" type="email" defaultValue="sarah.johnson@email.com" />
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
                <Button variant="memorial" className="w-full" onClick={handleSaveProfile}>
                  {t("dashboard.settings.profile.save")}
                </Button>
              </CardContent>
            </Card>
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
                      foreverpages.com/
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

                <Button variant="memorial" className="w-full" onClick={handleSaveMemorialSettings}>
                  {t("dashboard.settings.memorial.save")}
                </Button>
              </CardContent>
            </Card>
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
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="admin-emails">
                        {t("dashboard.settings.privacy.access.additionalAdmins")}
                      </Label>
                      <Textarea
                        id="admin-emails"
                        placeholder="Enter email addresses of people who can help manage this memorial"
                        rows={3}
                      />
                    </div>
                    <Button
                      variant={theme === "dark" ? "memorial-outline" : "outline"}
                      onClick={handleSendAdminInvitations}
                    >
                      {t("dashboard.settings.privacy.access.sendAdminInvites")}
                    </Button>
                  </div>
                </div>

                <Button variant="memorial" className="w-full" onClick={handleSavePrivacySettings}>
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
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {t("dashboard.settings.advanced.account.signOut")}
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

export default Settings;
