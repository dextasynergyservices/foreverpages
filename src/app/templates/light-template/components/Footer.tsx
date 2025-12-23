"use client";

import { useTemplate } from "../TemplateProvider";

const SimpleFooter = () => {
  const { sectionsData } = useTemplate();
  const currentYear = new Date().getFullYear();

  // Get memorial data with fallbacks
  const heroData = (sectionsData?.HERO as any) || {};
  const name = heroData.name || "John Michael Anderson";
  const birthYear = heroData.birthDate ? new Date(heroData.birthDate).getFullYear() : "1952";
  const deathYear = heroData.deathDate ? new Date(heroData.deathDate).getFullYear() : "2024";

  return (
    <footer className="relative py-12 px-4 text-center border-t-2 border-primary/30 bg-black/60">
      <p className="text-primary font-script text-2xl mb-2">May eternal light shine upon them</p>
      <p className="text-gray-400 text-sm mb-2">
        {name} • {birthYear} - {deathYear}
      </p>
      <p className="text-gray-500 text-xs">Created with love and remembrance • © {currentYear}</p>
    </footer>
  );
};

export default SimpleFooter;
