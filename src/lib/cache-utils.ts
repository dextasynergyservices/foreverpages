/**
 * Cache Utilities for ForeverPages
 *
 * Provides utilities for managing browser cache and service worker cache.
 * Use these functions to programmatically clear cache when needed.
 */

export const cacheUtils = {
  /**
   * Clear all service worker caches
   * This will force the browser to fetch fresh content
   */
  async clearServiceWorkerCache(): Promise<boolean> {
    try {
      const controller = navigator.serviceWorker?.controller;
      if ("serviceWorker" in navigator && controller) {
        return new Promise((resolve) => {
          const messageChannel = new MessageChannel();

          messageChannel.port1.onmessage = (event) => {
            if (event.data && event.data.type === "CACHE_CLEARED") {
              resolve(true);
            }
          };

          controller.postMessage({ type: "CLEAR_CACHE" }, [messageChannel.port2] as Transferable[]);

          // Timeout after 5 seconds
          setTimeout(() => resolve(false), 5000);
        });
      }
      return false;
    } catch (error) {
      console.error("Failed to clear service worker cache:", error);
      return false;
    }
  },

  /**
   * Clear all browser caches using the Cache API
   */
  async clearBrowserCache(): Promise<boolean> {
    try {
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to clear browser cache:", error);
      return false;
    }
  },

  /**
   * Force update the service worker
   * This will check for a new version and install it
   */
  async forceServiceWorkerUpdate(): Promise<boolean> {
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to update service worker:", error);
      return false;
    }
  },

  /**
   * Unregister service worker completely
   * Use this for debugging or when you need to fully reset the PWA
   */
  async unregisterServiceWorker(): Promise<boolean> {
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to unregister service worker:", error);
      return false;
    }
  },

  /**
   * Get the current service worker version
   */
  async getServiceWorkerVersion(): Promise<string | null> {
    try {
      const controller = navigator.serviceWorker?.controller;
      if ("serviceWorker" in navigator && controller) {
        return new Promise((resolve) => {
          const messageChannel = new MessageChannel();

          messageChannel.port1.onmessage = (event) => {
            if (event.data && event.data.type === "SW_VERSION") {
              resolve(event.data.version);
            }
          };

          controller.postMessage({ type: "GET_VERSION" }, [messageChannel.port2] as Transferable[]);

          // Timeout after 2 seconds
          setTimeout(() => resolve(null), 2000);
        });
      }
      return null;
    } catch (error) {
      console.error("Failed to get service worker version:", error);
      return null;
    }
  },

  /**
   * Hard refresh the page, bypassing all caches
   */
  hardRefresh(): void {
    // Clear local storage items related to cache
    try {
      // Remove any cache-related localStorage keys
      const keysToRemove = Object.keys(localStorage).filter(
        (key) => key.includes("cache") || key.includes("sw-")
      );
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
      // localStorage might not be available
    }

    // Force reload from server
    window.location.reload();
  },

  /**
   * Full cache reset - clears everything and reloads
   */
  async fullCacheReset(): Promise<void> {
    await this.clearBrowserCache();
    await this.unregisterServiceWorker();
    this.hardRefresh();
  },
};

// Export individual functions for convenience
export const {
  clearServiceWorkerCache,
  clearBrowserCache,
  forceServiceWorkerUpdate,
  unregisterServiceWorker,
  getServiceWorkerVersion,
  hardRefresh,
  fullCacheReset,
} = cacheUtils;

export default cacheUtils;
