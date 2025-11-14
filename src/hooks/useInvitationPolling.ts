"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface UseInvitationPollingOptions {
  memorialId: string;
  enabled?: boolean;
  interval?: number; // milliseconds
  onStatusChange?: (changes: InvitationStatusChange[]) => void;
}

interface InvitationStatusChange {
  invitationId: string;
  oldStatus: string;
  newStatus: string;
  guestName: string;
}

/**
 * Custom hook for polling invitation status updates
 * Polls the server at regular intervals to check for status changes
 * Updates React Query cache and triggers callbacks
 */
export function useInvitationPolling({
  memorialId,
  enabled = true,
  interval = 30000, // Default 30 seconds
  onStatusChange,
}: UseInvitationPollingOptions) {
  const queryClient = useQueryClient();
  const previousStatusMapRef = useRef<Map<string, string>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkForUpdates = useCallback(async () => {
    if (!enabled || !memorialId) return;

    try {
      const response = await fetch(`/api/invitations?memorialId=${memorialId}`, {
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) return;

      const invitations = await response.json();
      const changes: InvitationStatusChange[] = [];

      // Compare with previous status
      const currentStatusMap = new Map<string, string>();

      invitations.forEach(
        (invitation: { id: string; status: string; name?: string; email: string }) => {
          currentStatusMap.set(invitation.id, invitation.status);

          const previousStatus = previousStatusMapRef.current.get(invitation.id);
          if (previousStatus && previousStatus !== invitation.status) {
            changes.push({
              invitationId: invitation.id,
              oldStatus: previousStatus,
              newStatus: invitation.status,
              guestName: invitation.name || invitation.email,
            });
          }
        }
      );

      // Update previous status map
      previousStatusMapRef.current = currentStatusMap;

      // If there are changes, invalidate query and trigger callback
      if (changes.length > 0) {
        await queryClient.invalidateQueries({
          queryKey: ["invitations", memorialId],
        });

        if (onStatusChange) {
          onStatusChange(changes);
        }
      }
    } catch (error) {
      console.error("Error polling invitation updates:", error);
    }
  }, [enabled, memorialId, queryClient, onStatusChange]);

  useEffect(() => {
    if (!enabled || !memorialId) return;

    // Initial check
    checkForUpdates();

    // Set up polling interval
    intervalRef.current = setInterval(checkForUpdates, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, memorialId, interval, checkForUpdates]);

  // Manual refresh function
  const refresh = useCallback(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  return { refresh };
}
