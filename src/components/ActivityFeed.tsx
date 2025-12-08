"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileEdit, Upload, Trash2, CheckCircle, XCircle, Eye, Share2, Clock } from "lucide-react";
import type { ActivityType, MemorialRole } from "@/generated/prisma";

interface ActivityLogEntry {
  id: string;
  action: ActivityType;
  entityType: string;
  entityId: string;
  section: string | null;
  description: string;
  userName: string;
  userRole: MemorialRole;
  createdAt: Date;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface ActivityFeedProps {
  memorialId: string;
  limit?: number;
  section?: string;
  userId?: string;
  refreshInterval?: number; // milliseconds, default 30000 (30 seconds)
}

const ACTIVITY_ICONS: Partial<Record<ActivityType, React.ComponentType<{ className?: string }>>> = {
  CREATED: FileEdit,
  UPDATED: FileEdit,
  DELETED: Trash2,
  UPLOADED: Upload,
  VIEWED: Eye,
  SHARED: Share2,
  PUBLISHED: CheckCircle,
  UNPUBLISHED: XCircle,
  APPROVED: CheckCircle,
  REJECTED: XCircle,
  REMOVED: Trash2,
};

const ROLE_COLORS: Record<MemorialRole, string> = {
  OWNER: "bg-purple-100 text-purple-800",
  ADMIN: "bg-blue-100 text-blue-800",
  EDITOR: "bg-green-100 text-green-800",
  CONTRIBUTOR: "bg-yellow-100 text-yellow-800",
  VIEWER: "bg-gray-100 text-gray-800",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(date).toLocaleDateString();
}

export function ActivityFeed({
  memorialId,
  limit = 20,
  section,
  userId,
  refreshInterval = 30000,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchActivities = async () => {
      try {
        const params = new URLSearchParams();
        params.set("limit", limit.toString());
        if (section) params.set("section", section);
        if (userId) params.set("userId", userId);

        const response = await fetch(`/api/memorials/${memorialId}/activity?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch activity feed");
        }

        const data = await response.json();

        if (isMounted) {
          setActivities(data);
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
    fetchActivities();

    // Set up polling
    const interval = setInterval(fetchActivities, refreshInterval);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [memorialId, limit, section, userId, refreshInterval]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Loading activity feed...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription className="text-destructive">
            Failed to load activity feed
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>No recent activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="mb-2 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Activity will appear here when collaborators make changes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          {activities.length} recent {activities.length === 1 ? "change" : "changes"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.action] || FileEdit;

              return (
                <div key={activity.id} className="flex gap-3 pb-4 border-b last:border-b-0">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={ROLE_COLORS[activity.userRole]}>
                      {getInitials(activity.userName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start gap-2">
                      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-semibold">{activity.userName}</span>{" "}
                          <span className="text-muted-foreground">{activity.description}</span>
                        </p>

                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={`text-xs ${ROLE_COLORS[activity.userRole]}`}
                          >
                            {activity.userRole}
                          </Badge>
                          {activity.section && (
                            <Badge variant="secondary" className="text-xs">
                              {activity.section}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(activity.createdAt)}
                          </span>
                        </div>

                        {activity.changes && Object.keys(activity.changes).length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                              View changes
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                              {JSON.stringify(activity.changes, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
