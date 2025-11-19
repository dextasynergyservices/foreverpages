"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";

interface Stream {
  id: string;
  title: string;
  status: string;
}

interface DeleteStreamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stream: Stream | null;
  onSuccess: () => void;
}

const DeleteStreamDialog: React.FC<DeleteStreamDialogProps> = ({
  open,
  onOpenChange,
  stream,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!stream) return;

    try {
      setLoading(true);
      setError(null);

      // If the stream is currently live, end it first so the server allows deletion.
      const isLive = stream.status === "LIVE" || stream.status === "live";
      if (isLive) {
        const endRes = await fetch(`/api/streams/${stream.id}/end`, { method: "POST" });
        if (!endRes.ok) {
          const err = await endRes.json().catch(() => ({}));
          throw new Error(err?.error || "Failed to end live stream before deletion");
        }
      }

      const response = await fetch(`/api/streams/${stream.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete stream");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to delete stream:", err);
      setError(err instanceof Error ? err.message : "Failed to delete stream");
    } finally {
      setLoading(false);
    }
  };

  if (!stream) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-destructive/10 p-2 rounded-full">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle>Delete Livestream?</DialogTitle>
              <DialogDescription className="mt-1">This action cannot be undone.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">You are about to delete the livestream:</p>
          <div className="bg-muted rounded-lg p-3">
            <p className="font-medium">{stream.title}</p>
            <p className="text-sm text-muted-foreground mt-1">Status: {stream.status}</p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Warning:</strong> This will permanently delete:
            </p>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 ml-4 list-disc space-y-1">
              <li>Stream configuration and settings</li>
              <li>All viewer data and analytics</li>
              <li>Chat messages and reactions</li>
              <li>Recordings (if any)</li>
            </ul>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete Stream
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteStreamDialog;
