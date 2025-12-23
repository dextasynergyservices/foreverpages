import * as React from "react";

export interface ToastProps {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface ToastActionElement {
  altText: string;
  action: () => void;
  label: React.ReactNode;
}

export interface ToastState {
  toasts: ToastProps[];
}

export const toast = {
  success: (props: ToastProps) => console.log("Success:", props),
  error: (props: ToastProps) => console.log("Error:", props),
  warning: (props: ToastProps) => console.log("Warning:", props),
  info: (props: ToastProps) => console.log("Info:", props),
};
