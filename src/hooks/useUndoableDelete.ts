"use client";

import { useState, useCallback } from "react";

interface UndoableItem<T> {
  id: string;
  data: T;
  deletedAt: number;
  type: "single" | "bulk";
}

/**
 * Custom hook for managing undoable deletions
 * Stores deleted items temporarily and allows restoration
 */
export function useUndoableDelete<T extends { id: string }>(
  ttl: number = 30000 // Time to live: 30 seconds
) {
  const [deletedItems, setDeletedItems] = useState<Map<string, UndoableItem<T>>>(new Map());

  // Add item to deleted items store
  const markAsDeleted = useCallback(
    (item: T | T[], type: "single" | "bulk" = "single") => {
      const now = Date.now();
      const items = Array.isArray(item) ? item : [item];

      setDeletedItems((prev) => {
        const next = new Map(prev);
        items.forEach((it) => {
          next.set(it.id, {
            id: it.id,
            data: it,
            deletedAt: now,
            type,
          });
        });
        return next;
      });

      // Auto-cleanup after TTL
      setTimeout(() => {
        setDeletedItems((prev) => {
          const next = new Map(prev);
          items.forEach((it) => {
            const deleted = next.get(it.id);
            if (deleted && now - deleted.deletedAt >= ttl) {
              next.delete(it.id);
            }
          });
          return next;
        });
      }, ttl);

      return items.map((it) => it.id);
    },
    [ttl]
  );

  // Restore deleted item(s)
  const undoDelete = useCallback((itemId: string | string[]) => {
    const ids = Array.isArray(itemId) ? itemId : [itemId];
    const restoredItems: T[] = [];

    setDeletedItems((prev) => {
      const next = new Map(prev);
      ids.forEach((id) => {
        const item = next.get(id);
        if (item) {
          restoredItems.push(item.data);
          next.delete(id);
        }
      });
      return next;
    });

    return restoredItems;
  }, []);

  // Check if item can be undone
  const canUndo = useCallback(
    (itemId: string) => {
      const item = deletedItems.get(itemId);
      if (!item) return false;
      return Date.now() - item.deletedAt < ttl;
    },
    [deletedItems, ttl]
  );

  // Get all items that can be undone
  const undoableItems = useCallback(() => {
    const now = Date.now();
    return Array.from(deletedItems.values()).filter((item) => now - item.deletedAt < ttl);
  }, [deletedItems, ttl]);

  // Clear all deleted items
  const clearDeleted = useCallback(() => {
    setDeletedItems(new Map());
  }, []);

  return {
    markAsDeleted,
    undoDelete,
    canUndo,
    undoableItems,
    clearDeleted,
  };
}
