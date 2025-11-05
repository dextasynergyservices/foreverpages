import { offlineDb } from "./db";
import { actionQueue } from "./action-queue";
import { Memorial, Tribute, GalleryItem } from "./db-schema";
import { ActionPayload } from "./action-queue";

export interface Conflict {
  id: string;
  type: "memorial" | "tribute" | "gallery_item";
  localData: Memorial | Tribute | GalleryItem;
  serverData: Memorial | Tribute | GalleryItem;
  conflictReason: string;
  timestamp: Date;
  resolution?: ConflictResolution;
}

export interface ConflictResolution {
  strategy: "local_wins" | "server_wins" | "merge" | "manual";
  resolvedData?: Memorial | Tribute | GalleryItem;
  resolvedAt: Date;
}

export class ConflictResolver {
  private static instance: ConflictResolver;
  private conflicts: Conflict[] = [];

  static getInstance(): ConflictResolver {
    if (!ConflictResolver.instance) {
      ConflictResolver.instance = new ConflictResolver();
    }
    return ConflictResolver.instance;
  }

  // Detect conflicts during sync
  async detectConflicts(serverData: {
    memorials?: Memorial[];
    tributes?: Tribute[];
    galleryItems?: GalleryItem[];
  }): Promise<Conflict[]> {
    const newConflicts: Conflict[] = [];

    // Check memorials for conflicts
    if (serverData.memorials) {
      for (const serverMemorial of serverData.memorials) {
        const localMemorial = await offlineDb.getMemorial(serverMemorial.id);

        if (localMemorial && this.hasConflict(localMemorial, serverMemorial)) {
          newConflicts.push({
            id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: "memorial",
            localData: localMemorial,
            serverData: serverMemorial,
            conflictReason: this.getConflictReason(localMemorial, serverMemorial),
            timestamp: new Date(),
          });
        }
      }
    }

    // Check tributes for conflicts
    if (serverData.tributes) {
      for (const serverTribute of serverData.tributes) {
        // Find local tribute by checking all memorials
        const memorials = await offlineDb.getAllMemorials();
        let localTribute: Tribute | null = null;

        for (const memorial of memorials) {
          const tributes = await offlineDb.getTributesByMemorial(memorial.id);
          localTribute = tributes.find((t) => t.id === serverTribute.id) || null;
          if (localTribute) break;
        }

        if (localTribute && this.hasConflict(localTribute, serverTribute)) {
          newConflicts.push({
            id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: "tribute",
            localData: localTribute,
            serverData: serverTribute,
            conflictReason: this.getConflictReason(localTribute, serverTribute),
            timestamp: new Date(),
          });
        }
      }
    }

    // Check gallery items for conflicts
    if (serverData.galleryItems) {
      for (const serverItem of serverData.galleryItems) {
        // Find local gallery item by checking all memorials
        const memorials = await offlineDb.getAllMemorials();
        let localItem: GalleryItem | null = null;

        for (const memorial of memorials) {
          const items = await offlineDb.getGalleryItemsByMemorial(memorial.id);
          localItem = items.find((i) => i.id === serverItem.id) || null;
          if (localItem) break;
        }

        if (localItem && this.hasConflict(localItem, serverItem)) {
          newConflicts.push({
            id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: "gallery_item",
            localData: localItem,
            serverData: serverItem,
            conflictReason: this.getConflictReason(localItem, serverItem),
            timestamp: new Date(),
          });
        }
      }
    }

    this.conflicts.push(...newConflicts);
    return newConflicts;
  }

  // Check if two items have a conflict
  private hasConflict(
    localItem: Memorial | Tribute | GalleryItem,
    serverItem: Memorial | Tribute | GalleryItem
  ): boolean {
    // Check if both items have been modified since last sync
    const localModified = localItem.updatedAt || localItem.createdAt;
    const serverModified = serverItem.updatedAt || serverItem.createdAt;
    const lastSynced = localItem.syncedAt || serverItem.syncedAt;

    // If both have been modified after last sync, there's a conflict
    if (lastSynced) {
      return (
        localModified && localModified > lastSynced && serverModified && serverModified > lastSynced
      );
    }

    // If local item exists but server says it was deleted, conflict
    if (localItem && !serverItem) return true;

    // If server item exists but local was deleted, conflict
    if (!localItem && serverItem) return true;

    return false;
  }

  // Get human-readable conflict reason
  private getConflictReason(
    localItem: Memorial | Tribute | GalleryItem,
    serverItem: Memorial | Tribute | GalleryItem
  ): string {
    const localModified = localItem.updatedAt || localItem.createdAt;
    const serverModified = serverItem.updatedAt || serverItem.createdAt;

    if (localModified && serverModified) {
      return `Both local and server versions modified. Local: ${localModified.toISOString()}, Server: ${serverModified.toISOString()}`;
    }

    if (localItem && !serverItem) {
      return "Item exists locally but was deleted on server";
    }

    if (!localItem && serverItem) {
      return "Item was deleted locally but exists on server";
    }

    return "Unknown conflict reason";
  }

  // Resolve a conflict with different strategies
  async resolveConflict(conflictId: string, resolution: ConflictResolution): Promise<void> {
    const conflict = this.conflicts.find((c) => c.id === conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    conflict.resolution = resolution;

    switch (resolution.strategy) {
      case "local_wins":
        await this.applyLocalWins(conflict);
        break;
      case "server_wins":
        await this.applyServerWins(conflict);
        break;
      case "merge":
        await this.applyMerge(conflict, resolution.resolvedData);
        break;
      case "manual":
        // Wait for manual resolution
        break;
      default:
        throw new Error(`Unknown resolution strategy: ${resolution.strategy}`);
    }
  }

  private async applyLocalWins(conflict: Conflict): Promise<void> {
    // Keep local data, queue server update
    switch (conflict.type) {
      case "memorial":
        await offlineDb.saveMemorial(conflict.localData as Memorial);
        await actionQueue.queueAction(
          "update_memorial",
          conflict.localData as unknown as ActionPayload
        );
        break;
      case "tribute":
        await offlineDb.saveTribute(conflict.localData as Tribute);
        await actionQueue.queueAction(
          "update_tribute",
          conflict.localData as unknown as ActionPayload
        );
        break;
      case "gallery_item":
        await offlineDb.saveGalleryItem(conflict.localData as GalleryItem);
        await actionQueue.queueAction(
          "upload_media",
          conflict.localData as unknown as ActionPayload
        );
        break;
    }
  }

  private async applyServerWins(conflict: Conflict): Promise<void> {
    // Use server data
    switch (conflict.type) {
      case "memorial":
        await offlineDb.saveMemorial({
          ...(conflict.serverData as Memorial),
          syncStatus: "synced",
          syncedAt: new Date(),
        });
        break;
      case "tribute":
        await offlineDb.saveTribute({
          ...(conflict.serverData as Tribute),
          syncStatus: "synced",
          syncedAt: new Date(),
        });
        break;
      case "gallery_item":
        await offlineDb.saveGalleryItem({
          ...(conflict.serverData as GalleryItem),
          syncStatus: "synced",
          syncedAt: new Date(),
        });
        break;
    }
  }

  private async applyMerge(
    conflict: Conflict,
    resolvedData?: Memorial | Tribute | GalleryItem
  ): Promise<void> {
    if (!resolvedData) {
      throw new Error("Resolved data required for merge strategy");
    }

    // Save merged data
    switch (conflict.type) {
      case "memorial":
        await offlineDb.saveMemorial({
          ...(resolvedData as Memorial),
          syncStatus: "synced",
          syncedAt: new Date(),
        });
        await actionQueue.queueAction("update_memorial", resolvedData as unknown as ActionPayload);
        break;
      case "tribute":
        await offlineDb.saveTribute({
          ...(resolvedData as Tribute),
          syncStatus: "synced",
          syncedAt: new Date(),
        });
        await actionQueue.queueAction("update_tribute", resolvedData as unknown as ActionPayload);
        break;
      case "gallery_item":
        await offlineDb.saveGalleryItem({
          ...(resolvedData as GalleryItem),
          syncStatus: "synced",
          syncedAt: new Date(),
        });
        await actionQueue.queueAction("upload_media", resolvedData as unknown as ActionPayload);
        break;
    }
  }

  // Get all unresolved conflicts
  getUnresolvedConflicts(): Conflict[] {
    return this.conflicts.filter((c) => !c.resolution);
  }

  // Get all resolved conflicts
  getResolvedConflicts(): Conflict[] {
    return this.conflicts.filter((c) => c.resolution);
  }

  // Clear resolved conflicts older than specified days
  clearOldResolvedConflicts(daysOld: number = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    this.conflicts = this.conflicts.filter((conflict) => {
      if (!conflict.resolution) return true; // Keep unresolved
      return conflict.resolution.resolvedAt > cutoffDate; // Keep recent resolved
    });
  }

  // Auto-resolve conflicts based on rules
  async autoResolveConflicts(rules: {
    defaultStrategy: "local_wins" | "server_wins";
    memorialStrategy?: "local_wins" | "server_wins" | "merge";
    tributeStrategy?: "local_wins" | "server_wins" | "merge";
    galleryStrategy?: "local_wins" | "server_wins" | "merge";
  }): Promise<void> {
    const unresolvedConflicts = this.getUnresolvedConflicts();

    for (const conflict of unresolvedConflicts) {
      let strategy: "local_wins" | "server_wins" | "merge" = rules.defaultStrategy;

      // Apply type-specific strategy
      switch (conflict.type) {
        case "memorial":
          strategy = rules.memorialStrategy || strategy;
          break;
        case "tribute":
          strategy = rules.tributeStrategy || strategy;
          break;
        case "gallery_item":
          strategy = rules.galleryStrategy || strategy;
          break;
      }

      // For merge strategy, we need resolved data
      if (strategy === "merge") {
        const mergedData = this.mergeData(conflict.localData, conflict.serverData);
        await this.resolveConflict(conflict.id, {
          strategy: "merge",
          resolvedData: mergedData,
          resolvedAt: new Date(),
        });
      } else {
        await this.resolveConflict(conflict.id, {
          strategy,
          resolvedAt: new Date(),
        });
      }
    }
  }

  // Simple merge strategy for auto-resolution
  private mergeData(
    localData: Memorial | Tribute | GalleryItem,
    serverData: Memorial | Tribute | GalleryItem
  ): Memorial | Tribute | GalleryItem {
    // For now, prefer local data for user-generated content, server for metadata
    return {
      ...serverData, // Start with server data
      ...localData, // Override with local changes
      updatedAt: new Date(), // Mark as recently updated
      syncedAt: new Date(),
      syncStatus: "synced",
    };
  }
}

// Export singleton instance
export const conflictResolver = ConflictResolver.getInstance();
