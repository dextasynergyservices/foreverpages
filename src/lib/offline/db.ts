import { DB_CONFIG, Memorial, Tribute, GalleryItem, OfflineAction, UserProfile } from "./db-schema";

class OfflineDatabase {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  async open(): Promise<IDBDatabase> {
    // SSR safety check
    if (typeof window === "undefined" || typeof indexedDB === "undefined") {
      throw new Error("IndexedDB is not available in this environment");
    }

    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(DB_CONFIG.stores.memorials)) {
          const memorialStore = db.createObjectStore(DB_CONFIG.stores.memorials, { keyPath: "id" });
          memorialStore.createIndex("createdBy", "createdBy", { unique: false });
          memorialStore.createIndex("syncStatus", "syncStatus", { unique: false });
        }

        if (!db.objectStoreNames.contains(DB_CONFIG.stores.tributes)) {
          const tributeStore = db.createObjectStore(DB_CONFIG.stores.tributes, { keyPath: "id" });
          tributeStore.createIndex("memorialId", "memorialId", { unique: false });
          tributeStore.createIndex("syncStatus", "syncStatus", { unique: false });
        }

        if (!db.objectStoreNames.contains(DB_CONFIG.stores.gallery)) {
          const galleryStore = db.createObjectStore(DB_CONFIG.stores.gallery, { keyPath: "id" });
          galleryStore.createIndex("memorialId", "memorialId", { unique: false });
          galleryStore.createIndex("syncStatus", "syncStatus", { unique: false });
        }

        if (!db.objectStoreNames.contains(DB_CONFIG.stores.offlineActions)) {
          const actionStore = db.createObjectStore(DB_CONFIG.stores.offlineActions, {
            keyPath: "id",
          });
          actionStore.createIndex("status", "status", { unique: false });
          actionStore.createIndex("type", "type", { unique: false });
        }

        if (!db.objectStoreNames.contains(DB_CONFIG.stores.userProfile)) {
          db.createObjectStore(DB_CONFIG.stores.userProfile, { keyPath: "id" });
        }
      };
    });

    this.db = await this.dbPromise;
    return this.db;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.dbPromise = null;
    }
  }

  // Memorial operations
  async saveMemorial(memorial: Memorial): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction([DB_CONFIG.stores.memorials], "readwrite");
    const store = transaction.objectStore(DB_CONFIG.stores.memorials);
    await this.promisifyRequest(store.put(memorial));
  }

  async getMemorial(id: string): Promise<Memorial | null> {
    const db = await this.open();
    const transaction = db.transaction([DB_CONFIG.stores.memorials], "readonly");
    const store = transaction.objectStore(DB_CONFIG.stores.memorials);
    return this.promisifyRequest(store.get(id));
  }

  async getAllMemorials(): Promise<Memorial[]> {
    const db = await this.open();
    const transaction = db.transaction([DB_CONFIG.stores.memorials], "readonly");
    const store = transaction.objectStore(DB_CONFIG.stores.memorials);
    return this.promisifyRequest(store.getAll());
  }

  async deleteMemorial(id: string): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction([DB_CONFIG.stores.memorials], "readwrite");
    const store = transaction.objectStore(DB_CONFIG.stores.memorials);
    await this.promisifyRequest(store.delete(id));
  }

  // Tribute operations
  async saveTribute(tribute: Tribute): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction([DB_CONFIG.stores.tributes], "readwrite");
    const store = transaction.objectStore(DB_CONFIG.stores.tributes);
    await this.promisifyRequest(store.put(tribute));
  }

  async getTributesByMemorial(memorialId: string): Promise<Tribute[]> {
    const db = await this.open();
    const transaction = db.transaction([DB_CONFIG.stores.tributes], "readonly");
    const store = transaction.objectStore(DB_CONFIG.stores.tributes);
    const index = store.index("memorialId");
    return this.promisifyRequest(index.getAll(memorialId));
  }

  // Gallery operations
  async saveGalleryItem(item: GalleryItem): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction([DB_CONFIG.stores.gallery], "readwrite");
    const store = transaction.objectStore(DB_CONFIG.stores.gallery);
    await this.promisifyRequest(store.put(item));
  }

  async getGalleryItemsByMemorial(memorialId: string): Promise<GalleryItem[]> {
    const db = await this.open();
    const transaction = db.transaction([DB_CONFIG.stores.gallery], "readonly");
    const store = transaction.objectStore(DB_CONFIG.stores.gallery);
    const index = store.index("memorialId");
    return this.promisifyRequest(index.getAll(memorialId));
  }

  // Offline actions
  async queueAction(action: OfflineAction): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction([DB_CONFIG.stores.offlineActions], "readwrite");
    const store = transaction.objectStore(DB_CONFIG.stores.offlineActions);
    await this.promisifyRequest(store.put(action));
  }

  async getPendingActions(): Promise<OfflineAction[]> {
    const db = await this.open();
    const transaction = db.transaction([DB_CONFIG.stores.offlineActions], "readonly");
    const store = transaction.objectStore(DB_CONFIG.stores.offlineActions);
    const index = store.index("status");
    return this.promisifyRequest(index.getAll("pending"));
  }

  async updateActionStatus(
    id: string,
    status: OfflineAction["status"],
    lastError?: string
  ): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction([DB_CONFIG.stores.offlineActions], "readwrite");
    const store = transaction.objectStore(DB_CONFIG.stores.offlineActions);

    const action = await this.promisifyRequest(store.get(id));
    if (action) {
      action.status = status;
      if (lastError) action.lastError = lastError;
      if (status === "completed") action.retryCount = 0;
      await this.promisifyRequest(store.put(action));
    }
  }

  async deleteAction(id: string): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction([DB_CONFIG.stores.offlineActions], "readwrite");
    const store = transaction.objectStore(DB_CONFIG.stores.offlineActions);
    await this.promisifyRequest(store.delete(id));
  }

  // User profile operations
  async saveUserProfile(profile: UserProfile): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction([DB_CONFIG.stores.userProfile], "readwrite");
    const store = transaction.objectStore(DB_CONFIG.stores.userProfile);
    await this.promisifyRequest(store.put(profile));
  }

  async getUserProfile(): Promise<UserProfile | null> {
    const db = await this.open();
    const transaction = db.transaction([DB_CONFIG.stores.userProfile], "readonly");
    const store = transaction.objectStore(DB_CONFIG.stores.userProfile);
    const profiles = await this.promisifyRequest(store.getAll());
    return profiles.length > 0 ? profiles[0] : null;
  }

  // Utility method to promisify IndexedDB requests
  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all data (useful for testing or reset)
  async clearAllData(): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction(
      [
        DB_CONFIG.stores.memorials,
        DB_CONFIG.stores.tributes,
        DB_CONFIG.stores.gallery,
        DB_CONFIG.stores.offlineActions,
        DB_CONFIG.stores.userProfile,
      ],
      "readwrite"
    );

    await Promise.all([
      this.promisifyRequest(transaction.objectStore(DB_CONFIG.stores.memorials).clear()),
      this.promisifyRequest(transaction.objectStore(DB_CONFIG.stores.tributes).clear()),
      this.promisifyRequest(transaction.objectStore(DB_CONFIG.stores.gallery).clear()),
      this.promisifyRequest(transaction.objectStore(DB_CONFIG.stores.offlineActions).clear()),
      this.promisifyRequest(transaction.objectStore(DB_CONFIG.stores.userProfile).clear()),
    ]);
  }
}

// Export lazy singleton instance with SSR safety
let _offlineDb: OfflineDatabase | null = null;
const getOfflineDb = (): OfflineDatabase => {
  if (typeof window === "undefined") {
    // Return a mock instance during SSR
    return new OfflineDatabase();
  }
  if (!_offlineDb) {
    _offlineDb = new OfflineDatabase();
  }
  return _offlineDb;
};

export const offlineDb = new Proxy({} as OfflineDatabase, {
  get(target, prop) {
    const instance = getOfflineDb();
    const value = (instance as unknown as Record<string, unknown>)[prop as string];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});
