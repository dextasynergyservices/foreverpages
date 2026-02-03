"use client";

import { useEffect } from "react";
import { pushNotificationService } from "@/lib/push-notifications";
import { toast } from "sonner";
// import { syncManager } from "@/lib/offline/sync-manager";
// import { performanceMonitor } from "@/lib/performance-monitoring";

export const PushNotificationInitializer: React.FC = () => {
  useEffect(() => {
    const initializePushNotifications = async () => {
      const startTime = performance.now();

      try {
        // Register service worker
        if ("serviceWorker" in navigator) {
          const swStartTime = performance.now();
          const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
            updateViaCache: "none", // Always check for SW updates
          });

          const swRegistrationTime = performance.now() - swStartTime;
          console.log(
            `Service Worker registered in ${swRegistrationTime.toFixed(2)}ms:`,
            registration
          );
          // performanceMonitor.recordPWAMetric("serviceWorkerRegistrationTime", swRegistrationTime);
          // performanceMonitor.trackServiceWorkerEvent("registered", { time: swRegistrationTime });

          // Check for updates on page load
          registration.update();

          // Handle SW updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // New SW is ready, prompt user to refresh
                  toast.info("A new version is available!", {
                    description: "Click to refresh and get the latest updates.",
                    action: {
                      label: "Refresh",
                      onClick: () => {
                        newWorker.postMessage({ type: "SKIP_WAITING" });
                        window.location.reload();
                      },
                    },
                    duration: 10000,
                  });
                }
              });
            }
          });

          // Handle controller change (when new SW takes over)
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            console.log("New service worker activated, refreshing...");
            // Auto-refresh when new SW takes control
            window.location.reload();
          });

          // Wait for the service worker to be ready
          await navigator.serviceWorker.ready;

          // Initialize push notifications
          await pushNotificationService.initialize();

          // Listen for foreground messages
          pushNotificationService.onMessage((payload) => {
            console.log("Received foreground message:", payload);
            // performanceMonitor.trackPushNotificationEvent(
            //   "foregroundReceived",
            //   payload as Record<string, unknown>
            // );

            // Handle foreground messages (show toast or custom UI)
            if (payload.notification) {
              // You could show a toast notification here instead of browser notification
              console.log("Foreground notification:", payload.notification);
            }
          });

          // Register background sync if supported
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (registration as any).sync.register("background-sync");
            // performanceMonitor.trackBackgroundSyncEvent("registered");
            console.log("Background sync registered");
          } catch (error) {
            console.warn("Background sync registration failed:", error);
            // performanceMonitor.trackBackgroundSyncEvent("registrationFailed", {
            //   error: (error as Error).message,
            // });
          }

          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener("message", (event) => {
            if (event.data && event.data.type === "BACKGROUND_SYNC") {
              console.log("Received background sync request from service worker");
              // performanceMonitor.trackBackgroundSyncEvent("triggered");
              // syncManager
              //   .handleBackgroundSync()
              //   .then((result) => {
              //     performanceMonitor.trackBackgroundSyncEvent(
              //       "completed",
              //       result as unknown as Record<string, unknown>
              //     );
              //     console.log("Background sync completed:", result);
              //   })
              //   .catch((error) => {
              //     performanceMonitor.trackBackgroundSyncEvent("failed", { error: error.message });
              //     console.error("Background sync failed:", error);
              //   });
            } else if (event.data && event.data.type === "PERFORMANCE_METRIC") {
              // Handle performance metrics from service worker
              const { metric } = event.data;
              console.log(`Service Worker metric: ${metric}`);
              // const { value, data } = event.data;
              // if (metric === "pushNotificationProcessingTime") {
              //   performanceMonitor.recordPWAMetric("pushNotificationProcessingTime", value);
              //   performanceMonitor.trackServiceWorkerEvent("pushNotificationProcessed", {
              //     time: value,
              //     ...data,
              //   });
              // } else if (metric === "backgroundSyncProcessingTime") {
              //   performanceMonitor.recordPWAMetric("backgroundSyncProcessingTime", value);
              //   performanceMonitor.trackServiceWorkerEvent("backgroundSyncProcessed", {
              //     time: value,
              //     ...data,
              //   });
              // }
            } else if (event.data && event.data.type === "SW_UPDATED") {
              // New SW version notification
              console.log(`Service Worker updated to version ${event.data.version}`);
              toast.success("App updated!", {
                description: "You're now using the latest version.",
              });
            } else if (event.data && event.data.type === "CACHE_CLEARED") {
              console.log("Cache cleared successfully");
              toast.success("Cache cleared", {
                description: "All cached data has been refreshed.",
              });
            }
          });
        } else {
          console.warn("Service workers not supported");
          // performanceMonitor.trackServiceWorkerEvent("notSupported");
        }

        const totalTime = performance.now() - startTime;
        console.log(`PWA initialization completed in ${totalTime.toFixed(2)}ms`);
        // performanceMonitor.recordMetric("pwa.initializationTime", totalTime);
      } catch (error) {
        const totalTime = performance.now() - startTime;
        console.error(`PWA initialization failed after ${totalTime.toFixed(2)}ms:`, error);
        // performanceMonitor.recordMetric("pwa.initializationTime", totalTime);
        // performanceMonitor.recordError(error as Error, "PWA Initialization");
      }
    };

    initializePushNotifications();
  }, []);

  // This component doesn't render anything
  return null;
};

export default PushNotificationInitializer;
