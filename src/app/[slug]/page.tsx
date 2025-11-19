import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MemorialPageClient from "@/components/memorial/MemorialPageClient";

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

  // Fetch memorial with active stream
  const memorial = await prisma.memorial.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
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

  // Get the active stream (if any)
  const activeStream = memorial.streams[0] || null;

  // Increment view count (async, don't wait)
  prisma.memorial
    .update({
      where: { id: memorial.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch((error) => {
      console.error("Failed to increment view count:", error);
    });

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
      memorial={{
        id: memorial.id,
        slug: memorial.slug,
        firstName: memorial.firstName,
        lastName: memorial.lastName,
        middleName: memorial.middleName,
        biography: memorial.biography,
        birthDate: memorial.birthDate.toISOString(),
        deathDate: memorial.deathDate.toISOString(),
        profilePhoto: memorial.profilePhoto,
        coverPhoto: memorial.coverPhoto,
        allowComments: memorial.allowComments,
        password: memorial.password,
        viewCount: memorial.viewCount,
        candleCount: memorial.candleCount,
      }}
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
