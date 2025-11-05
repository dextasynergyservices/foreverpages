"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { syncManager, SyncResult, NetworkStatus } from "@/lib/offline/sync-manager";
import { actionQueue } from "@/lib/offline/action-queue";
import { offlineDb } from "@/lib/offline/db";
import { OfflineAction } from "@/lib/offline/db-schema";

interface OfflineContextType {
  // Network status
  isOnline: boolean;
  networkStatus: NetworkStatus;

  // Sync status
  isSyncing: boolean;
  lastSyncResult: SyncResult | null;
  pendingActionsCount: number;

  // Actions
  syncNow: () => Promise<SyncResult>;
  getPendingActions: () => Promise<OfflineAction[]>;
  clearOfflineData: () => Promise<void>;

  // Event handlers
  onNetworkChange?: (isOnline: boolean) => void;
  onSyncComplete?: (result: SyncResult) => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
  onNetworkChange?: (isOnline: boolean) => void;
  onSyncComplete?: (result: SyncResult) => void;
}

export function OfflineProvider({
  children,
  onNetworkChange,
  onSyncComplete,
}: OfflineProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true,
    lastChecked: new Date(),
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [pendingActionsCount, setPendingActionsCount] = useState(0);

  // Update network status
  const updateNetworkStatus = useCallback(() => {
    const status = syncManager.getNetworkStatus();
    setNetworkStatus(status);
    setIsOnline(status.isOnline);

    if (onNetworkChange) {
      onNetworkChange(status.isOnline);
    }
  }, [onNetworkChange]);

  // Update pending actions count
  const updatePendingActionsCount = useCallback(async () => {
    try {
      const actions = await actionQueue.getQueuedActions();
      setPendingActionsCount(actions.length);
    } catch (error) {
      console.error("Failed to get pending actions count:", error);
    }
  }, []);

  // Manual sync function
  const syncNow = async (): Promise<SyncResult> => {
    if (isSyncing) {
      throw new Error("Sync already in progress");
    }

    setIsSyncing(true);
    try {
      const result = await syncManager.syncAll();
      setLastSyncResult(result);

      // Update pending actions count after sync
      await updatePendingActionsCount();

      if (onSyncComplete) {
        onSyncComplete(result);
      }

      return result;
    } finally {
      setIsSyncing(false);
    }
  };

  // Get pending actions
  const getPendingActions = async (): Promise<OfflineAction[]> => {
    return actionQueue.getQueuedActions();
  };

  // Clear all offline data
  const clearOfflineData = async (): Promise<void> => {
    await offlineDb.clearAllData();
    await updatePendingActionsCount();
  };

  // Initialize and set up listeners
  useEffect(() => {
    // Initial status update
    updateNetworkStatus();
    updatePendingActionsCount();

    // Set up periodic updates
    const networkCheckInterval = setInterval(updateNetworkStatus, 10000); // Check every 10 seconds
    const actionsCheckInterval = setInterval(updatePendingActionsCount, 5000); // Check every 5 seconds

    // Cleanup
    return () => {
      clearInterval(networkCheckInterval);
      clearInterval(actionsCheckInterval);
    };
  }, [updateNetworkStatus, updatePendingActionsCount]);

  const contextValue: OfflineContextType = {
    isOnline,
    networkStatus,
    isSyncing,
    lastSyncResult,
    pendingActionsCount,
    syncNow,
    getPendingActions,
    clearOfflineData,
    onNetworkChange,
    onSyncComplete,
  };

  return <OfflineContext.Provider value={contextValue}>{children}</OfflineContext.Provider>;
}

export function useOffline(): OfflineContextType {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error("useOffline must be used within an OfflineProvider");
  }
  return context;
}

// Additional hooks for specific offline functionality
export function useOfflineStatus() {
  const { isOnline, networkStatus, pendingActionsCount } = useOffline();
  return { isOnline, networkStatus, pendingActionsCount };
}

export function useOfflineSync() {
  const { isSyncing, lastSyncResult, syncNow } = useOffline();
  return { isSyncing, lastSyncResult, syncNow };
}

export function useOfflineActions() {
  const { getPendingActions, clearOfflineData } = useOffline();
  return { getPendingActions, clearOfflineData };
}
