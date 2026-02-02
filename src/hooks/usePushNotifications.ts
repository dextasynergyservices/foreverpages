"use client";

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface SubscriptionPreferences {
  id: string;
  tributeNotifications: boolean;
  livestreamNotifications: boolean;
  anniversaryNotifications: boolean;
  systemNotifications: boolean;
}

interface PushSubscriptionResponse {
  subscriptions: SubscriptionPreferences[];
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

// Query keys
const PUSH_KEYS = {
  all: ["push"] as const,
  preferences: () => [...PUSH_KEYS.all, "preferences"] as const,
  status: () => [...PUSH_KEYS.all, "status"] as const,
};

// Utility functions
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array<ArrayBuffer>;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Check if push is supported
function checkPushSupport(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

// Get current subscription status
async function getPushStatus(): Promise<{
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | null;
  subscription: PushSubscription | null;
}> {
  if (!checkPushSupport()) {
    return {
      isSupported: false,
      isSubscribed: false,
      permission: null,
      subscription: null,
    };
  }

  const permission = Notification.permission;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    return {
      isSupported: true,
      isSubscribed: !!subscription,
      permission,
      subscription,
    };
  } catch {
    return {
      isSupported: true,
      isSubscribed: false,
      permission,
      subscription: null,
    };
  }
}

// Fetch preferences from server
async function fetchPreferences(): Promise<SubscriptionPreferences | null> {
  const response = await fetch("/api/push/subscribe");
  if (!response.ok) return null;

  const data: PushSubscriptionResponse = await response.json();
  return data.subscriptions?.[0] || null;
}

// Subscribe to push notifications
async function subscribeToPush(): Promise<PushSubscription> {
  if (!VAPID_PUBLIC_KEY) {
    throw new Error("Push notifications not configured");
  }

  // Request permission if needed
  if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Notification permission denied");
    }
  }

  // Get service worker registration
  const registration = await navigator.serviceWorker.ready;

  // Subscribe to push
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  // Send subscription to server
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
        auth: arrayBufferToBase64(subscription.getKey("auth")),
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to save subscription");
  }

  return subscription;
}

// Unsubscribe from push notifications
async function unsubscribeFromPush(subscription: PushSubscription): Promise<void> {
  // Unsubscribe from browser
  await subscription.unsubscribe();

  // Remove from server
  await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
    method: "DELETE",
  });
}

// Update preferences on server
async function updatePreferencesOnServer(
  subscriptionId: string,
  updates: Partial<Omit<SubscriptionPreferences, "id">>
): Promise<SubscriptionPreferences> {
  const response = await fetch("/api/push/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscriptionId,
      ...updates,
    }),
  });

  if (!response.ok) throw new Error("Failed to update preferences");

  const data = await response.json();
  return data.subscription;
}

export function usePushNotifications() {
  const queryClient = useQueryClient();

  // Query for push status
  const statusQuery = useQuery({
    queryKey: PUSH_KEYS.status(),
    queryFn: getPushStatus,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Query for preferences (only when subscribed)
  const preferencesQuery = useQuery({
    queryKey: PUSH_KEYS.preferences(),
    queryFn: fetchPreferences,
    enabled: statusQuery.data?.isSubscribed ?? false,
    staleTime: 60000, // 1 minute
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: subscribeToPush,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PUSH_KEYS.status() });
      queryClient.invalidateQueries({ queryKey: PUSH_KEYS.preferences() });
    },
  });

  // Unsubscribe mutation
  const unsubscribeMutation = useMutation({
    mutationFn: unsubscribeFromPush,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PUSH_KEYS.status() });
      queryClient.setQueryData(PUSH_KEYS.preferences(), null);
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: ({
      subscriptionId,
      updates,
    }: {
      subscriptionId: string;
      updates: Partial<Omit<SubscriptionPreferences, "id">>;
    }) => updatePreferencesOnServer(subscriptionId, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(PUSH_KEYS.preferences(), data);
    },
  });

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!statusQuery.data?.isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      queryClient.invalidateQueries({ queryKey: PUSH_KEYS.status() });
      return permission === "granted";
    } catch {
      return false;
    }
  }, [statusQuery.data?.isSupported, queryClient]);

  // Subscribe helper
  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      await subscribeMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  }, [subscribeMutation]);

  // Unsubscribe helper
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    const subscription = statusQuery.data?.subscription;
    if (!subscription) return false;

    try {
      await unsubscribeMutation.mutateAsync(subscription);
      return true;
    } catch {
      return false;
    }
  }, [statusQuery.data?.subscription, unsubscribeMutation]);

  // Update preferences helper
  const updatePreferences = useCallback(
    async (updates: Partial<Omit<SubscriptionPreferences, "id">>): Promise<boolean> => {
      const subscriptionId = preferencesQuery.data?.id;
      if (!subscriptionId) return false;

      try {
        await updatePreferencesMutation.mutateAsync({
          subscriptionId,
          updates,
        });
        return true;
      } catch {
        return false;
      }
    },
    [preferencesQuery.data?.id, updatePreferencesMutation]
  );

  // Test notification
  const sendTestNotification = useCallback(async () => {
    if (!statusQuery.data?.isSubscribed) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification("Test Notification", {
        body: "Push notifications are working!",
        icon: "/icons/icon-192x192.png",
        badge: "/icons/badge-72x72.png",
      });
    } catch (error) {
      console.error("Error sending test notification:", error);
    }
  }, [statusQuery.data?.isSubscribed]);

  return {
    // Status
    isSupported: statusQuery.data?.isSupported ?? false,
    isSubscribed: statusQuery.data?.isSubscribed ?? false,
    permission: statusQuery.data?.permission ?? null,
    subscription: statusQuery.data?.subscription ?? null,

    // Loading states
    isLoading:
      statusQuery.isLoading || subscribeMutation.isPending || unsubscribeMutation.isPending,
    isSubscribing: subscribeMutation.isPending,
    isUnsubscribing: unsubscribeMutation.isPending,
    isUpdatingPreferences: updatePreferencesMutation.isPending,

    // Error states
    error: subscribeMutation.error?.message || unsubscribeMutation.error?.message || null,

    // Data
    preferences: preferencesQuery.data ?? null,

    // Actions
    subscribe,
    unsubscribe,
    requestPermission,
    updatePreferences,
    sendTestNotification,

    // Refetch
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: PUSH_KEYS.all });
    },
  };
}

export default usePushNotifications;
