export interface Memorial {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
  syncStatus: "synced" | "pending" | "failed";
}

export interface Tribute {
  id: string;
  memorialId: string;
  message: string;
  status: "pending" | "approved" | "rejected" | "flagged";
  author: {
    name: string | null;
    email: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
  syncStatus: "synced" | "pending" | "failed";
}

export interface GalleryItem {
  id: string;
  memorialId: string;
  url: string;
  title: string;
  type: "image" | "video";
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
  syncStatus: "synced" | "pending" | "failed";
}

export interface OfflineAction {
  id: string;
  type:
    | "create_memorial"
    | "update_memorial"
    | "delete_memorial"
    | "create_tribute"
    | "update_tribute"
    | "delete_tribute"
    | "upload_media"
    | "delete_media";
  data: Record<string, unknown>;
  createdAt: Date;
  retryCount: number;
  lastError?: string;
  status: "pending" | "processing" | "completed" | "failed";
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  syncedAt?: Date;
  syncStatus: "synced" | "pending" | "failed";
}

export const DB_CONFIG = {
  name: "ForeverPagesDB",
  version: 1,
  stores: {
    memorials: "memorials",
    tributes: "tributes",
    gallery: "gallery",
    offlineActions: "offlineActions",
    userProfile: "userProfile",
  },
} as const;
