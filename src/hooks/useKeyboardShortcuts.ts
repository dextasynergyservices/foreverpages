"use client";

import { useEffect, useCallback, useRef } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  preventDefault?: boolean;
}

/**
 * Hook to manage keyboard shortcuts
 * @param shortcuts - Array of keyboard shortcuts to register
 * @param enabled - Whether shortcuts are enabled (default: true)
 */
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[], enabled: boolean = true) => {
  const shortcutsRef = useRef(shortcuts);

  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true"
      ) {
        // Allow Escape key even in inputs
        if (event.key !== "Escape") return;
      }

      shortcutsRef.current.forEach((shortcut) => {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;
        const metaMatches = shortcut.meta ? event.metaKey : true;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
        }
      });
    },
    [enabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};

/**
 * Hook for common editor shortcuts
 */
export const useEditorShortcuts = (options: {
  onSave?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}) => {
  const shortcuts: KeyboardShortcut[] = [];

  if (options.onSave) {
    shortcuts.push({
      key: "s",
      ctrl: true,
      description: "Save",
      action: options.onSave,
    });
  }

  if (options.onEscape) {
    shortcuts.push({
      key: "Escape",
      description: "Close/Cancel",
      action: options.onEscape,
      preventDefault: false,
    });
  }

  useKeyboardShortcuts(shortcuts, options.enabled ?? true);
};

/**
 * Format shortcut for display (e.g., "Ctrl+S", "Escape")
 */
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];
  const isMac =
    typeof navigator !== "undefined" && navigator.platform.toUpperCase().includes("MAC");

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(isMac ? "⌘" : "Ctrl");
  }
  if (shortcut.shift) {
    parts.push("Shift");
  }
  if (shortcut.alt) {
    parts.push(isMac ? "⌥" : "Alt");
  }
  parts.push(shortcut.key.toUpperCase());

  return parts.join("+");
};
