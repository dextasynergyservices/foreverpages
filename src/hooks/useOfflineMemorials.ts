"use client";

import { useState, useEffect, useCallback } from "react";
import { offlineDb } from "@/lib/offline/db";
import { actionQueue } from "@/lib/offline/action-queue";
import { Memorial } from "@/lib/offline/db-schema";
import { useOfflineStatus } from "@/contexts/OfflineContext";

interface UseOfflineMemorialsReturn {
  memorials: Memorial[];
  isLoading: boolean;
  error: string | null;
  createMemorial: (
    memorial: Omit<Memorial, "id" | "createdAt" | "updatedAt" | "syncStatus">
  ) => Promise<string>;
  updateMemorial: (id: string, updates: Partial<Memorial>) => Promise<void>;
  deleteMemorial: (id: string) => Promise<void>;
  refreshMemorials: () => Promise<void>;
}

export function useOfflineMemorials(): UseOfflineMemorialsReturn {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useOfflineStatus();

  const loadMemorials = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await offlineDb.getAllMemorials();
      setMemorials(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load memorials");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createMemorial = useCallback(
    async (
      memorialData: Omit<Memorial, "id" | "createdAt" | "updatedAt" | "syncStatus">
    ): Promise<string> => {
      const memorial: Memorial = {
        ...memorialData,
        id: `memorial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: isOnline ? "synced" : "pending",
      };

      try {
        // Save to local database
        await offlineDb.saveMemorial(memorial);

        // Queue action for server sync
        await actionQueue.queueAction("create_memorial", {
          id: memorial.id,
          title: memorial.title,
          description: memorial.description,
          imageUrl: memorial.imageUrl,
          createdBy: memorial.createdBy,
        });

        // Update local state
        setMemorials((prev) => [...prev, memorial]);

        return memorial.id;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create memorial");
        throw err;
      }
    },
    [isOnline]
  );

  const updateMemorial = useCallback(
    async (id: string, updates: Partial<Memorial>): Promise<void> => {
      try {
        const existing = await offlineDb.getMemorial(id);
        if (!existing) {
          throw new Error("Memorial not found");
        }

        const updated: Memorial = {
          ...existing,
          ...updates,
          updatedAt: new Date(),
          syncStatus: isOnline ? "synced" : "pending",
        };

        // Save to local database
        await offlineDb.saveMemorial(updated);

        // Queue action for server sync
        await actionQueue.queueAction("update_memorial", {
          id: updated.id,
          title: updated.title,
          description: updated.description,
          imageUrl: updated.imageUrl,
        });

        // Update local state
        setMemorials((prev) => prev.map((m) => (m.id === id ? updated : m)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update memorial");
        throw err;
      }
    },
    [isOnline]
  );

  const deleteMemorial = useCallback(async (id: string): Promise<void> => {
    try {
      // Queue action for server sync
      await actionQueue.queueAction("delete_memorial", { id });

      // Remove from local database
      await offlineDb.deleteMemorial(id);

      // Update local state
      setMemorials((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete memorial");
      throw err;
    }
  }, []);

  const refreshMemorials = useCallback(async (): Promise<void> => {
    await loadMemorials();
  }, [loadMemorials]);

  // Load memorials on mount
  useEffect(() => {
    loadMemorials();
  }, [loadMemorials]);

  return {
    memorials,
    isLoading,
    error,
    createMemorial,
    updateMemorial,
    deleteMemorial,
    refreshMemorials,
  };
}
