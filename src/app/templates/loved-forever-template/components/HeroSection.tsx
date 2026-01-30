"use client";

import { useTemplate } from "../TemplateProvider";
import Image from "next/image";
import { User } from "lucide-react";

// Default placeholder image for when no portrait is uploaded
const DEFAULT_PORTRAIT_PLACEHOLDER =
  "https://res.cloudinary.com/dt7ozsctz/image/upload/v1764166230/thomas1_yuknpv.png";

// Helper function to extract year from date string or Date object
const extractYear = (dateValue: unknown): string => {
  if (!dateValue) return "";
  if (typeof dateValue === "string") {
    // If it's already a year (4 digits)
    if (/^\d{4}$/.test(dateValue)) return dateValue;
    // If it's a date string like "1990-01-15"
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.getFullYear().toString();
    }
    return dateValue;
  }
  if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
    return dateValue.getFullYear().toString();
  }
  return "";
};

const HeroSection = () => {
  const { memorial, sectionsData } = useTemplate();

  // Get HERO section data with fallbacks
  const heroData = (sectionsData?.HERO as Record<string, unknown>) || {};
  const mainImage =
    (heroData.mainImage as string) || memorial.portraitUrl || DEFAULT_PORTRAIT_PLACEHOLDER;
  const displayName = (heroData.title as string) || memorial.name || "Memorial";

  // Handle both birthYear and birthDate fields (editor saves birthDate, but we display year)
  const birthYear =
    extractYear(heroData.birthDate) || extractYear(heroData.birthYear) || memorial.birthYear || "";
  const deathYear =
    extractYear(heroData.deathDate) || extractYear(heroData.deathYear) || memorial.deathYear || "";
  const quote = (heroData.quote as string) || memorial.tagline || "Forever in our hearts";

  // Check if we have a valid image URL
  const hasValidImage = mainImage && mainImage.trim() !== "";

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        {memorial.videoUrl && (
          <video autoPlay muted loop playsInline className="w-full h-full object-cover">
            <source src={memorial.videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}

        {/* Video Overlay */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 animate-fade-in-up">
        <div className="relative w-60 h-60 md:w-80 md:h-80 mx-auto rounded-full border-4 border-white/30 overflow-hidden bg-white/10">
          {hasValidImage ? (
            <Image
              src={mainImage}
              alt={displayName}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full object-cover"
              width={320}
              height={320}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-white/5">
              <User className="w-24 h-24 md:w-32 md:h-32 text-white/40" />
            </div>
          )}
        </div>

        {/* Name */}
        <h1 className="font-heading text-3xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
          {displayName}
        </h1>

        {/* Dates */}
        <p className="font-body text-xl text-white/90 mb-8 drop-shadow">
          {birthYear && deathYear ? `${birthYear} - ${deathYear}` : birthYear || deathYear || ""}
        </p>

        {/* Verse */}
        <div className="max-w-2xl mx-auto glass-effect rounded-2xl p-8 shadow-soft">
          <p className="font-body text-lg md:text-xl text-foreground italic leading-relaxed">
            &ldquo;{quote}&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
