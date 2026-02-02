"use client";

import { useState } from "react";
import {
  Bell,
  BellOff,
  Smartphone,
  MessageSquare,
  Video,
  Calendar,
  Info,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useTranslations } from "@/hooks/useTranslations";
import { cn } from "@/lib/utils";

interface NotificationSettingsProps {
  className?: string;
}

export function NotificationSettings({ className }: NotificationSettingsProps) {
  const { t } = useTranslations();
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    error,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
    sendTestNotification,
  } = usePushNotifications();

  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleSubscribe = async () => {
    await subscribe();
  };

  const handleUnsubscribe = async () => {
    await unsubscribe();
  };

  const handlePreferenceChange = async (
    key:
      | "tributeNotifications"
      | "livestreamNotifications"
      | "anniversaryNotifications"
      | "systemNotifications",
    value: boolean
  ) => {
    setIsUpdating(key);
    await updatePreferences({ [key]: value });
    setIsUpdating(null);
  };

  // Browser doesn't support push notifications
  if (!isSupported) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            {t("pushNotifications.title")}
          </CardTitle>
          <CardDescription>{t("pushNotifications.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("pushNotifications.notSupported")}</AlertTitle>
            <AlertDescription>{t("pushNotifications.notSupportedDescription")}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Permission was denied
  if (permission === "denied") {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            {t("pushNotifications.title")}
          </CardTitle>
          <CardDescription>{t("pushNotifications.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>{t("pushNotifications.permissionDenied")}</AlertTitle>
            <AlertDescription>
              {t("pushNotifications.permissionDeniedDescription")}
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
              {t("pushNotifications.title")}
            </CardTitle>
            <CardDescription>{t("pushNotifications.description")}</CardDescription>
          </div>
          <Badge variant={isSubscribed ? "default" : "secondary"}>
            {isSubscribed ? t("pushNotifications.enabled") : t("pushNotifications.disabled")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {isSubscribed ? t("pushNotifications.enabled") : t("pushNotifications.disabled")}
              </p>
              <p className="text-sm text-muted-foreground">
                {isSubscribed
                  ? t("pushNotifications.preferences.description")
                  : t("pushNotifications.description")}
              </p>
            </div>
          </div>
          <Button
            variant={isSubscribed ? "outline" : "default"}
            onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : isSubscribed ? (
              <BellOff className="h-4 w-4 mr-2" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            {isSubscribed ? t("pushNotifications.disable") : t("pushNotifications.enable")}
          </Button>
        </div>

        {/* Notification Preferences */}
        {isSubscribed && (
          <div className="space-y-4">
            <h4 className="font-medium">{t("pushNotifications.preferences.title")}</h4>
            <div className="space-y-4">
              {/* Tribute Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="tribute-notifications">
                      {t("pushNotifications.preferences.tributes.label")}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t("pushNotifications.preferences.tributes.description")}
                    </p>
                  </div>
                </div>
                <Switch
                  id="tribute-notifications"
                  checked={preferences?.tributeNotifications ?? true}
                  onCheckedChange={(value) => handlePreferenceChange("tributeNotifications", value)}
                  disabled={isUpdating === "tributeNotifications"}
                />
              </div>

              <hr className="border-t" />

              {/* Livestream Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="livestream-notifications">
                      {t("pushNotifications.preferences.livestream.label")}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t("pushNotifications.preferences.livestream.description")}
                    </p>
                  </div>
                </div>
                <Switch
                  id="livestream-notifications"
                  checked={preferences?.livestreamNotifications ?? true}
                  onCheckedChange={(value) =>
                    handlePreferenceChange("livestreamNotifications", value)
                  }
                  disabled={isUpdating === "livestreamNotifications"}
                />
              </div>

              <hr className="border-t" />

              {/* Anniversary Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="anniversary-notifications">
                      {t("pushNotifications.preferences.anniversary.label")}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t("pushNotifications.preferences.anniversary.description")}
                    </p>
                  </div>
                </div>
                <Switch
                  id="anniversary-notifications"
                  checked={preferences?.anniversaryNotifications ?? true}
                  onCheckedChange={(value) =>
                    handlePreferenceChange("anniversaryNotifications", value)
                  }
                  disabled={isUpdating === "anniversaryNotifications"}
                />
              </div>

              <hr className="border-t" />

              {/* System Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="system-notifications">
                      {t("pushNotifications.preferences.system.label")}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t("pushNotifications.preferences.system.description")}
                    </p>
                  </div>
                </div>
                <Switch
                  id="system-notifications"
                  checked={preferences?.systemNotifications ?? true}
                  onCheckedChange={(value) => handlePreferenceChange("systemNotifications", value)}
                  disabled={isUpdating === "systemNotifications"}
                />
              </div>
            </div>

            {/* Test Notification Button */}
            <div className="pt-4 border-t">
              <Button variant="outline" size="sm" onClick={sendTestNotification} className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                {t("pushNotifications.testNotification")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NotificationSettings;
