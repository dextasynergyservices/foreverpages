import React from "react";
import { Button } from "@/components/ui/button";
import { MdDelete, MdRefresh, MdClose, MdCheckCircle } from "react-icons/md";

interface BulkActionBarProps {
  selectedCount: number;
  onBulkResend: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  isProcessing?: boolean;
  t: (key: string, params?: unknown, fallback?: string) => string;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onBulkResend,
  onBulkDelete,
  onClearSelection,
  isProcessing = false,
  t,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4 flex items-center gap-4 border-2 border-primary-foreground/20">
        {/* Selection Count */}
        <div className="flex items-center gap-2">
          <MdCheckCircle className="h-5 w-5" />
          <span className="font-semibold">
            {selectedCount} {t("dashboard.invitations.bulk.selected", {}, "selected")}
          </span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-primary-foreground/30" />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onBulkResend}
            disabled={isProcessing}
            className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
          >
            <MdRefresh className="h-4 w-4 mr-2" />
            {t("dashboard.invitations.bulk.resend", {}, "Resend")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onBulkDelete}
            disabled={isProcessing}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            <MdDelete className="h-4 w-4 mr-2" />
            {t("dashboard.invitations.bulk.delete", {}, "Delete")}
          </Button>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-primary-foreground/30" />

        {/* Clear Selection */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={isProcessing}
          className="hover:bg-primary-foreground/10 text-primary-foreground"
        >
          <MdClose className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
