"use client";

import { useEffect, useRef } from "react";

interface UsePresenceHeartbeatOptions {
  memorialId: string;
  section?: string;
  isEditing?: boolean;
  enabled?: boolean;
  interval?: number; // milliseconds, default 15000 (15 seconds)
}

/**
 * Hook to automatically send presence heartbeats while user is on the page
 * Cleans up presence when component unmounts
 */
export function usePresenceHeartbeat({
  memorialId,
  section,
  isEditing = false,
  enabled = true,
  interval = 15000,
}: UsePresenceHeartbeatOptions) {
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSectionRef = useRef<string | undefined>(section);
  const lastIsEditingRef = useRef<boolean>(isEditing);

  useEffect(() => {
    if (!enabled) return;

    const sendHeartbeat = async () => {
      try {
        await fetch(`/api/memorials/${memorialId}/presence`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            section: section || null,
            isEditing,
          }),
        });
      } catch (error) {
        console.error("Failed to send presence heartbeat:", error);
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval
    intervalRef.current = setInterval(sendHeartbeat, interval);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Remove presence when unmounting
      fetch(`/api/memorials/${memorialId}/presence`, {
        method: "DELETE",
      }).catch((error) => {
        console.error("Failed to cleanup presence:", error);
      });
    };
  }, [memorialId, section, isEditing, enabled, interval]);

  // Update heartbeat immediately when section or editing status changes
  useEffect(() => {
    if (!enabled) return;

    const hasChanged = section !== lastSectionRef.current || isEditing !== lastIsEditingRef.current;

    if (hasChanged) {
      lastSectionRef.current = section;
      lastIsEditingRef.current = isEditing;

      fetch(`/api/memorials/${memorialId}/presence`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: section || null,
          isEditing,
        }),
      }).catch((error) => {
        console.error("Failed to update presence:", error);
      });
    }
  }, [memorialId, section, isEditing, enabled]);
}
