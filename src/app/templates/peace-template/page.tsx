import { TemplateProvider } from "./TemplateProvider";
import { Navbar } from "./components/Navbar";
import { HeroModern } from "./components/HeroModern";
import { Biography } from "./components/Biography";
import { TimelineHorizontal } from "./components/TimelineHorizontal";
import { GalleryModern } from "./components/GalleryModern";
import { VideoTributes } from "./components/VideoTributes";
import { TributesModern } from "./components/TributesModern";
import { FamilyTree } from "./components/FamilyTree";
import { prisma } from "@/lib/prisma";

interface PageProps {
  searchParams: Promise<{
    preview?: string;
    customization?: string;
    memorialId?: string;
  }>;
}

export default async function PeaceTemplatePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const customizationParam = params.customization;
  const memorialId = params.memorialId;
  const isPreview = params.preview === "true";

  // Parse customization if provided
  let customization = null;
  if (customizationParam) {
    try {
      customization = JSON.parse(decodeURIComponent(customizationParam));
    } catch (e) {
      console.error("Failed to parse customization:", e);
    }
  }

  // Default preview data
  const defaultMemorial = {
    id: "preview-memorial-id",
    firstName: "Eleanor",
    lastName: "Grace Thompson",
    ownerId: "preview-user-id",
    birthDate: new Date("1945-03-15"),
    deathDate: new Date("2023-11-20"),
    biography:
      "Eleanor Grace Thompson was a beacon of warmth and kindness who touched countless lives through her unwavering compassion and dedication to her community.",
  };

  const defaultMemorialOwner = {
    id: "preview-user-id",
    name: "Memorial Family",
    email: "memorial@example.com",
    accountDetails: [], // Empty array, will be fetched from API
  };

  // Fetch memorial data if memorialId is provided, otherwise use preview data
  let memorial = null;
  let memorialOwner = null;

  if (memorialId && !isPreview) {
    try {
      memorial = await prisma.memorial.findUnique({
        where: { id: memorialId },
      });

      if (memorial && memorial.ownerId) {
        // Fetch the owner separately
        const owner = await prisma.user.findUnique({
          where: { id: memorial.ownerId },
          select: {
            id: true,
            name: true,
            email: true,
            accountDetails: true,
          },
        });
        if (owner) {
          memorialOwner = owner;
        }
      }
    } catch (error) {
      console.error("Error fetching memorial:", error);
    }
  } else {
    // Use preview data when no memorialId or when in preview mode
    memorial = defaultMemorial;
    memorialOwner = defaultMemorialOwner;
  }

  return (
    <TemplateProvider
      customization={customization}
      memorial={memorial}
      memorialOwner={memorialOwner}
    >
      <div className="min-h-screen">
        <Navbar />
        <HeroModern />
        <Biography />
        <TimelineHorizontal />
        <GalleryModern />
        <FamilyTree />
        <VideoTributes />
        <TributesModern />

        {/* Footer */}
        <footer className="bg-gradient-to-br from-burgundy/90 via-burgundy/80 to-deep-plum/90 px-4 py-8 text-center">
          <p className="mb-2 text-lg italic text-soft-gold">In Loving Memory</p>
          <p className="mb-4 font-heading text-2xl font-bold text-white">
            {memorial ? `${memorial.firstName} ${memorial.lastName}` : "Eleanor Grace Thompson"}
          </p>
          <p className="text-white/80">Forever celebrated, forever loved</p>
        </footer>
      </div>
    </TemplateProvider>
  );
}
