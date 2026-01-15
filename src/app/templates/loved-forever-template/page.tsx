import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import LifeSection from "./components/LifeSection";
import FamilyTree from "./components/FamilyTree";
import PhotoGallery from "./components/PhotoGallery";
import PrayerWall from "./components/PrayerWall";
import SupportSection from "./components/SupportSection";
import CondolencesSection from "./components/CondolencesSection";
import Footer from "./components/Footer";
import MusicPlayer from "./components/MusicPlayer";
import { TemplateProvider } from "./TemplateProvider";
import { getDefaultPreviewData, templateConfig } from "./config";

export default async function LovedForeverTemplatePage({
  searchParams,
}: {
  searchParams: Promise<{ memorialId?: string; preview?: string }>;
}) {
  const { memorialId, preview } = await searchParams;
  const isPreview = preview === "true";

  // For now use preview data - in production this would fetch from database
  const memorial = getDefaultPreviewData();

  // User customization will come from memorial.config.customization (from UserTemplate.customization)
  const customization = memorial.config?.defaultDesign;

  return (
    <TemplateProvider
      isPreview={isPreview}
      memorialId={memorialId}
      memorial={memorial}
      config={templateConfig}
      customization={customization}
    >
      <div className="min-h-screen bg-gradient-heavenly">
        <Navbar />
        <HeroSection />
        <LifeSection />
        <FamilyTree />
        <PhotoGallery />
        <PrayerWall />
        <SupportSection />
        <CondolencesSection />
        <Footer />
        <MusicPlayer />
      </div>
    </TemplateProvider>
  );
}
