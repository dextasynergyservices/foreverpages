import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import MemorialPageClient from "@/components/memorial/MemorialPageClient";
import { ExpiredMemorialPage } from "@/components/memorial/ExpiredMemorialPage";
import { checkMemorialExpiry } from "@/lib/utils/checkMemorialExpiry";

interface MemorialPageProps {
  params: {
    slug: string;
  };
}

// Reserved route names that should NOT be treated as memorial slugs
const RESERVED_ROUTES = [
  "api",
  "admin",
  "auth",
  "login",
  "signup",
  "packages",
  "user-dashboard",
  "memorial-pages",
  "stream",
  "payment-success",
  "forgot-password",
  "reset-password",
  "email-verification-code",
  "email-verification-token",
  "accept-invitation",
  "rsvp",
  "not-found",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
];

export default async function MemorialPage({ params }: MemorialPageProps) {
  const { slug } = await params;

  // Check if slug is a reserved route
  if (RESERVED_ROUTES.includes(slug)) {
    notFound();
  }

  // Get current session to check if viewer is owner
  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id;

  // Fetch memorial with active stream
  const memorial = await prisma.memorial.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          accountDetails: true, // Include account details for donation modal
        },
      },
      userTemplate: {
        include: {
          baseTemplate: true,
        },
      },
      streams: {
        where: {
          OR: [
            { status: "SCHEDULED" },
            { status: "STARTING" },
            { status: "LIVE" },
            { status: "PAUSED" },
            {
              AND: [
                { status: "ENDED" },
                { recordingUrl: { not: null } },
                // Only show recordings less than 6 months old
                {
                  recordingDeleteAt: {
                    gt: new Date(),
                  },
                },
              ],
            },
          ],
        },
        orderBy: {
          scheduledFor: "desc",
        },
        take: 1,
      },
    },
  });

  if (!memorial) {
    notFound();
  }

  // Fetch owner's subscription to check grace period
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: memorial.ownerId,
    },
    orderBy: { expiresAt: "desc" },
    select: {
      status: true,
      expiresAt: true,
      gracePeriodEndsAt: true,
    },
  });

  // Check memorial expiry and accessibility
  const expiryCheck = checkMemorialExpiry(memorial, viewerId, subscription);

  // If memorial is not accessible and viewer is not owner, show expired page
  if (!expiryCheck.accessible) {
    const memorialName = `${memorial.firstName} ${memorial.lastName}`;
    return <ExpiredMemorialPage memorialName={memorialName} ownerEmail={memorial.owner.email} />;
  }

  // Get the active stream (if any)
  const activeStream = memorial.streams[0] || null;

  // Track page view and increment view count (async, don't wait) - only for accessible memorials
  if (expiryCheck.reason === "active" || expiryCheck.reason === "grace_period") {
    // Get visitor info from headers
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || undefined;
    const referrer = headersList.get("referer") || undefined;

    // Create PageView record for analytics
    prisma.pageView
      .create({
        data: {
          memorialId: memorial.id,
          ipAddress,
          userAgent,
          referrer,
        },
      })
      .catch((error) => {
        console.error("Failed to create page view:", error);
      });

    // Also increment the legacy viewCount field
    prisma.memorial
      .update({
        where: { id: memorial.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch((error) => {
        console.error("Failed to increment view count:", error);
      });
  }

  // If stream exists and has viewers increment
  if (activeStream && activeStream.status === "LIVE") {
    prisma.memorialStream
      .update({
        where: { id: activeStream.id },
        data: { totalViews: { increment: 1 } },
      })
      .catch((error) => {
        console.error("Failed to increment stream view count:", error);
      });
  }

  return (
    <MemorialPageClient
      memorial={memorial}
      expiryCheck={expiryCheck}
      isOwner={viewerId === memorial.ownerId}
      activeStream={
        activeStream
          ? {
              id: activeStream.id,
              title: activeStream.title,
              description: activeStream.description,
              status: activeStream.status,
              isPublic: activeStream.isPublic,
              allowComments: activeStream.allowComments,
              allowAnonymous: activeStream.allowAnonymous,
              recordStream: activeStream.recordStream,
              streamQuality: activeStream.streamQuality,
              scheduledFor: activeStream.scheduledFor?.toISOString() || null,
              startedAt: activeStream.startedAt?.toISOString() || null,
              endedAt: activeStream.endedAt?.toISOString() || null,
              // recordingUrl intentionally omitted for public memorial pages
              recordingUrl: null,
              password: activeStream.password,
              peakViewers: activeStream.peakViewers,
              totalViews: activeStream.totalViews,
            }
          : null
      }
    />
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: MemorialPageProps) {
  const { slug } = await params;

  // Skip metadata for reserved routes
  if (RESERVED_ROUTES.includes(slug)) {
    return {
      title: "Page Not Found",
    };
  }

  const memorial = await prisma.memorial.findUnique({
    where: { slug },
    select: {
      firstName: true,
      lastName: true,
      biography: true,
      metaTitle: true,
      metaDescription: true,
      profilePhoto: true,
    },
  });

  if (!memorial) {
    return {
      title: "Memorial Not Found",
    };
  }

  const fullName = `${memorial.firstName} ${memorial.lastName}`;
  const title = memorial.metaTitle || `In Memory of ${fullName}`;
  const description =
    memorial.metaDescription ||
    memorial.biography?.substring(0, 160) ||
    `A memorial page honoring the life of ${fullName}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: memorial.profilePhoto ? [memorial.profilePhoto] : [],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: memorial.profilePhoto ? [memorial.profilePhoto] : [],
    },
  };
}
