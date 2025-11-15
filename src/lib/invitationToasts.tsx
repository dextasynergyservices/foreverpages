import { toast } from "react-hot-toast";
import React from "react";

interface ToastOptions {
  duration?: number;
  icon?: React.ReactNode;
  onUndo?: () => void | Promise<void>;
}

/**
 * Centralized toast notification system for all invitation actions
 * Provides consistent styling and behavior across the application
 */

// Success toasts
export const invitationToasts = {
  // Creation & Sending
  created: (guestName?: string, options?: ToastOptions) =>
    toast.success(guestName ? `Invitation sent to ${guestName}` : "Invitation sent successfully", {
      duration: options?.duration || 4000,
    }),

  scheduled: (guestName: string, scheduledDate: Date, options?: ToastOptions) =>
    toast.success(`Invitation to ${guestName} scheduled for ${scheduledDate.toLocaleString()}`, {
      duration: options?.duration || 5000,
    }),

  bulkSent: (count: number, options?: ToastOptions) =>
    toast.success(`${count} invitation${count > 1 ? "s" : ""} sent successfully`, {
      duration: options?.duration || 4000,
    }),

  // Deletion with undo
  deleted: (guestName?: string, options?: ToastOptions) =>
    toast.success(guestName ? `Invitation to ${guestName} deleted` : "Invitation deleted", {
      duration: options?.duration || 6000,
    }),

  bulkDeleted: (count: number, options?: ToastOptions) =>
    toast.success(`${count} invitation${count > 1 ? "s" : ""} deleted`, {
      duration: options?.duration || 6000,
    }),

  // Resend
  resent: (guestName?: string, options?: ToastOptions) =>
    toast.success(
      guestName ? `Invitation resent to ${guestName}` : "Invitation resent successfully",
      {
        duration: options?.duration || 4000,
      }
    ),

  // Updates
  updated: (guestName?: string, options?: ToastOptions) =>
    toast.success(
      guestName ? `Invitation to ${guestName} updated` : "Invitation updated successfully",
      {
        duration: options?.duration || 3000,
      }
    ),

  // Guest management
  guestUpdated: (guestName: string, options?: ToastOptions) =>
    toast.success(`Guest details updated for ${guestName}`, {
      duration: options?.duration || 3000,
    }),

  // Export
  exported: (format: "CSV" | "PDF", options?: ToastOptions) =>
    toast.success(`Invitations exported as ${format}`, {
      duration: options?.duration || 3000,
    }),

  // Templates
  templateSelected: (templateName: string, options?: ToastOptions) =>
    toast.success(`${templateName} template selected`, {
      duration: options?.duration || 2000,
    }),
};

// Error toasts
export const invitationErrors = {
  sendFailed: (guestName?: string, error?: string) =>
    toast.error(
      guestName
        ? `Failed to send invitation to ${guestName}${error ? `: ${error}` : ""}`
        : `Failed to send invitation${error ? `: ${error}` : ""}`,
      {
        duration: 5000,
      }
    ),

  deleteFailed: (guestName?: string) =>
    toast.error(
      guestName ? `Failed to delete invitation to ${guestName}` : "Failed to delete invitation",
      {
        duration: 5000,
      }
    ),

  updateFailed: (guestName?: string) =>
    toast.error(
      guestName ? `Failed to update invitation to ${guestName}` : "Failed to update invitation",
      {
        duration: 5000,
      }
    ),

  exportFailed: (format: string) =>
    toast.error(`Failed to export as ${format}`, {
      duration: 5000,
    }),

  validationFailed: (message: string) =>
    toast.error(message, {
      duration: 5000,
    }),

  networkError: () =>
    toast.error("Network error. Please check your connection.", {
      duration: 5000,
    }),
};

// Info toasts
export const invitationInfo = {
  loading: (message: string) => toast.loading(message),

  schedulingInfo: () =>
    toast("Invitation will be sent at the scheduled time", {
      duration: 4000,
    }),

  remindersEnabled: (days: number[]) =>
    toast(
      `Reminders will be sent ${days.join(", ")} day${days.length > 1 ? "s" : ""} before the service`,
      {
        duration: 4000,
      }
    ),

  pollingEnabled: () =>
    toast.success("Real-time updates enabled", {
      duration: 2000,
    }),

  pollingDisabled: () =>
    toast("Real-time updates paused", {
      duration: 2000,
    }),
};

// Utility for dismissing all toasts
export const dismissAllToasts = () => toast.dismiss();

// Utility for promise-based toasts (for async operations)
export const invitationPromiseToast = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  }
) => {
  return toast.promise(promise, messages);
};
