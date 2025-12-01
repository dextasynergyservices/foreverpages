import StarField from "../components/StarField.tsx";
import HeroSection from "../components/HeroSection.tsx";
import LifeJourney from "../components/LifeJourney.tsx";
import PhotoGallery from "../components/PhotoGallery.tsx";
import Condolence from "../components/Condolence.tsx";
import CandleSanctuary from "../components/CandleSanctuary.tsx";
import Navigation from "../components/Navigation.tsx"; // Desktop nav
import MobileNavigation from "../components/MobileNavigation.jsx"; // Add this import
import TributeSection from "../components/Tribute.tsx";
import Footer from "../components/Footer.tsx";

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <StarField />
      <Navigation /> {/* Desktop - hidden on mobile with lg:block */}
      <MobileNavigation /> {/* Mobile - hidden on desktop with lg:hidden */}
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
  );
};

export default Index;
