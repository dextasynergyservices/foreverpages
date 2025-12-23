"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/useTranslations";
import { AlertTriangle, Trash2, AlertCircle, X } from "lucide-react";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  icon?: React.ReactNode;
  disabled?: boolean;
}

/**
 * Reusable confirmation dialog component
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = "warning",
  icon,
  disabled = false,
}) => {
  const { t } = useTranslations();

  const defaultIcon = {
    danger: <Trash2 className="h-6 w-6 text-red-600" />,
    warning: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
    info: <AlertCircle className="h-6 w-6 text-blue-600" />,
  };

  const buttonVariant = variant === "danger" ? "destructive" : "default";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {icon || defaultIcon[variant]}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={disabled}>
            {cancelText || t("common.cancel", {}, "Cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={disabled}
            className={buttonVariant === "destructive" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {confirmText || t("common.confirm", {}, "Confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

/**
 * Hook to manage confirmation dialog state
 */
export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<Omit<ConfirmDialogProps, "open" | "onOpenChange">>({
    onConfirm: () => {},
    title: "",
    description: "",
  });

  const confirm = React.useCallback(
    (newConfig: Omit<ConfirmDialogProps, "open" | "onOpenChange">) => {
      setConfig(newConfig);
      setIsOpen(true);
    },
    []
  );

  const handleConfirm = React.useCallback(() => {
    config.onConfirm();
    setIsOpen(false);
  }, [config]);

  const handleCancel = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const dialog = (
    <ConfirmDialog open={isOpen} onOpenChange={setIsOpen} {...config} onConfirm={handleConfirm} />
  );

  return { confirm, dialog, isOpen, close: handleCancel };
};
