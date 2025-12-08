"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil, Eye } from "lucide-react";
import type { MemorialRole } from "@/generated/prisma";

interface CollaboratorPresenceData {
  userId: string;
  userName: string;
  userRole: MemorialRole;
  section: string | null;
  isEditing: boolean;
  lastSeen: Date;
}

interface CollaboratorPresenceProps {
  memorialId: string;
  currentUserId: string;
  refreshInterval?: number; // milliseconds, default 10000 (10 seconds)
}

const ROLE_COLORS: Record<MemorialRole, string> = {
  OWNER: "bg-purple-100 text-purple-800 border-purple-300",
  ADMIN: "bg-blue-100 text-blue-800 border-blue-300",
  EDITOR: "bg-green-100 text-green-800 border-green-300",
  CONTRIBUTOR: "bg-yellow-100 text-yellow-800 border-yellow-300",
  VIEWER: "bg-gray-100 text-gray-800 border-gray-300",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CollaboratorPresence({
  memorialId,
  currentUserId,
  refreshInterval = 10000,
}: CollaboratorPresenceProps) {
  const [collaborators, setCollaborators] = useState<CollaboratorPresenceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPresence = async () => {
      try {
        const response = await fetch(`/api/memorials/${memorialId}/presence`);

        if (!response.ok) {
          throw new Error("Failed to fetch presence data");
        }

        const data = await response.json();

        if (isMounted) {
          // Filter out current user and sort by edit status
          const filtered = data
            .filter((c: CollaboratorPresenceData) => c.userId !== currentUserId)
            .sort((a: CollaboratorPresenceData, b: CollaboratorPresenceData) => {
              // Editors first
              if (a.isEditing && !b.isEditing) return -1;
              if (!a.isEditing && b.isEditing) return 1;
              return 0;
            });

          setCollaborators(filtered);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchPresence();

    // Set up polling
    const interval = setInterval(fetchPresence, refreshInterval);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [memorialId, currentUserId, refreshInterval]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        Loading collaborators...
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-destructive">Failed to load collaborators</div>;
  }

  if (collaborators.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Eye className="h-4 w-4" />
        You&apos;re the only one here
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Active now:</span>
        <div className="flex -space-x-2">
          {collaborators.slice(0, 5).map((collaborator) => (
            <Tooltip key={collaborator.userId}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarImage
                      src={`/api/avatar/${collaborator.userId}`}
                      alt={collaborator.userName}
                    />
                    <AvatarFallback className={ROLE_COLORS[collaborator.userRole]}>
                      {getInitials(collaborator.userName)}
                    </AvatarFallback>
                  </Avatar>
                  {collaborator.isEditing && (
                    <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 border-2 border-background">
                      <Pencil className="h-2 w-2 text-white" />
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1">
                  <div className="font-semibold">{collaborator.userName}</div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${ROLE_COLORS[collaborator.userRole]}`}
                  >
                    {collaborator.userRole}
                  </Badge>
                  {collaborator.section && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {collaborator.isEditing ? (
                        <>
                          <Pencil className="h-3 w-3" />
                          Editing {collaborator.section}
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3" />
                          Viewing {collaborator.section}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          {collaborators.length > 5 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                  +{collaborators.length - 5}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="space-y-1">
                  {collaborators.slice(5).map((collaborator) => (
                    <div key={collaborator.userId} className="text-sm">
                      {collaborator.userName} ({collaborator.userRole})
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
