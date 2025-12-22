import { Memorial, Subscription } from "@/generated/prisma";

export interface MemorialExpiryCheck {
  accessible: boolean;
  reason: "active" | "expired" | "grace_period" | "no_expiry" | "owner_preview";
  expiryDate?: Date;
  gracePeriodEnd?: Date;
  subscription?: {
    status: string;
    expiresAt: Date;
  };
}

/**
 * Check if a memorial is accessible based on its expiry date and subscription status
 * @param memorial - The memorial to check
 * @param viewerId - Optional viewer ID (to allow owner preview)
 * @param subscription - Optional subscription data
 * @returns MemorialExpiryCheck object with accessibility status and reason
 */
export function checkMemorialExpiry(
  memorial: Pick<Memorial, "id" | "expiresAt" | "ownerId">,
  viewerId?: string,
  subscription?: Pick<Subscription, "status" | "expiresAt" | "gracePeriodEndsAt"> | null
): MemorialExpiryCheck {
  const now = new Date();

  // If viewer is the owner, allow preview with appropriate reason
  const isOwner = viewerId && viewerId === memorial.ownerId;

  // No expiry date set - memorial is always accessible (e.g., lifetime subscription)
  if (!memorial.expiresAt) {
    return {
      accessible: true,
      reason: "no_expiry",
    };
  }

  const expiryDate = new Date(memorial.expiresAt);

  // Memorial has not expired yet
  if (now < expiryDate) {
    return {
      accessible: true,
      reason: "active",
      expiryDate,
      subscription: subscription
        ? {
            status: subscription.status,
            expiresAt: subscription.expiresAt,
          }
        : undefined,
    };
  }

  // Memorial has expired - check grace period
  if (subscription && subscription.gracePeriodEndsAt) {
    const gracePeriodEnd = new Date(subscription.gracePeriodEndsAt);

    // Still in grace period
    if (now < gracePeriodEnd) {
      return {
        accessible: true,
        reason: "grace_period",
        expiryDate,
        gracePeriodEnd,
        subscription: {
          status: subscription.status,
          expiresAt: subscription.expiresAt,
        },
      };
    }
  }

  // Memorial has expired and grace period is over
  // Allow owner to see it but with expired status
  if (isOwner) {
    return {
      accessible: true,
      reason: "owner_preview",
      expiryDate,
      subscription: subscription
        ? {
            status: subscription.status,
            expiresAt: subscription.expiresAt,
          }
        : undefined,
    };
  }

  // Memorial is expired and viewer is not the owner
  return {
    accessible: false,
    reason: "expired",
    expiryDate,
    subscription: subscription
      ? {
          status: subscription.status,
          expiresAt: subscription.expiresAt,
        }
      : undefined,
  };
}

/**
 * Calculate grace period end date
 * @param expiryDate - Subscription expiry date
 * @param gracePeriodDays - Number of grace period days (default: 7)
 * @returns Grace period end date
 */
export function calculateGracePeriodEnd(expiryDate: Date, gracePeriodDays: number = 7): Date {
  const gracePeriodEnd = new Date(expiryDate);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);
  return gracePeriodEnd;
}

/**
 * Get user-friendly expiry status message
 * @param check - Memorial expiry check result
 * @returns Status message key for i18n
 */
export function getExpiryStatusMessage(check: MemorialExpiryCheck): string {
  switch (check.reason) {
    case "active":
      return "memorial.status.active";
    case "expired":
      return "memorial.status.expired";
    case "grace_period":
      return "memorial.status.gracePeriod";
    case "no_expiry":
      return "memorial.status.lifetime";
    case "owner_preview":
      return "memorial.status.ownerPreview";
    default:
      return "memorial.status.unknown";
  }
}
