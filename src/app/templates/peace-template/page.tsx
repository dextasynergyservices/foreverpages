import { TemplateProvider } from "./TemplateProvider";
import { Navbar } from "./components/Navbar";
import { HeroModern } from "./components/HeroModern";
import { Biography } from "./components/Biography";
import { TimelineHorizontal } from "./components/TimelineHorizontal";
import { GalleryModern } from "./components/GalleryModern";
import { VideoTributes } from "./components/VideoTributes";
import { TributesModern } from "./components/TributesModern";
import { FamilyTree } from "./components/FamilyTree";

interface PageProps {
  searchParams: Promise<{
    preview?: string;
    customization?: string;
  }>;
}

export default async function PeaceTemplatePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const customizationParam = params.customization;

  // Parse customization if provided
  let customization = null;
  if (customizationParam) {
    try {
      customization = JSON.parse(decodeURIComponent(customizationParam));
    } catch (e) {
      console.error("Failed to parse customization:", e);
    }
  }

  return (
    <TemplateProvider customization={customization}>
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
          <p className="mb-4 font-heading text-2xl font-bold text-white">Eleanor Grace Thompson</p>
          <p className="text-white/80">Forever celebrated, forever loved</p>
        </footer>
      </div>
    </TemplateProvider>
  );
}
