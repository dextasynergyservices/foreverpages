"use client";

import { useState } from "react";
import { CollaboratorPresence } from "@/components/CollaboratorPresence";
import { ActivityFeed } from "@/components/ActivityFeed";
import { EditLockIndicator } from "@/components/EditLockIndicator";
import { usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat";
import { useEditLock } from "@/hooks/useEditLock";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textArea";

interface MemorialCollaborationExampleProps {
  memorialId: string;
  currentUserId: string;
  section: string; // e.g., "biography", "timeline", "gallery"
}

/**
 * Example component showing how to integrate all collaboration features
 * This demonstrates the complete flow of:
 * 1. Presence tracking
 * 2. Edit locking
 * 3. Activity logging
 * 4. Activity feed
 */
export default function MemorialCollaborationExample({
  memorialId,
  currentUserId,
  section,
}: MemorialCollaborationExampleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState("");

  // Track user presence on this page
  usePresenceHeartbeat({
    memorialId,
    section,
    isEditing,
    enabled: true,
  });

  // Manage edit lock for this section
  const {
    isLocked,
    isLockedByMe,
    lockedBy,
    acquireLock,
    releaseLock,
    checkLock,
    loading: lockLoading,
  } = useEditLock({
    memorialId,
    section,
    enabled: true,
  });

  const handleStartEditing = async () => {
    const success = await acquireLock();
    if (success) {
      setIsEditing(true);
    }
  };

  const handleCancelEdit = async () => {
    await releaseLock();
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      // Save the content via API
      const response = await fetch(`/api/memorials/${memorialId}/${section}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      // Log the activity
      await fetch(`/api/memorials/${memorialId}/activity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "UPDATED",
          entityType: "SECTION",
          entityId: section,
          section,
          description: `Updated ${section} content`,
          changes: {
            section,
            updated: new Date().toISOString(),
          },
        }),
      });

      // Release lock and exit edit mode
      await releaseLock();
      setIsEditing(false);

      console.log("Changes saved successfully");
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with presence indicators */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Memorial - {section}</h1>
        <CollaboratorPresence
          memorialId={memorialId}
          currentUserId={currentUserId}
          refreshInterval={10000}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Edit lock indicator */}
          {isLocked && !isEditing && (
            <EditLockIndicator
              isLocked={isLocked}
              isLockedByMe={isLockedByMe}
              lockedBy={lockedBy}
              onRequestEdit={checkLock}
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

          {/* Content editor */}
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? `Editing ${section}` : section}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={`Enter ${section} content...`}
                    rows={10}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSave}>Save Changes</Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="prose max-w-none">
                    {content || "No content yet. Click Edit to add content."}
                  </div>
                  <Button
                    onClick={handleStartEditing}
                    disabled={lockLoading || (isLocked && !isLockedByMe)}
                  >
                    {lockLoading ? "Checking..." : "Edit"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity feed sidebar */}
        <div className="lg:col-span-1">
          <ActivityFeed
            memorialId={memorialId}
            limit={20}
            section={section}
            refreshInterval={30000}
          />
        </div>
      </div>
    </div>
  );
}
