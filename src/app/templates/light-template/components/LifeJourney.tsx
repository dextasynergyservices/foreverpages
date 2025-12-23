"use client";

import { Heart, Cross, BookOpen, Users, GraduationCap, Briefcase, Home } from "lucide-react";
import { useTemplate } from "../TemplateProvider";

interface JourneyEvent {
  year: string;
  title: string;
  description: string;
  icon: "heart" | "cross" | "book" | "users" | "graduation" | "briefcase" | "home";
  theme: "faith" | "family" | "career" | "community";
}

const defaultEvents: JourneyEvent[] = [
  {
    year: "1952",
    title: "A Blessed Beginning",
    description:
      "Born in Springfield, Illinois to loving parents Margaret and Robert Anderson, welcomed into the Christian faith",
    icon: "heart",
    theme: "family",
  },
  {
    year: "1970",
    title: "Academic Excellence",
    description:
      "Graduated with honors, showing early dedication to learning and community service through church youth programs",
    icon: "graduation",
    theme: "career",
  },
  {
    year: "1975",
    title: "Sacred Union",
    description:
      "Married beloved wife Sarah in a beautiful ceremony at St. Mary's Cathedral, surrounded by family and friends",
    icon: "cross",
    theme: "faith",
  },
  {
    year: "1978",
    title: "Father's Joy",
    description:
      "Welcomed daughter Emily, bringing immeasurable joy and beginning his cherished role as a father",
    icon: "heart",
    theme: "family",
  },
  {
    year: "1982",
    title: "Professional Legacy",
    description:
      "Became senior engineer, dedicating his work to innovation while mentoring young professionals in his field",
    icon: "briefcase",
    theme: "career",
  },
  {
    year: "1995",
    title: "Spiritual Leadership",
    description:
      "Elected to church council, serving with wisdom and compassion while organizing community outreach programs",
    icon: "users",
    theme: "community",
  },
  {
    year: "2010",
    title: "Generational Blessing",
    description:
      "Welcomed first grandchild, finding new purpose in preserving family values and creating lasting memories",
    icon: "home",
    theme: "family",
  },
  {
    year: "2024",
    title: "Eternal Peace",
    description:
      "Peacefully passed surrounded by loving family, leaving a legacy of faith, kindness, and enduring love",
    icon: "cross",
    theme: "faith",
  },
];

const iconMap = {
  heart: Heart,
  cross: Cross,
  book: BookOpen,
  users: Users,
  graduation: GraduationCap,
  briefcase: Briefcase,
  home: Home,
};

const themeColors = {
  faith: "border-blue-400/30 bg-blue-500/5 hover:bg-blue-500/10",
  family: "border-rose-400/30 bg-rose-500/5 hover:bg-rose-500/10",
  career: "border-amber-400/30 bg-amber-500/5 hover:bg-amber-500/10",
  community: "border-emerald-400/30 bg-emerald-500/5 hover:bg-emerald-500/10",
};

const LifeJourney = () => {
  const { sectionsData } = useTemplate();

  // Get TIMELINE/BIOGRAPHY section data with fallbacks
  const timelineData = (sectionsData?.TIMELINE as any) || {};
  const events = timelineData.events || defaultEvents;

  return (
    <section id="journey" className="relative py-20 px-4 md:px-8">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage: `url(https://res.cloudinary.com/dt7ozsctz/image/upload/v1764166575/stalks-bg_ylhspt.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundAttachment: "fixed",
          }}
        />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-block mb-4">
            <div className="flex items-center justify-center gap-3 mb-4"></div>
            <h2 className="font-heading text-2xl md:text-5xl text-primary uppercase tracking-wider mb-4">
              A Life Well Lived
            </h2>
            <p className="text-foreground/70 text-lg italic max-w-2xl mx-auto">
              Celebrating the milestones that shaped an extraordinary journey
            </p>
          </div>
        </div>

        {/* Circular Timeline Layout */}
        <div className="relative">
          {/* Floating Connection Dots - Creates organic flow without straight lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-pulse"></div>
            <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-primary/20 rounded-full animate-pulse delay-300"></div>
            <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-primary/20 rounded-full animate-pulse delay-700"></div>
            <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-primary/20 rounded-full animate-pulse delay-1000"></div>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {events.map((event: any, index: number) => {
              const IconComponent = iconMap[event.icon as keyof typeof iconMap] || Heart; // Fallback to Heart if icon not found
              return (
                <div key={index} className="group relative">
                  {/* Card */}
                  <div
                    className={`relative h-full border-2 ${themeColors[event.theme as keyof typeof themeColors]} rounded-2xl p-6 transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl backdrop-blur-sm`}
                  >
                    {/* Icon with decorative background */}
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-primary/10 rounded-full scale-150 group-hover:scale-125 transition-transform duration-500"></div>
                      <div className="relative bg-background border-2 border-primary/20 rounded-full p-3 w-14 h-14 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                    </div>

                    {/* Year */}
                    <div className="text-primary font-heading text-2xl mb-2 tracking-wider">
                      {event.year}
                    </div>

                    {/* Title */}
                    <h3 className="text-foreground text-lg font-heading mb-3 leading-tight">
                      {event.title}
                    </h3>

                    {/* Description */}
                    <p className="text-muted-foreground text-sm leading-relaxed italic">
                      {event.description}
                    </p>

                    {/* Decorative corner accents */}
                    <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-primary/30 rounded-tr-lg group-hover:border-primary/60 transition-colors"></div>
                    <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-primary/30 rounded-bl-lg group-hover:border-primary/60 transition-colors"></div>
                  </div>

                  {/* Floating year indicator */}
                  <div className="absolute -top-3 -right-3 bg-background border-2 border-primary/30 rounded-full px-3 py-1 text-primary font-heading text-sm tracking-wide group-hover:border-primary/60 transition-colors">
                    {event.year}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LifeJourney;
