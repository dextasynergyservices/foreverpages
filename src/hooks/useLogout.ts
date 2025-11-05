"use client";

import { signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { offlineDb } from "@/lib/offline/db";
import { useCallback, useState } from "react";

/**
 * Custom hook for handling logout with comprehensive cache clearing
 *
 * This hook ensures that when a user logs out:
 * 1. NextAuth session is cleared
 * 2. React Query cache is completely cleared
 * 3. IndexedDB (offline data) is cleared
 * 4. Service Worker caches are cleared
 * 5. Page is reloaded to reset all state
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    // Safety check - only run in browser
    if (typeof window === "undefined") {
      console.warn("useLogout: Cannot logout during SSR");
      return;
    }

    setIsLoggingOut(true);

    try {
      // 1. Clear React Query cache
      queryClient.clear();

      // 2. Clear IndexedDB offline data
      try {
        await offlineDb.clearAllData();
        await offlineDb.close();
      } catch (error) {
        console.error("Failed to clear offline data:", error);
      }

      // 3. Clear Service Worker caches
      if ("caches" in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(async (cacheName) => {
              // Clear all caches except static assets
              if (
                cacheName.includes("api") ||
                cacheName.includes("dynamic") ||
                cacheName.includes("session")
              ) {
                await caches.delete(cacheName);
              }
            })
          );
        } catch (error) {
          console.error("Failed to clear service worker caches:", error);
        }
      }

      // 4. Sign out from NextAuth
      await signOut({ redirect: false });

      // 5. Clear localStorage items related to auth/session
      try {
        // Remove specific items that might cache user data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.includes("user") ||
              key.includes("session") ||
              key.includes("auth") ||
              key.includes("token"))
          ) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      } catch (error) {
        console.error("Failed to clear localStorage:", error);
      }

      // 6. Force a full page reload to clear all in-memory state
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
      // Even if something fails, try to redirect
      window.location.href = "/";
    }
  }, [queryClient]);

  return { logout, isLoggingOut };
}
