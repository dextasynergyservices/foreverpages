"use client";

import { GraduationCap, Heart, Briefcase, Baby, Home, BookOpen } from "lucide-react";
import { useTemplate } from "../TemplateProvider";

export const TimelineHorizontal = () => {
  const { sectionsData } = useTemplate();

  // Get TIMELINE section data with fallbacks
  const timelineData = (sectionsData?.TIMELINE as any) || {};
  const defaultTimelineEvents = [
    {
      year: "1945",
      title: "Born in Boston",
      description: "Eleanor Grace was born on a beautiful spring day",
      icon: Baby,
    },
    {
      year: "1963",
      title: "High School Graduation",
      description: "Graduated with honors from Boston Latin School",
      icon: GraduationCap,
    },
    {
      year: "1967",
      title: "College Graduation",
      description: "Earned Bachelor&apos;s degree in Education",
      icon: BookOpen,
    },
    {
      year: "1968",
      title: "Marriage",
      description: "Married Robert Thompson",
      icon: Heart,
    },
    {
      year: "1970",
      title: "Teaching Career Begins",
      description: "Started at Riverside Elementary",
      icon: Briefcase,
    },
    {
      year: "1985",
      title: "Move to Lagos",
      description: "Relocated family to Lagos, Nigeria",
      icon: Home,
    },
    {
      year: "2005",
      title: "Retirement",
      description: "After 35 years of inspiring young minds",
      icon: GraduationCap,
    },
  ];

  const timelineEvents = timelineData.events || defaultTimelineEvents;

  return (
    <section
      id="memories"
      className="bg-gradient-to-br from-burgundy/90 via-burgundy/80 to-deep-plum/90 px-4 py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 animate-fade-in text-center">
          <h2 className="mb-1 font-heading text-2xl font-bold leading-tight text-cream md:mb-2 md:text-6xl">
            Life&apos;s Journey
          </h2>
          <p className="text-cream/80">Scroll through the milestones</p>
        </div>

        {/* Horizontal Scrollable Timeline */}
        <div className="-mx-4 overflow-x-auto px-4 pb-8">
          <div className="flex min-w-max gap-6">
            {timelineEvents.map((event: any, index: number) => (
              <div
                key={index}
                className="relative w-80 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Card */}
                <div className="rounded-2xl border border-cream/20 bg-cream/10 p-6 shadow-elegant backdrop-blur-sm transition-smooth hover:scale-105 hover:border-soft-gold/30">
                  {/* Icon */}
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-soft-gold">
                    <event.icon className="h-8 w-8 text-burgundy" />
                  </div>

                  {/* Year */}
                  <div className="mb-2 font-heading text-3xl font-bold text-soft-gold">
                    {event.year}
                  </div>

                  {/* Title */}
                  <h3 className="mb-2 font-heading text-xl font-semibold text-cream">
                    {event.title}
                  </h3>

                  {/* Description */}
                  <p className="leading-relaxed text-cream/90">{event.description}</p>
                </div>

                {/* Connector Line */}
                {index < timelineEvents.length - 1 && (
                  <div className="absolute -right-6 top-8 h-1 w-6 bg-soft-gold/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
