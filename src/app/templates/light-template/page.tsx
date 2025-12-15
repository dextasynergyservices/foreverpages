import StarField from "./components/StarField";
import HeroSection from "./components/HeroSection";
import LifeJourney from "./components/LifeJourney";
import PhotoGallery from "./components/PhotoGallery";
import Condolence from "./components/Condolence";
import CandleSanctuary from "./components/CandleSanctuary";
import Navigation from "./components/Navigation";
import MobileNavigation from "./components/MobileNavigation";
import TributeSection from "./components/Tribute";
import Footer from "./components/Footer";
import { TemplateProvider } from "./TemplateProvider";
import { MusicProvider } from "./components/MusicContext";
import { getDefaultPreviewData, fetchMemorialData, templateConfig } from "./config";

export default async function LightTemplatePage({
  searchParams,
}: {
  searchParams: Promise<{ memorialId?: string; preview?: string }>;
}) {
  const { memorialId, preview } = await searchParams;

  const isPreview = preview === "true";

  // Fetch memorial data - use preview data or fetch from database
  const memorial = isPreview
    ? getDefaultPreviewData()
    : memorialId
      ? await fetchMemorialData(memorialId)
      : getDefaultPreviewData();

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
      <MusicProvider>
        <div className="relative min-h-screen overflow-x-hidden bg-black text-white">
          <StarField />
          <Navigation />
          <MobileNavigation />
          <main className="relative z-10">
            <HeroSection />
            <LifeJourney />
            <PhotoGallery />
            <TributeSection />
            <CandleSanctuary />
            <Condolence />
            <Footer />
          </main>
        </div>
      </MusicProvider>
    </TemplateProvider>
  );
}
