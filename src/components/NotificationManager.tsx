"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellOff, Settings, AlertCircle } from "lucide-react";
import { pushNotificationService } from "@/lib/push-notifications";
import { performanceMonitor } from "@/lib/performance-monitoring";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

interface NotificationSettings {
  enabled: boolean;
  subscribed: boolean;
  permission: NotificationPermission;
  token?: string;
}

export const NotificationManager: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    subscribed: false,
    permission: "default",
  });
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      const permission = await pushNotificationService.requestPermission();
      const subscribed = await pushNotificationService.isSubscribed();

      setSettings((prev) => ({
        ...prev,
        enabled: permission.granted,
        subscribed,
        permission: permission.granted ? "granted" : permission.denied ? "denied" : "default",
      }));
    } catch (error) {
      console.error("Error checking notification status:", error);
    }
  };

  const handleEnableNotifications = async () => {
    const startTime = performance.now();
    setLoading(true);
    try {
      const permission = await pushNotificationService.requestPermission();

      if (permission.granted) {
        const subscribed = await pushNotificationService.subscribe();
        if (subscribed) {
          const token = await pushNotificationService.getToken();
          setSettings((prev) => ({
            ...prev,
            enabled: true,
            subscribed: true,
            permission: "granted",
            token: token || undefined,
          }));
          performanceMonitor.trackPushNotificationEvent("enabled", {
            time: performance.now() - startTime,
          });
          toast.success("Notifications enabled successfully!");
        } else {
          performanceMonitor.trackPushNotificationEvent("subscriptionFailed");
          toast.error("Failed to subscribe to notifications");
        }
      } else if (permission.denied) {
        setSettings((prev) => ({
          ...prev,
          enabled: false,
          permission: "denied",
        }));
        performanceMonitor.trackPushNotificationEvent("permissionDenied");
        toast.error("Notification permission denied. Please enable in browser settings.");
      }
    } catch (error) {
      performanceMonitor.recordError(error as Error, "NotificationEnable");
      console.error("Error enabling notifications:", error);
      toast.error("Failed to enable notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    try {
      const unsubscribed = await pushNotificationService.unsubscribe();
      if (unsubscribed) {
        setSettings((prev) => ({
          ...prev,
          enabled: false,
          subscribed: false,
        }));
        performanceMonitor.trackPushNotificationEvent("disabled");
        toast.success("Notifications disabled");
      } else {
        performanceMonitor.trackPushNotificationEvent("unsubscriptionFailed");
        toast.error("Failed to disable notifications");
      }
    } catch (error) {
      performanceMonitor.recordError(error as Error, "NotificationDisable");
      console.error("Error disabling notifications:", error);
      toast.error("Failed to disable notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await pushNotificationService.sendNotification({
        title: "Test Notification",
        body: "This is a test notification from ForeverPages",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        url: "/",
        actions: [
          { action: "view", title: "View" },
          { action: "dismiss", title: "Dismiss" },
        ],
      });
      performanceMonitor.trackPushNotificationEvent("testSent");
      toast.success("Test notification sent!");
    } catch (error) {
      performanceMonitor.recordError(error as Error, "TestNotification");
      console.error("Error sending test notification:", error);
      toast.error("Failed to send test notification");
    }
  };

  const getPermissionStatusColor = (permission: NotificationPermission) => {
    switch (permission) {
      case "granted":
        return "bg-green-100 text-green-800";
      case "denied":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getPermissionStatusText = (permission: NotificationPermission) => {
    switch (permission) {
      case "granted":
        return "Enabled";
      case "denied":
        return "Blocked";
      default:
        return "Not Asked";
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {settings.enabled ? (
            <Bell className="h-5 w-5 text-green-600" />
          ) : (
            <BellOff className="h-5 w-5 text-gray-400" />
          )}
          Push Notifications
        </CardTitle>
        <CardDescription>
          Stay updated with memorial page activities and important announcements
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Permission Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Permission Status</span>
          <Badge className={getPermissionStatusColor(settings.permission)}>
            {getPermissionStatusText(settings.permission)}
          </Badge>
        </div>

        {/* Subscription Status */}
        {settings.permission === "granted" && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Subscription</span>
            <Badge variant={settings.subscribed ? "default" : "secondary"}>
              {settings.subscribed ? "Active" : "Inactive"}
            </Badge>
          </div>
        )}

        {/* Permission Denied Alert */}
        {settings.permission === "denied" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Notifications are blocked. Please enable them in your browser settings and refresh the
              page.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!settings.enabled ? (
            <Button
              onClick={handleEnableNotifications}
              disabled={loading || settings.permission === "denied"}
              className="flex-1"
            >
              {loading ? "Enabling..." : "Enable Notifications"}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleDisableNotifications}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Disabling..." : "Disable Notifications"}
            </Button>
          )}

          <Button variant="outline" size="icon" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Advanced Settings */}
        {showSettings && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium">Advanced Settings</h4>

            {/* Test Notification */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Test Notification</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestNotification}
                disabled={!settings.enabled}
              >
                Send Test
              </Button>
            </div>

            {/* FCM Token Display */}
            {settings.token && (
              <div className="space-y-2">
                <span className="text-sm font-medium">FCM Token</span>
                <div className="p-2 bg-gray-50 rounded text-xs font-mono break-all">
                  {settings.token}
                </div>
              </div>
            )}

            {/* Notification Types */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Notification Types</span>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">New Tributes</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Memorial Updates</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">System Announcements</span>
                  <Switch />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationManager;
