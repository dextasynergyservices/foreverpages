"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

interface ConflictDetails {
  clientVersion: number;
  serverVersion: number;
  lastEditedBy: string;
  lastEditedAt: string;
}

interface ConflictResolutionDialogProps {
  open: boolean;
  onClose: () => void;
  conflict: ConflictDetails;
  localChanges: Record<string, unknown>;
  serverData?: Record<string, unknown>;
  onResolve: (resolution: "overwrite" | "discard" | "merge") => void;
}

function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
  return then.toLocaleDateString();
}

export function ConflictResolutionDialog({
  open,
  onClose,
  conflict,
  localChanges,
  serverData,
  onResolve,
}: ConflictResolutionDialogProps) {
  const [selectedResolution, setSelectedResolution] = useState<"overwrite" | "discard" | "merge">(
    "discard"
  );

  const handleResolve = () => {
    onResolve(selectedResolution);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Conflict Detected
          </DialogTitle>
          <DialogDescription>
            Someone else has modified this memorial while you were editing. Please choose how to
            resolve this conflict.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-yellow-300 bg-yellow-50">
            <AlertTitle className="text-yellow-900">What happened?</AlertTitle>
            <AlertDescription className="text-yellow-800">
              <strong>{conflict.lastEditedBy || "Another user"}</strong> made changes{" "}
              {formatTimeAgo(conflict.lastEditedAt)}. Their version (v{conflict.serverVersion}) is
              newer than yours (v
              {conflict.clientVersion}).
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <p className="text-sm font-medium">Choose how to resolve:</p>

            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                <input
                  type="radio"
                  name="resolution"
                  value="discard"
                  checked={selectedResolution === "discard"}
                  onChange={() => setSelectedResolution("discard")}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium">Discard my changes</div>
                  <div className="text-sm text-muted-foreground">
                    Keep their version and discard your unsaved changes.{" "}
                    <strong>Recommended</strong> if their changes are more important.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                <input
                  type="radio"
                  name="resolution"
                  value="overwrite"
                  checked={selectedResolution === "overwrite"}
                  onChange={() => setSelectedResolution("overwrite")}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium">Overwrite with my changes</div>
                  <div className="text-sm text-muted-foreground">
                    Replace their changes with your version. <strong>Warning:</strong> This will
                    overwrite their work.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent opacity-50">
                <input type="radio" name="resolution" value="merge" disabled className="mt-1" />
                <div className="flex-1">
                  <div className="font-medium">Merge changes (Coming soon)</div>
                  <div className="text-sm text-muted-foreground">
                    Combine both versions intelligently. This feature is not yet available.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {serverData && localChanges && (
            <details className="border rounded-lg p-3">
              <summary className="cursor-pointer font-medium text-sm">
                View detailed changes
              </summary>
              <div className="mt-3 space-y-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Your changes:</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(localChanges, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Server version:</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(serverData, null, 2)}
                  </pre>
                </div>
              </div>
            </details>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleResolve}
            variant={selectedResolution === "overwrite" ? "destructive" : "default"}
          >
            {selectedResolution === "overwrite" && "Force "}
            {selectedResolution === "discard" && "Discard My Changes"}
            {selectedResolution === "overwrite" && "Overwrite Their Changes"}
            {selectedResolution === "merge" && "Merge Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
