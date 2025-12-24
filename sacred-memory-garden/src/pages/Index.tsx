import { useState } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import BlessingModal from '@/components/BlessingModal';
import LifeSection from '@/components/LifeSection';
import FamilyTree from '@/components/FamilyTree';
import PhotoGallery from '@/components/PhotoGallery';
import PrayerWall from '@/components/PrayerWall';
import SupportSection from '@/components/SupportSection';
import CondolencesSection from '@/components/CondolencesSection';
import MusicPlayer from '@/components/MusicPlayer';

const Index = () => {
  const [isBlessingModalOpen, setIsBlessingModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-heavenly">
      <Navbar onSendBlessing={() => setIsBlessingModalOpen(true)} />
      <HeroSection />
      <LifeSection />
      <FamilyTree />
      <PhotoGallery />
      <PrayerWall />
      <SupportSection onSendBlessing={() => setIsBlessingModalOpen(true)} />
      <CondolencesSection />

      <BlessingModal open={isBlessingModalOpen} onOpenChange={setIsBlessingModalOpen} />

      {/* Add Music Player */}
      <MusicPlayer />

      {/* Footer */}
      <footer className="relative py-16 px-4 text-white overflow-hidden">
        {/* Background with same styling as other sections */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#3a4b2f] via-[#2e3a25] to-[#1f2615] z-0"></div>

        {/* Enhanced overlays for consistency */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(252,228,181,0.1),transparent_70%)] pointer-events-none z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none z-0"></div>

        <div className="relative container mx-auto max-w-6xl z-10">
          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-amber-300/20">
            <p className="font-body text-amber-200/50 text-sm text-center md:text-left">
              © {new Date().getFullYear()} In Loving Memory
            </p>

            <div className="flex items-center gap-6">
              <button className="font-body text-amber-200/60 hover:text-amber-100 text-sm transition-colors duration-300">
                Privacy
              </button>
              <button className="font-body text-amber-200/60 hover:text-amber-100 text-sm transition-colors duration-300">
                Terms
              </button>
              <button
                onClick={() =>
                  document.getElementById('tributes')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="font-body text-amber-200/60 hover:text-amber-100 text-sm transition-colors duration-300"
              >
                Share Tribute
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
