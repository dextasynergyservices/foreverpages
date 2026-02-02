import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get language from query params
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "en";

    // Fetch user with current plan and active subscription
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        currentPlan: {
          include: {
            translations: {
              where: {
                language: lang,
              },
            },
          },
        },
        subscriptions: {
          where: {
            OR: [{ status: "ACTIVE" }, { status: "GRACE_PERIOD" }],
          },
          orderBy: {
            expiresAt: "desc",
          },
          take: 1,
          include: {
            plan: {
              include: {
                translations: {
                  where: {
                    language: lang,
                  },
                },
              },
            },
            renewal: {
              include: {
                translations: {
                  where: {
                    language: lang,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Check if user is a collaborator (has accepted invitations but no personal subscription)
    // Check both invitedUserId and email since invitations are sent by email
    const collaboratorInvitations = await prisma.invitation.findMany({
      where: {
        status: "ACCEPTED",
        role: {
          in: ["ADMIN", "EDITOR", "CONTRIBUTOR"],
        },
        OR: [{ invitedUserId: user.id }, { email: user.email || "" }],
      },
      include: {
        memorial: {
          include: {
            owner: {
              include: {
                subscriptions: {
                  where: {
                    OR: [{ status: "ACTIVE" }, { status: "GRACE_PERIOD" }],
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    const isCollaborator = collaboratorInvitations.length > 0 && !user.subscriptions[0];
    const hasOwnerSubscription =
      isCollaborator &&
      collaboratorInvitations.some((inv) => inv.memorial.owner.subscriptions.length > 0);

    // If user is a collaborator with access via owner's subscription, return special status
    if (isCollaborator && hasOwnerSubscription) {
      return NextResponse.json({
        success: true,
        data: {
          hasActiveSubscription: true, // They have access via owner
          isCollaborator: true,
          collaboratorAccess: true,
          plan: {
            id: "collaborator",
            nameKey: "subscription.collaboratorAccess.name",
            name: "Collaborator Access",
            slug: "collaborator",
            descriptionKey: "subscription.collaboratorAccess.description",
            description: "Access granted as a memorial collaborator",
            priceNGN: "0",
            priceUSD: "0",
            priceGBP: "0",
            priceEUR: "0",
            currency: "NGN",
            durationDays: 0,
            badgeTextKey: "subscription.collaboratorAccess.badge",
            badgeText: "COLLABORATOR",
            badgeColor: "blue",
          },
          daysRemaining: null,
          statusKey: "subscription.status.active",
          status: "ACTIVE",
          alertLevel: "none",
          hasLifetimeAccess: false,
          shouldShowRenewButton: false,
        },
      });
    }

    // Helper to get localized plan data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getLocalizedPlan = (plan: any) => {
      if (!plan) return null;
      const translation = plan.translations?.[0];
      return {
        id: plan.id,
        name: translation?.name || plan.name,
        slug: plan.slug,
        description: translation?.description || plan.description,
        priceNGN: plan.priceNGN?.toString() || "0",
        priceUSD: plan.priceUSD?.toString() || "0",
        priceGBP: plan.priceGBP?.toString() || "0",
        priceEUR: plan.priceEUR?.toString() || "0",
        currency: plan.currency,
        durationDays: plan.durationDays,
        badgeText: translation?.badgeText || plan.badgeText,
        badgeColor: plan.badgeColor,
      };
    };

    // Helper to get localized renewal data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getLocalizedRenewal = (renewal: any) => {
      if (!renewal) return null;
      const translation = renewal.translations?.[0];
      return {
        id: renewal.id,
        name: translation?.name || renewal.name,
        slug: renewal.slug,
        description: translation?.description || renewal.description,
        priceNGN: renewal.priceNGN?.toString() || "0",
        priceUSD: renewal.priceUSD?.toString() || "0",
        priceGBP: renewal.priceGBP?.toString() || "0",
        priceEUR: renewal.priceEUR?.toString() || "0",
        badgeText: translation?.badgeText || renewal.badgeText,
        badgeColor: renewal.badgeColor,
      };
    };

    const activeSubscription = user.subscriptions[0];

    if (!activeSubscription) {
      return NextResponse.json({
        success: true,
        data: {
          hasActiveSubscription: false,
          plan: getLocalizedPlan(user.currentPlan),
          daysRemaining: 0,
          status: "EXPIRED",
          alertLevel: "none",
          hasLifetimeAccess: false,
        },
      });
    }

    // Check if user has lifetime access (renewal)
    const hasLifetimeAccess = !!activeSubscription.renewalId;
    const renewalInfo = activeSubscription.renewal;

    // If has lifetime access, no expiration checks needed
    if (hasLifetimeAccess) {
      return NextResponse.json({
        success: true,
        data: {
          hasActiveSubscription: true,
          hasLifetimeAccess: true,
          renewal: getLocalizedRenewal(renewalInfo),
          subscription: {
            id: activeSubscription.id,
            status: "ACTIVE", // Always active for lifetime
            startDate: activeSubscription.startDate,
            renewedAt: activeSubscription.renewedAt,
          },
          plan: getLocalizedPlan(activeSubscription.plan),
          daysRemaining: null, // No expiration
          alertLevel: "none",
          shouldShowRenewButton: false, // Already has lifetime access
        },
      });
    }

    // Calculate days remaining for regular subscriptions
    const now = new Date();
    const expiresAt = new Date(activeSubscription.expiresAt);
    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Check if in grace period
    const isInGracePeriod = activeSubscription.inGracePeriod;
    const gracePeriodEndsAt = activeSubscription.gracePeriodEndsAt
      ? new Date(activeSubscription.gracePeriodEndsAt)
      : null;
    let gracePeriodDaysRemaining = 0;

    if (isInGracePeriod && gracePeriodEndsAt) {
      gracePeriodDaysRemaining = Math.ceil(
        (gracePeriodEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Determine alert level based on days remaining
    let alertLevel: "none" | "info" | "warning" | "critical" | "expired" | "grace";
    if (isInGracePeriod) {
      alertLevel = "grace";
    } else if (daysRemaining <= 0) {
      alertLevel = "expired";
    } else if (daysRemaining <= 3) {
      alertLevel = "critical";
    } else if (daysRemaining <= 7) {
      alertLevel = "warning";
    } else if (daysRemaining <= 14) {
      alertLevel = "info";
    } else {
      alertLevel = "none";
    }

    return NextResponse.json({
      success: true,
      data: {
        hasActiveSubscription: true,
        hasLifetimeAccess: false,
        subscription: {
          id: activeSubscription.id,
          status: activeSubscription.status,
          startDate: activeSubscription.startDate,
          expiresAt: activeSubscription.expiresAt,
          autoRenew: activeSubscription.autoRenew,
          inGracePeriod: isInGracePeriod,
          gracePeriodEndsAt: gracePeriodEndsAt?.toISOString(),
          gracePeriodDaysRemaining,
        },
        plan: getLocalizedPlan(activeSubscription.plan),
        daysRemaining: isInGracePeriod ? gracePeriodDaysRemaining : daysRemaining,
        alertLevel,
        shouldShowRenewButton: daysRemaining <= 7 || isInGracePeriod,
        shouldSendEmail: daysRemaining <= 7,
      },
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
