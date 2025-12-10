import { offlineDb } from "./db";
import { OfflineAction, Memorial, Tribute, GalleryItem } from "./db-schema";
import { performanceMonitor } from "../performance-monitoring";

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync: {
    register: (tag: string) => Promise<void>;
    getTags: () => Promise<string[]>;
  };
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

export interface NetworkStatus {
  isOnline: boolean;
  lastChecked: Date;
  connectionType?: string;
}

export class SyncManager {
  private static instance: SyncManager | null = null;
  private isOnline = true;
  private syncInProgress = false;
  private networkCheckInterval: NodeJS.Timeout | null = null;
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;
  private backgroundSyncSupported = false;

  static getInstance(): SyncManager {
    // Don't create instance during SSR
    if (typeof window === "undefined") {
      // Return a mock instance for SSR
      return new SyncManager();
    }

    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  constructor() {
    // Only initialize client-side features if window is available
    if (typeof window !== "undefined") {
      this.startNetworkMonitoring();
      this.checkBackgroundSyncSupport();
    }
  }

  getNetworkStatus(): NetworkStatus {
    const connectionType =
      typeof navigator !== "undefined" &&
      (navigator as { connection?: { effectiveType?: string } }).connection?.effectiveType
        ? (navigator as { connection?: { effectiveType?: string } }).connection!.effectiveType
        : "unknown";

    return {
      isOnline: this.isOnline,
      lastChecked: new Date(),
      connectionType,
    };
  }

  async syncAll(): Promise<SyncResult> {
    const startTime = performance.now();
    if (this.syncInProgress) {
      throw new Error("Sync already in progress");
    }

    if (!this.isOnline) {
      throw new Error("Cannot sync while offline");
    }

    this.syncInProgress = true;

    try {
      const result: SyncResult = {
        success: true,
        syncedCount: 0,
        failedCount: 0,
        errors: [],
      };

      // Sync offline actions first
      const actionResult = await this.syncOfflineActions();
      result.syncedCount += actionResult.syncedCount;
      result.failedCount += actionResult.failedCount;
      result.errors.push(...actionResult.errors);

      // Sync local data changes
      const dataResult = await this.syncLocalData();
      result.syncedCount += dataResult.syncedCount;
      result.failedCount += dataResult.failedCount;
      result.errors.push(...dataResult.errors);

      result.success = result.failedCount === 0;

      const syncTime = performance.now() - startTime;
      performanceMonitor.recordPWAMetric("syncAllTime", syncTime);
      performanceMonitor.trackBackgroundSyncEvent("syncAllCompleted", {
        time: syncTime,
        syncedCount: result.syncedCount,
        failedCount: result.failedCount,
      });

      return result;
    } catch (error) {
      const syncTime = performance.now() - startTime;
      performanceMonitor.recordPWAMetric("syncAllTime", syncTime);
      performanceMonitor.trackBackgroundSyncEvent("syncAllFailed", {
        time: syncTime,
        error: (error as Error).message,
      });
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncOfflineActions(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      const pendingActions = await offlineDb.getPendingActions();

      for (const action of pendingActions) {
        try {
          const success = await this.executeActionOnServer(action);
          if (success) {
            await offlineDb.updateActionStatus(action.id, "completed");
            result.syncedCount++;
          } else {
            await offlineDb.updateActionStatus(action.id, "failed", "Server rejected action");
            result.failedCount++;
            result.errors.push(`Action ${action.id} failed: Server rejected action`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          await offlineDb.updateActionStatus(action.id, "failed", errorMessage);
          result.failedCount++;
          result.errors.push(`Action ${action.id} failed: ${errorMessage}`);
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(
        `Failed to sync actions: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    return result;
  }

  async syncLocalData(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      // Sync memorials
      const memorials = await offlineDb.getAllMemorials();
      const unsyncedMemorials = memorials.filter((m) => m.syncStatus !== "synced");

      for (const memorial of unsyncedMemorials) {
        try {
          const success = await this.syncMemorial(memorial);
          if (success) {
            memorial.syncStatus = "synced";
            memorial.syncedAt = new Date();
            await offlineDb.saveMemorial(memorial);
            result.syncedCount++;
          } else {
            memorial.syncStatus = "failed";
            await offlineDb.saveMemorial(memorial);
            result.failedCount++;
          }
        } catch (error) {
          memorial.syncStatus = "failed";
          await offlineDb.saveMemorial(memorial);
          result.failedCount++;
          result.errors.push(
            `Memorial ${memorial.id} sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      // Sync tributes
      const allTributes: Tribute[] = [];
      for (const memorial of memorials) {
        const tributes = await offlineDb.getTributesByMemorial(memorial.id);
        allTributes.push(...tributes);
      }

      const unsyncedTributes = allTributes.filter((t) => t.syncStatus !== "synced");

      for (const tribute of unsyncedTributes) {
        try {
          const success = await this.syncTribute(tribute);
          if (success) {
            tribute.syncStatus = "synced";
            tribute.syncedAt = new Date();
            await offlineDb.saveTribute(tribute);
            result.syncedCount++;
          } else {
            tribute.syncStatus = "failed";
            await offlineDb.saveTribute(tribute);
            result.failedCount++;
          }
        } catch (error) {
          tribute.syncStatus = "failed";
          await offlineDb.saveTribute(tribute);
          result.failedCount++;
          result.errors.push(
            `Tribute ${tribute.id} sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      // Sync gallery items
      const allGalleryItems: GalleryItem[] = [];
      for (const memorial of memorials) {
        const items = await offlineDb.getGalleryItemsByMemorial(memorial.id);
        allGalleryItems.push(...items);
      }

      const unsyncedGalleryItems = allGalleryItems.filter((g) => g.syncStatus !== "synced");

      for (const item of unsyncedGalleryItems) {
        try {
          const success = await this.syncGalleryItem(item);
          if (success) {
            item.syncStatus = "synced";
            item.syncedAt = new Date();
            await offlineDb.saveGalleryItem(item);
            result.syncedCount++;
          } else {
            item.syncStatus = "failed";
            await offlineDb.saveGalleryItem(item);
            result.failedCount++;
          }
        } catch (error) {
          item.syncStatus = "failed";
          await offlineDb.saveGalleryItem(item);
          result.failedCount++;
          result.errors.push(
            `Gallery item ${item.id} sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(
        `Failed to sync local data: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    return result;
  }

  private async executeActionOnServer(action: OfflineAction): Promise<boolean> {
    // This would make actual API calls to your backend
    // For now, we'll simulate based on action type
    switch (action.type) {
      case "create_memorial":
        return await this.createMemorialOnServer(action.data as Partial<Memorial>);
      case "update_memorial":
        return await this.updateMemorialOnServer(action.data as unknown as Memorial);
      case "delete_memorial":
        return await this.deleteMemorialOnServer(action.data.id as string);
      case "create_tribute":
        return await this.createTributeOnServer(action.data as Partial<Tribute>);
      case "update_tribute":
        return await this.updateTributeOnServer(action.data as unknown as Tribute);
      case "delete_tribute":
        return await this.deleteTributeOnServer(action.data.id as string);
      case "upload_media":
        return await this.uploadMediaOnServer(action.data as Partial<GalleryItem>);
      case "delete_media":
        return await this.deleteMediaOnServer(action.data.id as string);
      default:
        console.warn(`Unknown action type: ${action.type}`);
        return false;
    }
  }

  // Placeholder methods for server API calls - replace with actual API calls

  private async createMemorialOnServer(_data: Partial<Memorial>): Promise<boolean> {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 100));
    return Math.random() > 0.1; // 90% success rate
  }

  private async updateMemorialOnServer(_data: Memorial): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return Math.random() > 0.1;
  }

  private async deleteMemorialOnServer(_id: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return Math.random() > 0.1;
  }

  private async createTributeOnServer(_data: Partial<Tribute>): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return Math.random() > 0.1;
  }

  private async updateTributeOnServer(_data: Tribute): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return Math.random() > 0.1;
  }

  private async deleteTributeOnServer(_id: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return Math.random() > 0.1;
  }

  private async uploadMediaOnServer(_data: Partial<GalleryItem>): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return Math.random() > 0.1;
  }

  private async deleteMediaOnServer(_id: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return Math.random() > 0.1;
  }

  private async syncMemorial(memorial: Memorial): Promise<boolean> {
    if (memorial.syncStatus === "pending") {
      return await this.createMemorialOnServer(memorial);
    }
    return true; // Already synced or failed
  }

  private async syncTribute(tribute: Tribute): Promise<boolean> {
    if (tribute.syncStatus === "pending") {
      return await this.createTributeOnServer(tribute);
    }
    return true;
  }

  private async syncGalleryItem(item: GalleryItem): Promise<boolean> {
    if (item.syncStatus === "pending") {
      return await this.uploadMediaOnServer(item);
    }
    return true;
  }

  private startNetworkMonitoring(): void {
    // Check network status initially
    this.checkNetworkStatus();

    // Create bound handlers
    this.onlineHandler = () => {
      this.isOnline = true;
      this.onNetworkChange(true);
    };

    this.offlineHandler = () => {
      this.isOnline = false;
      this.onNetworkChange(false);
    };

    // Monitor online/offline events
    window.addEventListener("online", this.onlineHandler);
    window.addEventListener("offline", this.offlineHandler);

    // Periodic network checks
    this.networkCheckInterval = setInterval(() => {
      this.checkNetworkStatus();
    }, 30000); // Check every 30 seconds
  }

  private async checkNetworkStatus(): Promise<void> {
    try {
      // Simple connectivity check
      const response = await fetch("/api/health", {
        method: "HEAD",
        cache: "no-cache",
      });
      const wasOnline = this.isOnline;
      this.isOnline = response.ok;

      if (wasOnline !== this.isOnline) {
        this.onNetworkChange(this.isOnline);
      }
    } catch {
      const wasOnline = this.isOnline;
      this.isOnline = false;

      if (wasOnline !== this.isOnline) {
        this.onNetworkChange(false);
      }
    }
  }

  private onNetworkChange(isOnline: boolean): void {
    if (isOnline) {
      // Trigger sync when coming back online
      this.syncAll().catch((error) => {
        console.error("Auto-sync failed:", error);
      });
    }
  }

  // Cleanup method
  destroy(): void {
    if (this.networkCheckInterval) {
      clearInterval(this.networkCheckInterval);
      this.networkCheckInterval = null;
    }

    if (typeof window !== "undefined") {
      if (this.onlineHandler) {
        window.removeEventListener("online", this.onlineHandler);
      }

      if (this.offlineHandler) {
        window.removeEventListener("offline", this.offlineHandler);
      }
    }
  }

  // Background Sync methods
  private checkBackgroundSyncSupport(): void {
    try {
      this.backgroundSyncSupported =
        typeof navigator !== "undefined" &&
        "serviceWorker" in navigator &&
        typeof navigator.serviceWorker !== "undefined" &&
        "sync" in ServiceWorkerRegistration.prototype;
    } catch {
      this.backgroundSyncSupported = false;
    }
  }

  async registerBackgroundSync(tag: string = "background-sync"): Promise<boolean> {
    const startTime = performance.now();
    if (!this.backgroundSyncSupported) {
      console.warn("Background Sync not supported");
      performanceMonitor.trackBackgroundSyncEvent("registrationFailed", {
        reason: "notSupported",
        time: performance.now() - startTime,
      });
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as ServiceWorkerRegistrationWithSync).sync.register(tag);
      const registrationTime = performance.now() - startTime;
      performanceMonitor.recordPWAMetric("backgroundSyncRegistrationTime", registrationTime);
      performanceMonitor.trackBackgroundSyncEvent("registered", {
        tag,
        time: registrationTime,
      });
      console.log(`Background sync registered: ${tag}`);
      return true;
    } catch (error) {
      const registrationTime = performance.now() - startTime;
      performanceMonitor.trackBackgroundSyncEvent("registrationFailed", {
        tag,
        time: registrationTime,
        error: (error as Error).message,
      });
      console.error("Failed to register background sync:", error);
      return false;
    }
  }

  async unregisterBackgroundSync(tag: string = "background-sync"): Promise<boolean> {
    if (!this.backgroundSyncSupported) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const tags = await (registration as ServiceWorkerRegistrationWithSync).sync.getTags();
      if (tags.includes(tag)) {
        // Note: Background Sync doesn't have an unregister method
        // The sync will be removed after execution or can be managed via service worker
        console.log(`Background sync ${tag} will be removed after execution`);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to check background sync tags:", error);
      return false;
    }
  }

  getBackgroundSyncTags(): Promise<string[]> {
    if (!this.backgroundSyncSupported) {
      return Promise.resolve([]);
    }

    return navigator.serviceWorker.ready
      .then((registration) => (registration as ServiceWorkerRegistrationWithSync).sync.getTags())
      .catch((error) => {
        console.error("Failed to get background sync tags:", error);
        return [];
      });
  }

  // Enhanced sync method with background sync fallback
  async syncWithBackgroundSync(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      // Try immediate sync first
      if (this.isOnline) {
        const immediateResult = await this.syncAll();
        result.syncedCount += immediateResult.syncedCount;
        result.failedCount += immediateResult.failedCount;
        result.errors.push(...immediateResult.errors);
        result.success = immediateResult.success;
      } else {
        // Register background sync for when we come back online
        const backgroundSyncRegistered = await this.registerBackgroundSync();
        if (backgroundSyncRegistered) {
          console.log("Background sync registered for offline sync");
        } else {
          result.success = false;
          result.errors.push("Failed to register background sync");
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(
        `Sync with background sync failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    return result;
  }

  // Method to handle background sync events (called from service worker)
  async handleBackgroundSync(): Promise<SyncResult> {
    const startTime = performance.now();
    console.log("Handling background sync event");

    // Force network check to ensure we're online
    await this.checkNetworkStatus();

    if (!this.isOnline) {
      console.warn("Background sync triggered but still offline");
      performanceMonitor.trackBackgroundSyncEvent("backgroundSyncFailed", {
        reason: "stillOffline",
        time: performance.now() - startTime,
      });
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: ["Still offline during background sync"],
      };
    }

    // Perform the actual sync
    const result = await this.syncAll();
    const totalTime = performance.now() - startTime;
    performanceMonitor.trackBackgroundSyncEvent("backgroundSyncCompleted", {
      time: totalTime,
      syncedCount: result.syncedCount,
      failedCount: result.failedCount,
    });

    return result;
  }
}

// Export singleton instance (lazy-loaded)
let _syncManager: SyncManager | null = null;
export const getSyncManager = () => {
  if (!_syncManager) {
    _syncManager = SyncManager.getInstance();
  }
  return _syncManager;
};
export const syncManager = new Proxy({} as SyncManager, {
  get(target, prop) {
    const instance = getSyncManager();
    const value = (instance as unknown as Record<string, unknown>)[prop as string];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});
export default syncManager;
