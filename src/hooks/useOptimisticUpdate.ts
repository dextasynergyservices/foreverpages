"use client";

import { useState, useCallback } from "react";

interface OptimisticLockError {
  error: "VERSION_CONFLICT";
  details: {
    clientVersion: number;
    serverVersion: number;
    lastEditedBy: string;
    lastEditedAt: string;
  };
}

interface UseOptimisticUpdateOptions<T> {
  memorialId: string;
  onConflict?: (conflict: OptimisticLockError) => void;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseOptimisticUpdateReturn<T> {
  updateMemorial: (data: Partial<T>, currentVersion: number) => Promise<T | null>;
  loading: boolean;
  error: string | null;
  conflict: OptimisticLockError | null;
  clearConflict: () => void;
}

/**
 * Hook for updating memorials with optimistic locking
 * Automatically handles version conflicts and provides conflict resolution
 */
export function useOptimisticUpdate<T = Record<string, unknown>>({
  memorialId,
  onConflict,
  onSuccess,
  onError,
}: UseOptimisticUpdateOptions<T>): UseOptimisticUpdateReturn<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<OptimisticLockError | null>(null);

  const updateMemorial = useCallback(
    async (data: Partial<T>, currentVersion: number): Promise<T | null> => {
      setLoading(true);
      setError(null);
      setConflict(null);

      try {
        const response = await fetch(`/api/memorials/${memorialId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...data,
            version: currentVersion,
          }),
        });

        const result = await response.json();

        if (response.status === 409) {
          // Version conflict
          const conflictError = result as OptimisticLockError;
          setConflict(conflictError);

          if (onConflict) {
            onConflict(conflictError);
          }

          return null;
        }

        if (!response.ok) {
          throw new Error(result.message || "Failed to update memorial");
        }

        const updatedData = result.data as T;

        if (onSuccess) {
          onSuccess(updatedData);
        }

        return updatedData;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);

        if (onError && err instanceof Error) {
          onError(err);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [memorialId, onConflict, onSuccess, onError]
  );

  const clearConflict = useCallback(() => {
    setConflict(null);
    setError(null);
  }, []);

  return {
    updateMemorial,
    loading,
    error,
    conflict,
    clearConflict,
  };
}
