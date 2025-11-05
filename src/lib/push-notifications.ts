import type { Messaging } from "firebase/messaging";
import type { FirebaseApp } from "firebase/app";

let getMessaging: ((app: FirebaseApp) => Messaging) | undefined;
let getToken:
  | ((messaging: Messaging, options?: { vapidKey: string }) => Promise<string>)
  | undefined;
let onMessage:
  | ((messaging: Messaging, callback: (payload: FirebasePayload) => void) => void)
  | undefined;
let initializeApp: ((config: FirebaseConfig) => FirebaseApp) | undefined;

(async () => {
  try {
    const messagingModule = await import("firebase/messaging");
    const appModule = await import("firebase/app");
    getMessaging = messagingModule.getMessaging;
    getToken = messagingModule.getToken;
    onMessage = messagingModule.onMessage;
    initializeApp = appModule.initializeApp;
  } catch {
    console.warn("Firebase not available, push notifications will be limited");
  }
})();

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  actions?: NotificationAction[];
}

interface NotificationPermissionState {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

interface FirebasePayload {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: Record<string, string>;
}

class PushNotificationService {
  private messaging: Messaging | null = null;
  private vapidKey: string;
  private firebaseConfig: FirebaseConfig;

  constructor() {
    // Firebase configuration - in production, these should come from environment variables
    this.firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-key",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
    };

    this.vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "demo-vapid-key";
  }

  // Initialize Firebase and messaging
  async initialize(): Promise<void> {
    try {
      // Check if we're in a browser environment
      if (typeof window === "undefined") {
        console.warn("Push notifications not available in server environment");
        return;
      }

      // Check if service workers are supported
      if (!("serviceWorker" in navigator)) {
        console.warn("Service workers not supported");
        return;
      }

      // Check if push messaging is supported
      if (!("PushManager" in window)) {
        console.warn("Push messaging not supported");
        return;
      }

      // Check if Firebase is available
      if (!initializeApp || !getMessaging) {
        console.warn("Firebase not available, using basic notification support");
        return;
      }

      const app = initializeApp(this.firebaseConfig);
      this.messaging = getMessaging(app);

      console.log("Push notification service initialized");
    } catch (error) {
      console.error("Failed to initialize push notifications:", error);
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermissionState> {
    try {
      const permission = await Notification.requestPermission();

      const state: NotificationPermissionState = {
        granted: permission === "granted",
        denied: permission === "denied",
        default: permission === "default",
      };

      console.log("Notification permission:", permission);
      return state;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return { granted: false, denied: true, default: false };
    }
  }

  // Get FCM token
  async getToken(): Promise<string | null> {
    try {
      if (!this.messaging || !getToken) {
        console.warn("Firebase messaging not available");
        return null;
      }

      const token = await getToken(this.messaging, {
        vapidKey: this.vapidKey,
      });

      if (token) {
        console.log("FCM token obtained:", token);
        return token;
      } else {
        console.warn("No FCM token available");
        return null;
      }
    } catch (error) {
      console.error("Error getting FCM token:", error);
      return null;
    }
  }

  // Listen for foreground messages
  onMessage(callback: (payload: FirebasePayload) => void): void {
    if (!this.messaging || !onMessage) {
      console.warn("Firebase messaging not available");
      return;
    }

    onMessage(this.messaging, (payload: FirebasePayload) => {
      console.log("Message received in foreground:", payload);
      callback(payload);
    });
  }

  // Send notification to user
  async sendNotification(data: PushNotificationData): Promise<void> {
    try {
      if (!("serviceWorker" in navigator)) {
        throw new Error("Service workers not supported");
      }

      const registration = await navigator.serviceWorker.ready;

      const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
        body: data.body,
        icon: data.icon || "/favicon.ico",
        badge: data.badge || "/favicon.ico",
        data: {
          url: data.url || "/",
          dateOfArrival: Date.now(),
        },
        vibrate: [100, 50, 100],
        requireInteraction: true,
      };

      // Note: actions are not supported in all browsers
      if (data.actions && "actions" in Notification.prototype) {
        (
          notificationOptions as NotificationOptions & {
            actions?: NotificationAction[];
          }
        ).actions = data.actions;
      }

      await registration.showNotification(data.title, notificationOptions);

      console.log("Notification sent successfully");
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }

  // Subscribe to push notifications
  async subscribe(): Promise<PushSubscription | null> {
    try {
      if (!("serviceWorker" in navigator)) {
        throw new Error("Service workers not supported");
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidKey) as BufferSource,
      });

      console.log("Push subscription successful:", subscription);
      return subscription;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    try {
      if (!("serviceWorker" in navigator)) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        console.log("Push unsubscription successful");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      return false;
    }
  }

  // Check if user is subscribed
  async isSubscribed(): Promise<boolean> {
    try {
      if (!("serviceWorker" in navigator)) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error("Error checking subscription status:", error);
      return false;
    }
  }

  // Utility function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
