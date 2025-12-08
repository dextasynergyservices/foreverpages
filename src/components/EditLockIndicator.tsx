"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Lock, AlertTriangle } from "lucide-react";

interface EditLockIndicatorProps {
  isLocked: boolean;
  isLockedByMe: boolean;
  lockedBy: { userName: string; userRole: string } | null;
  onRequestEdit?: () => void;
  section: string;
}

export function EditLockIndicator({
  isLocked,
  isLockedByMe,
  lockedBy,
  onRequestEdit,
  section,
}: EditLockIndicatorProps) {
  if (!isLocked) {
    return null;
  }

  if (isLockedByMe) {
    return (
      <Alert className="border-green-300 bg-green-50">
        <Lock className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900">You&apos;re editing this section</AlertTitle>
        <AlertDescription className="text-green-800">
          Other collaborators can&apos;t edit the {section} section while you&apos;re working on it.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-yellow-300 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-900">Section locked</AlertTitle>
      <AlertDescription className="space-y-2">
        <p className="text-yellow-800">
          {lockedBy ? (
            <>
              <strong>{lockedBy.userName}</strong> ({lockedBy.userRole}) is currently editing the{" "}
              {section} section.
            </>
          ) : (
            <>This section is currently being edited by another user.</>
          )}
        </p>
        <p className="text-sm text-yellow-700">
          You&apos;ll be able to edit this section once they&apos;re done. The lock will
          automatically expire after 5 minutes of inactivity.
        </p>
        {onRequestEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRequestEdit}
            className="mt-2 border-yellow-300 hover:bg-yellow-100"
          >
            Try again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
