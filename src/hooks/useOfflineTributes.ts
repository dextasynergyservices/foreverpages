"use client";

import { useState, useEffect, useCallback } from "react";
import { offlineDb } from "@/lib/offline/db";
import { actionQueue } from "@/lib/offline/action-queue";
import { Tribute } from "@/lib/offline/db-schema";
import { useOfflineStatus } from "@/contexts/OfflineContext";

interface UseOfflineTributesReturn {
  tributes: Tribute[];
  isLoading: boolean;
  error: string | null;
  createTribute: (
    tribute: Omit<Tribute, "id" | "createdAt" | "updatedAt" | "syncStatus">
  ) => Promise<string>;
  updateTribute: (id: string, updates: Partial<Tribute>) => Promise<void>;
  deleteTribute: (id: string) => Promise<void>;
  getTributesByMemorial: (memorialId: string) => Promise<Tribute[]>;
  refreshTributes: () => Promise<void>;
}

export function useOfflineTributes(memorialId?: string): UseOfflineTributesReturn {
  const [tributes, setTributes] = useState<Tribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useOfflineStatus();

  const loadTributes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (memorialId) {
        const data = await offlineDb.getTributesByMemorial(memorialId);
        setTributes(data);
      } else {
        // Load all tributes if no memorialId specified
        const allTributes: Tribute[] = [];
        const memorials = await offlineDb.getAllMemorials();

        for (const memorial of memorials) {
          const memorialTributes = await offlineDb.getTributesByMemorial(memorial.id);
          allTributes.push(...memorialTributes);
        }

        setTributes(allTributes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tributes");
    } finally {
      setIsLoading(false);
    }
  }, [memorialId]);

  const createTribute = useCallback(
    async (
      tributeData: Omit<Tribute, "id" | "createdAt" | "updatedAt" | "syncStatus">
    ): Promise<string> => {
      const tribute: Tribute = {
        ...tributeData,
        id: `tribute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: isOnline ? "synced" : "pending",
      };

      try {
        // Save to local database
        await offlineDb.saveTribute(tribute);

        // Queue action for server sync
        await actionQueue.queueAction("create_tribute", {
          id: tribute.id,
          memorialId: tribute.memorialId,
          message: tribute.message,
          author: tribute.author,
          status: tribute.status,
        });

        // Update local state
        setTributes((prev) => [...prev, tribute]);

        return tribute.id;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create tribute");
        throw err;
      }
    },
    [isOnline]
  );

  const updateTribute = useCallback(
    async (id: string, updates: Partial<Tribute>): Promise<void> => {
      try {
        // Find existing tribute
        const existing = tributes.find((t) => t.id === id);
        if (!existing) {
          throw new Error("Tribute not found");
        }

        const updated: Tribute = {
          ...existing,
          ...updates,
          updatedAt: new Date(),
          syncStatus: isOnline ? "synced" : "pending",
        };

        // Save to local database
        await offlineDb.saveTribute(updated);

        // Queue action for server sync
        await actionQueue.queueAction("update_tribute", {
          id: updated.id,
          memorialId: updated.memorialId,
          message: updated.message,
          author: updated.author,
          status: updated.status,
        });

        // Update local state
        setTributes((prev) => prev.map((t) => (t.id === id ? updated : t)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update tribute");
        throw err;
      }
    },
    [isOnline, tributes]
  );

  const deleteTribute = useCallback(async (id: string): Promise<void> => {
    try {
      // Queue action for server sync
      await actionQueue.queueAction("delete_tribute", { id });

      // Remove from local database
      // Note: We don't have a deleteTribute method, so we'll need to implement it
      // For now, we'll mark it as deleted in the UI
      setTributes((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete tribute");
      throw err;
    }
  }, []);

  const getTributesByMemorial = useCallback(
    async (memorialIdToFetch: string): Promise<Tribute[]> => {
      return offlineDb.getTributesByMemorial(memorialIdToFetch);
    },
    []
  );

  const refreshTributes = useCallback(async (): Promise<void> => {
    await loadTributes();
  }, [loadTributes]);

  // Load tributes on mount and when memorialId changes
  useEffect(() => {
    loadTributes();
  }, [loadTributes]);

  return {
    tributes,
    isLoading,
    error,
    createTribute,
    updateTribute,
    deleteTribute,
    getTributesByMemorial,
    refreshTributes,
  };
}
