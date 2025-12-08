"use client";

import { useState, useEffect, useCallback } from "react";

interface EditLock {
  id: string;
  section: string;
  lockedById: string;
  userName: string;
  userRole: string;
  lockedAt: Date;
  expiresAt: Date;
}

interface UseEditLockOptions {
  memorialId: string;
  section: string;
  enabled?: boolean;
  onLockAcquired?: () => void;
  onLockReleased?: () => void;
  onLockFailed?: (lockedBy: { userName: string; userRole: string }) => void;
}

interface UseEditLockReturn {
  isLocked: boolean;
  isLockedByMe: boolean;
  lockedBy: { userName: string; userRole: string } | null;
  acquireLock: () => Promise<boolean>;
  releaseLock: () => Promise<boolean>;
  checkLock: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing edit locks on memorial sections
 */
export function useEditLock({
  memorialId,
  section,
  enabled = true,
  onLockAcquired,
  onLockReleased,
  onLockFailed,
}: UseEditLockOptions): UseEditLockReturn {
  const [isLocked, setIsLocked] = useState(false);
  const [isLockedByMe, setIsLockedByMe] = useState(false);
  const [lockedBy, setLockedBy] = useState<{ userName: string; userRole: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkLock = useCallback(async () => {
    if (!enabled) return;

    try {
      const response = await fetch(`/api/memorials/${memorialId}/locks`);

      if (!response.ok) {
        throw new Error("Failed to check lock status");
      }

      const locks: EditLock[] = await response.json();
      const sectionLock = locks.find((lock) => lock.section === section);

      if (sectionLock) {
        setIsLocked(true);
        setLockedBy({
          userName: sectionLock.userName,
          userRole: sectionLock.userRole,
        });

        // Check if current user owns the lock (this would need session info)
        // For now, we'll assume it's locked by someone else
        setIsLockedByMe(false);
      } else {
        setIsLocked(false);
        setIsLockedByMe(false);
        setLockedBy(null);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [memorialId, section, enabled]);

  const acquireLock = useCallback(async (): Promise<boolean> => {
    if (!enabled) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/memorials/${memorialId}/locks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ section }),
      });

      if (response.status === 409) {
        // Section is locked by another user
        const data = await response.json();
        setIsLocked(true);
        setIsLockedByMe(false);
        setLockedBy({
          userName: data.lockedBy.userName,
          userRole: data.lockedBy.userRole,
        });

        if (onLockFailed) {
          onLockFailed(data.lockedBy);
        }

        return false;
      }

      if (!response.ok) {
        throw new Error("Failed to acquire lock");
      }

      setIsLocked(true);
      setIsLockedByMe(true);
      setLockedBy(null);

      if (onLockAcquired) {
        onLockAcquired();
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setLoading(false);
    }
  }, [memorialId, section, enabled, onLockAcquired, onLockFailed]);

  const releaseLock = useCallback(async (): Promise<boolean> => {
    if (!enabled) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/memorials/${memorialId}/locks?section=${encodeURIComponent(section)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to release lock");
      }

      setIsLocked(false);
      setIsLockedByMe(false);
      setLockedBy(null);

      if (onLockReleased) {
        onLockReleased();
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setLoading(false);
    }
  }, [memorialId, section, enabled, onLockReleased]);

  // Check lock status on mount and when section changes
  useEffect(() => {
    checkLock();
  }, [checkLock]);

  // Auto-release lock on unmount
  useEffect(() => {
    return () => {
      if (isLockedByMe) {
        fetch(`/api/memorials/${memorialId}/locks?section=${encodeURIComponent(section)}`, {
          method: "DELETE",
        }).catch((error) => {
          console.error("Failed to release lock on unmount:", error);
        });
      }
    };
  }, [memorialId, section, isLockedByMe]);

  return {
    isLocked,
    isLockedByMe,
    lockedBy,
    acquireLock,
    releaseLock,
    checkLock,
    loading,
    error,
  };
}
