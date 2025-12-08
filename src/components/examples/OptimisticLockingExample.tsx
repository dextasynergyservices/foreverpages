"use client";

import { useState, useEffect } from "react";
import { CollaboratorPresence } from "@/components/CollaboratorPresence";
import { ActivityFeed } from "@/components/ActivityFeed";
import { EditLockIndicator } from "@/components/EditLockIndicator";
import { ConflictResolutionDialog } from "@/components/ConflictResolutionDialog";
import { usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat";
import { useEditLock } from "@/hooks/useEditLock";
import { useOptimisticUpdate } from "@/hooks/useOptimisticUpdate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textArea";

interface Memorial {
  id: string;
  biography: string;
  version: number;
  lastEditedBy: string | null;
  lastEditedAt: string;
}

interface OptimisticLockingExampleProps {
  memorialId: string;
  currentUserId: string;
  section: string;
}

/**
 * Complete example showing all collaboration features including optimistic locking
 */
export default function OptimisticLockingExample({
  memorialId,
  currentUserId,
  section,
}: OptimisticLockingExampleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [localContent, setLocalContent] = useState("");
  const [localChanges, setLocalChanges] = useState<Record<string, unknown> | null>(null);

  // Track presence
  usePresenceHeartbeat({
    memorialId,
    section,
    isEditing,
    enabled: true,
  });

  // Manage edit lock
  const { isLocked, isLockedByMe, lockedBy, acquireLock, releaseLock } = useEditLock({
    memorialId,
    section,
    enabled: true,
  });

  // Optimistic locking
  const { updateMemorial, loading, conflict, clearConflict } = useOptimisticUpdate<Memorial>({
    memorialId,
    onConflict: (conflictData) => {
      console.log("Conflict detected:", conflictData);
      // Dialog will show automatically via conflict state
    },
    onSuccess: (updated) => {
      console.log("Memorial updated successfully:", updated);
      setMemorial(updated);
      setLocalChanges(null);
    },
  });

  // Fetch initial memorial data
  useEffect(() => {
    const fetchMemorial = async () => {
      try {
        const response = await fetch(`/api/memorials/${memorialId}`);
        if (response.ok) {
          const data = await response.json();
          setMemorial(data);
          setLocalContent(data.biography || "");
        }
      } catch (error) {
        console.error("Failed to fetch memorial:", error);
      }
    };

    fetchMemorial();
  }, [memorialId]);

  const handleStartEditing = async () => {
    const success = await acquireLock();
    if (success && memorial) {
      setIsEditing(true);
      setLocalContent(memorial.biography || "");
    }
  };

  const handleCancelEdit = async () => {
    await releaseLock();
    setIsEditing(false);
    setLocalContent(memorial?.biography || "");
    setLocalChanges(null);
  };

  const handleSave = async () => {
    if (!memorial) return;

    const changes = {
      biography: localContent,
    };

    setLocalChanges(changes);

    const result = await updateMemorial(changes, memorial.version);

    if (result) {
      // Success - update was applied
      await releaseLock();
      setIsEditing(false);

      // Log activity
      await fetch(`/api/memorials/${memorialId}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATED",
          entityType: "SECTION",
          entityId: section,
          section,
          description: `Updated ${section} content`,
          changes: { section, updated: new Date().toISOString() },
        }),
      });
    }
    // If conflict, the dialog will show via the conflict state
  };

  const handleConflictResolution = async (resolution: "overwrite" | "discard" | "merge") => {
    if (!memorial || !conflict) return;

    if (resolution === "discard") {
      // Refresh memorial from server
      const response = await fetch(`/api/memorials/${memorialId}`);
      if (response.ok) {
        const fresh = await response.json();
        setMemorial(fresh);
        setLocalContent(fresh.biography || "");
        setLocalChanges(null);
      }
      clearConflict();
      await handleCancelEdit();
    } else if (resolution === "overwrite") {
      // Force update with server version
      if (conflict.details.serverVersion && localChanges) {
        const result = await updateMemorial(localChanges, conflict.details.serverVersion);
        if (result) {
          clearConflict();
          await releaseLock();
          setIsEditing(false);
        }
      }
    }
  };

  if (!memorial) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with presence */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Memorial - {section}</h1>
          <p className="text-sm text-muted-foreground">
            Version {memorial.version} • Last edited{" "}
            {new Date(memorial.lastEditedAt).toLocaleString()}
          </p>
        </div>
        <CollaboratorPresence memorialId={memorialId} currentUserId={currentUserId} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Lock indicator */}
          {isLocked && !isEditing && (
            <EditLockIndicator
              isLocked={isLocked}
              isLockedByMe={isLockedByMe}
              lockedBy={lockedBy}
              section={section}
            />
          )}

          {isEditing && isLockedByMe && (
            <EditLockIndicator
              isLocked={true}
              isLockedByMe={true}
              lockedBy={null}
              section={section}
            />
          )}

          {/* Editor */}
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? `Editing ${section}` : section}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <Textarea
                    value={localContent}
                    onChange={(e) => setLocalContent(e.target.value)}
                    placeholder={`Enter ${section} content...`}
                    rows={10}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={loading}>
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit} disabled={loading}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="prose max-w-none">
                    {memorial.biography || "No content yet. Click Edit to add content."}
                  </div>
                  <Button onClick={handleStartEditing} disabled={isLocked && !isLockedByMe}>
                    Edit
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity sidebar */}
        <div className="lg:col-span-1">
          <ActivityFeed memorialId={memorialId} section={section} limit={20} />
        </div>
      </div>

      {/* Conflict resolution dialog */}
      {conflict && localChanges && (
        <ConflictResolutionDialog
          open={!!conflict}
          onClose={clearConflict}
          conflict={conflict.details}
          localChanges={localChanges}
          serverData={memorial as unknown as Record<string, unknown>}
          onResolve={handleConflictResolution}
        />
      )}
    </div>
  );
}
