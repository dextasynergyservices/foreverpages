import { PrismaClient, ActivityType, MemorialRole, Prisma } from "@/generated/prisma";

const prisma = new PrismaClient();

interface LogActivityParams {
  memorialId: string;
  userId: string;
  userName: string;
  userRole: MemorialRole;
  action: ActivityType;
  entityType: string;
  entityId?: string;
  section?: string;
  description?: string;
  changes?: Prisma.JsonValue;
  metadata?: Prisma.JsonValue;
}

/**
 * Log an activity for a memorial
 * This is a helper function that can be called from any API endpoint
 */
export async function logMemorialActivity(params: LogActivityParams): Promise<void> {
  const {
    memorialId,
    userId,
    userName,
    userRole,
    action,
    entityType,
    entityId,
    section,
    description,
    changes,
    metadata,
  } = params;

  try {
    await prisma.activityLog.create({
      data: {
        memorialId,
        userId,
        userName,
        userRole,
        action,
        entityType,
        entityId: entityId || "",
        section: section || undefined,
        description: description || `${action} ${entityType}`,
        changes: (changes as Prisma.JsonValue) || Prisma.JsonNull,
        metadata: (metadata as Prisma.JsonValue) || Prisma.JsonNull,
      },
    });
  } catch (error) {
    // Log error but don't throw - we don't want activity logging to break the main operation
    console.error("Error logging activity:", error);
  }
}

/**
 * Generate a human-readable description for an activity
 */
export function generateActivityDescription(
  action: ActivityType,
  entityType: string,
  details?: string
): string {
  const actionMap: Record<ActivityType, string> = {
    CREATED: "created",
    UPDATED: "updated",
    DELETED: "deleted",
    UPLOADED: "uploaded",
    PUBLISHED: "published",
    UNPUBLISHED: "unpublished",
    APPROVED: "approved",
    REJECTED: "rejected",
    REMOVED: "removed",
    INVITED: "invited",
    ACCEPTED_INVITE: "accepted invitation",
    DECLINED_INVITE: "declined invitation",
    COMMENTED: "commented on",
    REACTED: "reacted to",
    VIEWED: "viewed",
    SHARED: "shared",
    DOWNLOADED: "downloaded",
    REPORTED: "reported",
    MODERATED: "moderated",
    SUBSCRIPTION_REMINDER_7_DAYS: "subscription reminder",
    SUBSCRIPTION_CRITICAL_ALERT: "subscription alert",
    SUBSCRIPTION_EXPIRED: "subscription expired",
  };

  const verb = actionMap[action] || action.toLowerCase();
  const entity = entityType.toLowerCase();

  if (details) {
    return `${verb} ${entity}: ${details}`;
  }

  return `${verb} ${entity}`;
}

/**
 * Track changes between old and new values
 */
export function trackChanges(
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>
): Record<string, { before: unknown; after: unknown }> {
  const changes: Record<string, { before: unknown; after: unknown }> = {};

  // Check for changed or new fields
  for (const key in newValue) {
    if (JSON.stringify(oldValue[key]) !== JSON.stringify(newValue[key])) {
      changes[key] = {
        before: oldValue[key],
        after: newValue[key],
      };
    }
  }

  // Check for deleted fields
  for (const key in oldValue) {
    if (!(key in newValue)) {
      changes[key] = {
        before: oldValue[key],
        after: null,
      };
    }
  }

  return changes;
}
