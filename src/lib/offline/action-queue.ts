import { offlineDb } from "./db";
import { OfflineAction } from "./db-schema";

export interface ActionPayload {
  [key: string]: unknown;
}

export interface QueuedAction {
  id: string;
  type: OfflineAction["type"];
  payload: ActionPayload;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export class OfflineActionQueue {
  private static instance: OfflineActionQueue | null = null;
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  static getInstance(): OfflineActionQueue {
    // Don't create instance during SSR
    if (typeof window === "undefined") {
      return new OfflineActionQueue();
    }

    if (!OfflineActionQueue.instance) {
      OfflineActionQueue.instance = new OfflineActionQueue();
    }
    return OfflineActionQueue.instance;
  }

  async queueAction(type: OfflineAction["type"], payload: ActionPayload): Promise<string> {
    const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const action: OfflineAction = {
      id: actionId,
      type,
      data: payload,
      createdAt: new Date(),
      status: "pending",
      retryCount: 0,
    };

    await offlineDb.queueAction(action);

    // Start processing if not already running
    this.startProcessing();

    return actionId;
  }

  async getQueuedActions(): Promise<OfflineAction[]> {
    return offlineDb.getPendingActions();
  }

  async retryAction(actionId: string): Promise<void> {
    const action = await offlineDb
      .getPendingActions()
      .then((actions) => actions.find((a) => a.id === actionId));

    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    if (action.retryCount >= 3) {
      await offlineDb.updateActionStatus(actionId, "failed", "Max retries exceeded");
      return;
    }

    // Reset status to pending for retry
    await offlineDb.updateActionStatus(actionId, "pending");
    this.startProcessing();
  }

  async cancelAction(actionId: string): Promise<void> {
    await offlineDb.deleteAction(actionId);
  }

  private startProcessing(): void {
    if (this.isProcessing || this.processingInterval) {
      return;
    }

    this.isProcessing = true;
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 5000); // Process every 5 seconds

    // Process immediately
    this.processQueue();
  }

  private stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
  }

  private async processQueue(): Promise<void> {
    try {
      const pendingActions = await offlineDb.getPendingActions();

      if (pendingActions.length === 0) {
        this.stopProcessing();
        return;
      }

      // Process actions in batches of 3 to avoid overwhelming the network
      const batchSize = 3;
      const actionsToProcess = pendingActions.slice(0, batchSize);

      const promises = actionsToProcess.map((action) => this.processAction(action));
      await Promise.allSettled(promises);
    } catch (error) {
      console.error("Error processing action queue:", error);
    }
  }

  private async processAction(action: OfflineAction): Promise<void> {
    try {
      await offlineDb.updateActionStatus(action.id, "processing");

      const success = await this.executeAction(action);

      if (success) {
        await offlineDb.updateActionStatus(action.id, "completed");
      } else {
        await this.handleActionFailure(action);
      }
    } catch (error) {
      console.error(`Error processing action ${action.id}:`, error);
      await this.handleActionFailure(
        action,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  private async executeAction(action: OfflineAction): Promise<boolean> {
    // This will be implemented when we integrate with the sync manager
    // For now, we'll simulate success/failure based on action type
    switch (action.type) {
      case "create_memorial":
      case "update_memorial":
      case "delete_memorial":
      case "create_tribute":
      case "update_tribute":
      case "delete_tribute":
      case "upload_media":
      case "delete_media":
        // Simulate network call - in real implementation, this would call the API
        return Math.random() > 0.2; // 80% success rate for simulation

      default:
        console.warn(`Unknown action type: ${action.type}`);
        return false;
    }
  }

  private async handleActionFailure(action: OfflineAction, error?: string): Promise<void> {
    action.retryCount++;

    if (action.retryCount >= 3) {
      await offlineDb.updateActionStatus(action.id, "failed", error);
    } else {
      // Reset to pending for retry
      await offlineDb.updateActionStatus(action.id, "pending");
    }
  }

  // Cleanup method
  destroy(): void {
    this.stopProcessing();
  }
}

// Export lazy singleton instance with SSR safety
let _actionQueue: OfflineActionQueue | null = null;
const getActionQueue = (): OfflineActionQueue => {
  if (typeof window === "undefined") {
    return new OfflineActionQueue();
  }
  if (!_actionQueue) {
    _actionQueue = OfflineActionQueue.getInstance();
  }
  return _actionQueue;
};

export const actionQueue = new Proxy({} as OfflineActionQueue, {
  get(target, prop) {
    const instance = getActionQueue();
    const value = (instance as unknown as Record<string, unknown>)[prop as string];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});
