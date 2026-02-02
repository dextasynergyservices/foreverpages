"use client";

import { useCallback, useEffect, useState } from "react";

interface OfflineStatus {
  isOnline: boolean;
  isServiceWorkerReady: boolean;
  cachedMemorials: string[];
}

export function useOffline() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isServiceWorkerReady: false,
    cachedMemorials: [],
  });

  // Listen for online/offline events
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setStatus((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStatus((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check service worker status
    const checkServiceWorker = async () => {
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          setStatus((prev) => ({ ...prev, isServiceWorkerReady: !!registration.active }));
        } catch (error) {
          console.error("Service worker not ready:", error);
        }
      }
    };

    checkServiceWorker();

    // Listen for messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "MEMORIAL_CACHED") {
        if (event.data.success) {
          setStatus((prev) => ({
            ...prev,
            cachedMemorials: [...new Set([...prev.cachedMemorials, event.data.url])],
          }));
        }
      } else if (event.data.type === "MEMORIAL_CACHE_CLEARED") {
        setStatus((prev) => ({ ...prev, cachedMemorials: [] }));
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, []);

  // Cache a memorial page for offline access
  const cacheMemorial = useCallback(
    async (url: string): Promise<boolean> => {
      if (!status.isServiceWorkerReady) return false;

      try {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({
          type: "CACHE_MEMORIAL",
          url,
        });
        return true;
      } catch (error) {
        console.error("Failed to cache memorial:", error);
        return false;
      }
    },
    [status.isServiceWorkerReady]
  );

  // Cache current memorial page
  const cacheCurrentPage = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    return cacheMemorial(window.location.href);
  }, [cacheMemorial]);

  // Clear memorial cache
  const clearCache = useCallback(async (): Promise<boolean> => {
    if (!status.isServiceWorkerReady) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({
        type: "CLEAR_MEMORIAL_CACHE",
      });
      return true;
    } catch (error) {
      console.error("Failed to clear cache:", error);
      return false;
    }
  }, [status.isServiceWorkerReady]);

  // Check if a specific memorial is cached
  const isMemorialCached = useCallback(
    (slug: string): boolean => {
      return status.cachedMemorials.some((url) => url.includes(`/memorial/${slug}`));
    },
    [status.cachedMemorials]
  );

  return {
    ...status,
    cacheMemorial,
    cacheCurrentPage,
    clearCache,
    isMemorialCached,
  };
}

export default useOffline;
