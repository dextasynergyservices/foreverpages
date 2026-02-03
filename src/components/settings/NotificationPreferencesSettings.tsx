"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Mail,
  MessageSquare,
  Phone,
  Video,
  Calendar,
  Heart,
  Newspaper,
  Megaphone,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "@/hooks/useTranslations";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface NotificationPreferences {
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  emailTributes: boolean;
  emailComments: boolean;
  emailLivestream: boolean;
  emailAnniversary: boolean;
  emailDigest: boolean;
  emailMarketing: boolean;
  smsNotifications: boolean;
  smsTributes: boolean;
  smsLivestream: boolean;
  smsAnniversary: boolean;
  whatsappNotifications: boolean;
  whatsappNumber: string | null;
  whatsappTributes: boolean;
  whatsappLivestream: boolean;
  whatsappAnniversary: boolean;
  hasPhone: boolean;
  hasWhatsApp: boolean;
}

interface NotificationPreferencesSettingsProps {
  className?: string;
}

// Query keys
const NOTIFICATION_KEYS = {
  all: ["notification-preferences"] as const,
  preferences: () => [...NOTIFICATION_KEYS.all, "user"] as const,
};

// Fetch notification preferences
async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const response = await fetch("/api/user/notification-preferences");
  if (!response.ok) throw new Error("Failed to fetch preferences");
  const data = await response.json();
  return data.preferences;
}

// Update notification preferences
async function updateNotificationPreferences(
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const response = await fetch("/api/user/notification-preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update preferences");
  }
  const data = await response.json();
  return data.preferences;
}

// Expandable Section Component
function ExpandableSection({
  title,
  description,
  icon: Icon,
  iconColor,
  isExpanded,
  onToggle,
  switchChecked,
  onSwitchChange,
  switchDisabled,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  isExpanded: boolean;
  onToggle: () => void;
  switchChecked: boolean;
  onSwitchChange: (value: boolean) => void;
  switchDisabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("h-5 w-5", iconColor)} />
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={switchChecked}
            onCheckedChange={onSwitchChange}
            disabled={switchDisabled}
            onClick={(e) => e.stopPropagation()}
          />
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {isExpanded && <div className="px-4 pb-4 space-y-3 border-t pt-4">{children}</div>}
    </div>
  );
}

// Preference Item Component
function PreferenceItem({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between pl-8">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
          <Label>{label}</Label>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

export function NotificationPreferencesSettings({
  className,
}: NotificationPreferencesSettingsProps) {
  const { t } = useTranslations();
  const queryClient = useQueryClient();
  const [emailExpanded, setEmailExpanded] = useState(true);
  const [smsExpanded, setSmsExpanded] = useState(false);
  const [whatsappExpanded, setWhatsappExpanded] = useState(false);
  const [whatsappInput, setWhatsappInput] = useState("");

  // Query for preferences
  const {
    data: preferences,
    isLoading,
    error,
  } = useQuery({
    queryKey: NOTIFICATION_KEYS.preferences(),
    queryFn: fetchNotificationPreferences,
    staleTime: 30000,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(NOTIFICATION_KEYS.preferences(), data);
      toast.success(t("settings.notifications.saved") || "Preferences saved");
    },
    onError: (error: Error) => {
      toast.error(error.message || t("settings.notifications.error") || "Failed to save");
    },
  });

  // Handle preference change
  const handleChange = (key: keyof NotificationPreferences, value: boolean | string | null) => {
    updateMutation.mutate({ [key]: value });
  };

  // Handle WhatsApp number save
  const handleWhatsAppSave = () => {
    if (whatsappInput.trim()) {
      updateMutation.mutate({ whatsappNumber: whatsappInput.trim() });
      setWhatsappInput("");
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !preferences) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t("settings.notifications.loadError") || "Failed to load notification preferences"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t("settings.notifications.title") || "Notification Preferences"}
            </CardTitle>
            <CardDescription>
              {t("settings.notifications.description") ||
                "Control how and when you receive notifications"}
            </CardDescription>
          </div>
          <Badge variant={preferences.notificationsEnabled ? "default" : "secondary"}>
            {preferences.notificationsEnabled
              ? t("common.enabled") || "Enabled"
              : t("common.disabled") || "Disabled"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Global Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {t("settings.notifications.global.label") || "All Notifications"}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("settings.notifications.global.description") ||
                  "Master switch for all notification channels"}
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.notificationsEnabled}
            onCheckedChange={(value) => handleChange("notificationsEnabled", value)}
            disabled={updateMutation.isPending}
          />
        </div>

        {/* Email Notifications */}
        <ExpandableSection
          title={t("settings.notifications.email.title") || "Email Notifications"}
          description={t("settings.notifications.email.description") || "Receive updates via email"}
          icon={Mail}
          iconColor="text-blue-500"
          isExpanded={emailExpanded}
          onToggle={() => setEmailExpanded(!emailExpanded)}
          switchChecked={preferences.emailNotifications}
          onSwitchChange={(value) => handleChange("emailNotifications", value)}
          switchDisabled={!preferences.notificationsEnabled || updateMutation.isPending}
        >
          <PreferenceItem
            icon={Heart}
            label={t("settings.notifications.email.tributes") || "Tributes"}
            description="New candles, flowers, and memories"
            checked={preferences.emailTributes}
            onCheckedChange={(value) => handleChange("emailTributes", value)}
            disabled={!preferences.emailNotifications || updateMutation.isPending}
          />
          <PreferenceItem
            icon={MessageSquare}
            label={t("settings.notifications.email.comments") || "Comments"}
            description="New comments on memorials"
            checked={preferences.emailComments}
            onCheckedChange={(value) => handleChange("emailComments", value)}
            disabled={!preferences.emailNotifications || updateMutation.isPending}
          />
          <PreferenceItem
            icon={Video}
            label={t("settings.notifications.email.livestream") || "Livestreams"}
            description="Stream starts and reminders"
            checked={preferences.emailLivestream}
            onCheckedChange={(value) => handleChange("emailLivestream", value)}
            disabled={!preferences.emailNotifications || updateMutation.isPending}
          />
          <PreferenceItem
            icon={Calendar}
            label={t("settings.notifications.email.anniversary") || "Anniversaries"}
            description="Birthday and anniversary reminders"
            checked={preferences.emailAnniversary}
            onCheckedChange={(value) => handleChange("emailAnniversary", value)}
            disabled={!preferences.emailNotifications || updateMutation.isPending}
          />
          <PreferenceItem
            icon={Newspaper}
            label={t("settings.notifications.email.digest") || "Weekly Digest"}
            description="Summary of memorial activity"
            checked={preferences.emailDigest}
            onCheckedChange={(value) => handleChange("emailDigest", value)}
            disabled={!preferences.emailNotifications || updateMutation.isPending}
          />
          <PreferenceItem
            icon={Megaphone}
            label={t("settings.notifications.email.marketing") || "Marketing"}
            description="Tips, updates, and offers"
            checked={preferences.emailMarketing}
            onCheckedChange={(value) => handleChange("emailMarketing", value)}
            disabled={!preferences.emailNotifications || updateMutation.isPending}
          />
        </ExpandableSection>

        {/* SMS Notifications */}
        <ExpandableSection
          title={t("settings.notifications.sms.title") || "SMS Notifications"}
          description={
            preferences.hasPhone
              ? t("settings.notifications.sms.description") || "Receive urgent updates via text"
              : t("settings.notifications.sms.noPhone") || "Add phone number in profile to enable"
          }
          icon={Phone}
          iconColor="text-green-500"
          isExpanded={smsExpanded}
          onToggle={() => setSmsExpanded(!smsExpanded)}
          switchChecked={preferences.smsNotifications}
          onSwitchChange={(value) => handleChange("smsNotifications", value)}
          switchDisabled={
            !preferences.notificationsEnabled || !preferences.hasPhone || updateMutation.isPending
          }
        >
          {!preferences.hasPhone ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t("settings.notifications.sms.addPhone") ||
                  "Please add a phone number in your profile settings to enable SMS notifications."}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <PreferenceItem
                icon={Heart}
                label={t("settings.notifications.sms.tributes") || "Tributes"}
                checked={preferences.smsTributes}
                onCheckedChange={(value) => handleChange("smsTributes", value)}
                disabled={!preferences.smsNotifications || updateMutation.isPending}
              />
              <PreferenceItem
                icon={Video}
                label={t("settings.notifications.sms.livestream") || "Livestreams"}
                checked={preferences.smsLivestream}
                onCheckedChange={(value) => handleChange("smsLivestream", value)}
                disabled={!preferences.smsNotifications || updateMutation.isPending}
              />
              <PreferenceItem
                icon={Calendar}
                label={t("settings.notifications.sms.anniversary") || "Anniversaries"}
                checked={preferences.smsAnniversary}
                onCheckedChange={(value) => handleChange("smsAnniversary", value)}
                disabled={!preferences.smsNotifications || updateMutation.isPending}
              />
            </>
          )}
        </ExpandableSection>

        {/* WhatsApp Notifications */}
        <ExpandableSection
          title={t("settings.notifications.whatsapp.title") || "WhatsApp Notifications"}
          description={
            t("settings.notifications.whatsapp.description") || "Receive updates via WhatsApp"
          }
          icon={MessageSquare}
          iconColor="text-emerald-500"
          isExpanded={whatsappExpanded}
          onToggle={() => setWhatsappExpanded(!whatsappExpanded)}
          switchChecked={preferences.whatsappNotifications}
          onSwitchChange={(value) => handleChange("whatsappNotifications", value)}
          switchDisabled={
            !preferences.notificationsEnabled ||
            !preferences.hasWhatsApp ||
            updateMutation.isPending
          }
        >
          {!preferences.hasWhatsApp ? (
            <div className="space-y-3">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t("settings.notifications.whatsapp.addNumber") ||
                    "Add your WhatsApp number to enable notifications."}
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Input
                  placeholder="+1234567890"
                  value={whatsappInput}
                  onChange={(e) => setWhatsappInput(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  onClick={handleWhatsAppSave}
                  disabled={!whatsappInput.trim() || updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 pl-8 text-sm text-muted-foreground mb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                WhatsApp: {preferences.whatsappNumber}
              </div>
              <PreferenceItem
                icon={Heart}
                label={t("settings.notifications.whatsapp.tributes") || "Tributes"}
                checked={preferences.whatsappTributes}
                onCheckedChange={(value) => handleChange("whatsappTributes", value)}
                disabled={!preferences.whatsappNotifications || updateMutation.isPending}
              />
              <PreferenceItem
                icon={Video}
                label={t("settings.notifications.whatsapp.livestream") || "Livestreams"}
                checked={preferences.whatsappLivestream}
                onCheckedChange={(value) => handleChange("whatsappLivestream", value)}
                disabled={!preferences.whatsappNotifications || updateMutation.isPending}
              />
              <PreferenceItem
                icon={Calendar}
                label={t("settings.notifications.whatsapp.anniversary") || "Anniversaries"}
                checked={preferences.whatsappAnniversary}
                onCheckedChange={(value) => handleChange("whatsappAnniversary", value)}
                disabled={!preferences.whatsappNotifications || updateMutation.isPending}
              />
            </>
          )}
        </ExpandableSection>

        {/* Save Indicator */}
        {updateMutation.isPending && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("common.saving") || "Saving..."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NotificationPreferencesSettings;
