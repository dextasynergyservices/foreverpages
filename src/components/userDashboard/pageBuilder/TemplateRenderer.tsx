/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { DesignTokens } from "./TemplateCustomizer";
import { SectionData } from "./DynamicSectionRenderer";
import { Calendar, Heart, Quote, Award, BookOpen } from "lucide-react";

interface TemplateRendererProps {
  designTokens: DesignTokens;
  sectionData?: SectionData;
  memorialData?: {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    deathDate?: string;
    birthYear?: number;
    deathYear?: number;
    biography?: string;
  };
  supportedSections?: string[];
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  designTokens,
  sectionData = {},
  memorialData = {},
  supportedSections = [],
}) => {
  const { colors, fonts, layout } = designTokens;

  // Helper to get spacing values
  const getSpacing = () => {
    switch (layout.spacing) {
      case "compact":
        return { section: "py-8", container: "space-y-4" };
      case "comfortable":
        return { section: "py-12", container: "space-y-6" };
      case "spacious":
        return { section: "py-16", container: "space-y-8" };
      default:
        return { section: "py-12", container: "space-y-6" };
    }
  };

  // Helper to get border radius
  const getBorderRadius = () => {
    switch (layout.borderRadius) {
      case "none":
        return "rounded-none";
      case "subtle":
        return "rounded-sm";
      case "moderate":
        return "rounded-md";
      case "rounded":
        return "rounded-lg";
      default:
        return "rounded-md";
    }
  };

  // Helper to get container width
  const getContainerWidth = () => {
    switch (layout.containerWidth) {
      case "narrow":
        return "max-w-3xl";
      case "standard":
        return "max-w-5xl";
      case "wide":
        return "max-w-7xl";
      default:
        return "max-w-5xl";
    }
  };

  // Helper to get font size classes
  const getFontSizeClasses = () => {
    const headingSizes = {
      small: { h1: "text-3xl", h2: "text-2xl", h3: "text-xl" },
      medium: { h1: "text-4xl", h2: "text-3xl", h3: "text-2xl" },
      large: { h1: "text-5xl", h2: "text-4xl", h3: "text-3xl" },
    };

    const bodySizes = {
      small: "text-sm",
      medium: "text-base",
      large: "text-lg",
    };

    return {
      heading: headingSizes[fonts.headingSize as keyof typeof headingSizes] || headingSizes.medium,
      body: bodySizes[fonts.bodySize as keyof typeof bodySizes] || bodySizes.medium,
    };
  };

  const spacing = getSpacing();
  const borderRadius = getBorderRadius();
  const containerWidth = getContainerWidth();
  const fontSizes = getFontSizeClasses();

  // Extract data
  const heroData = sectionData.HERO as
    | {
        mainImage?: string;
        title?: string;
        subtitle?: string;
        birthDate?: string;
        deathDate?: string;
        quote?: string;
      }
    | undefined;
  const biographyData = sectionData.BIOGRAPHY as { fullStory?: string } | undefined;
  const timelineData = sectionData.TIMELINE as
    | { events?: Array<{ id: string; date: string; title: string; description?: string }> }
    | undefined;
  const galleryData = sectionData.GALLERY as
    | { items?: Array<{ url: string; caption?: string }>; layout?: string }
    | undefined;
  const tributesData = sectionData.TRIBUTES as
    | { tributes?: Array<{ author: string; message: string; relationship?: string }> }
    | undefined;
  const achievementsData = sectionData.ACHIEVEMENTS as
    | { achievements?: Array<{ title: string; description?: string; year?: string }> }
    | undefined;
  const quotesData = sectionData.QUOTES as
    | { quotes?: Array<{ text: string; author?: string }> }
    | undefined;

  // Determine name to display
  const displayName =
    heroData?.title ||
    (memorialData.firstName && memorialData.lastName
      ? `${memorialData.firstName} ${memorialData.lastName}`
      : "Memorial Name");

  // Format dates
  const formatDate = (date?: string) => {
    if (!date) return "";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return date;
    }
  };

  const birthDate = heroData?.birthDate || memorialData.birthDate;
  const deathDate = heroData?.deathDate || memorialData.deathDate;
  const dateRange =
    birthDate && deathDate
      ? `${formatDate(birthDate)} - ${formatDate(deathDate)}`
      : memorialData.birthYear && memorialData.deathYear
        ? `${memorialData.birthYear} - ${memorialData.deathYear}`
        : "";

  return (
    <div
      className="min-h-screen overflow-auto"
      style={{
        backgroundColor: colors.bodyBg,
        color: colors.bodyText,
        fontFamily: fonts.fontFamily,
      }}
    >
      {/* Hero Section */}
      {supportedSections.includes("HERO") && (
        <header
          className={`${spacing.section} relative`}
          style={{ backgroundColor: colors.headerBg, color: colors.headerText }}
        >
          <div className={`${containerWidth} mx-auto px-6`}>
            {heroData?.mainImage && (
              <div className={`mb-8 ${borderRadius} overflow-hidden`}>
                <img
                  src={heroData.mainImage}
                  alt={displayName}
                  className="w-full h-64 md:h-96 object-cover"
                />
              </div>
            )}
            <div className="text-center">
              <h1
                className={`${fontSizes.heading.h1} font-bold mb-2`}
                style={{ color: colors.primary }}
              >
                {displayName}
              </h1>
              {dateRange && <p className={`${fontSizes.body} mb-4 opacity-90`}>{dateRange}</p>}
              {heroData?.subtitle && (
                <p className={`${fontSizes.body} mb-4 italic opacity-80`}>{heroData.subtitle}</p>
              )}
              {heroData?.quote && (
                <blockquote
                  className={`${fontSizes.body} italic mt-6 max-w-2xl mx-auto opacity-75`}
                >
                  &ldquo;{heroData.quote}&rdquo;
                </blockquote>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Biography Section */}
      {supportedSections.includes("BIOGRAPHY") && biographyData?.fullStory && (
        <section className={spacing.section}>
          <div className={`${containerWidth} mx-auto px-6`}>
            <h2
              className={`${fontSizes.heading.h2} font-bold mb-6`}
              style={{ color: colors.secondary }}
            >
              Life Story
            </h2>
            <div
              className={`${borderRadius} p-6`}
              style={{ backgroundColor: `${colors.primary}10` }}
            >
              <p className={`${fontSizes.body} whitespace-pre-wrap leading-relaxed`}>
                {biographyData.fullStory}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Timeline Section */}
      {supportedSections.includes("TIMELINE") &&
        timelineData?.events &&
        timelineData.events.length > 0 && (
          <section className={spacing.section}>
            <div className={`${containerWidth} mx-auto px-6`}>
              <h2
                className={`${fontSizes.heading.h2} font-bold mb-6`}
                style={{ color: colors.secondary }}
              >
                Life Timeline
              </h2>
              <div className={spacing.container}>
                {timelineData.events.map((event) => (
                  <div
                    key={event.id}
                    className={`flex gap-4 ${borderRadius} p-4`}
                    style={{ backgroundColor: `${colors.accent}10` }}
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={`w-12 h-12 ${borderRadius} flex items-center justify-center`}
                        style={{ backgroundColor: colors.accent }}
                      >
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm opacity-70 mb-1`}>{formatDate(event.date)}</p>
                      <h3 className={`${fontSizes.heading.h3} font-semibold mb-2`}>
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className={`${fontSizes.body} opacity-80`}>{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      {/* Gallery Section */}
      {supportedSections.includes("GALLERY") &&
        galleryData?.items &&
        galleryData.items.length > 0 && (
          <section className={spacing.section}>
            <div className={`${containerWidth} mx-auto px-6`}>
              <h2
                className={`${fontSizes.heading.h2} font-bold mb-6`}
                style={{ color: colors.secondary }}
              >
                Photo Gallery
              </h2>
              <div
                className={`grid ${
                  galleryData.layout === "masonry"
                    ? "grid-cols-2 md:grid-cols-3"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                } gap-4`}
              >
                {galleryData.items.map((item, index) => (
                  <div key={index} className={`${borderRadius} overflow-hidden`}>
                    <img
                      src={item.url}
                      alt={item.caption || `Photo ${index + 1}`}
                      className="w-full h-64 object-cover"
                    />
                    {item.caption && (
                      <p className={`${fontSizes.body} text-sm p-2 text-center opacity-80`}>
                        {item.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      {/* Achievements Section */}
      {supportedSections.includes("ACHIEVEMENTS") &&
        achievementsData?.achievements &&
        achievementsData.achievements.length > 0 && (
          <section className={spacing.section}>
            <div className={`${containerWidth} mx-auto px-6`}>
              <h2
                className={`${fontSizes.heading.h2} font-bold mb-6`}
                style={{ color: colors.secondary }}
              >
                Achievements & Awards
              </h2>
              <div className={spacing.container}>
                {achievementsData.achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 ${borderRadius} p-4`}
                    style={{ backgroundColor: `${colors.secondary}10` }}
                  >
                    <Award className="w-8 h-8 flex-shrink-0" style={{ color: colors.accent }} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`${fontSizes.heading.h3} font-semibold`}>
                          {achievement.title}
                        </h3>
                        {achievement.year && (
                          <span className="text-sm opacity-70">{achievement.year}</span>
                        )}
                      </div>
                      {achievement.description && (
                        <p className={`${fontSizes.body} opacity-80`}>{achievement.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      {/* Quotes Section */}
      {supportedSections.includes("QUOTES") &&
        quotesData?.quotes &&
        quotesData.quotes.length > 0 && (
          <section className={spacing.section}>
            <div className={`${containerWidth} mx-auto px-6`}>
              <h2
                className={`${fontSizes.heading.h2} font-bold mb-6`}
                style={{ color: colors.secondary }}
              >
                Memorable Quotes
              </h2>
              <div className={spacing.container}>
                {quotesData.quotes.map((quote, index) => (
                  <blockquote
                    key={index}
                    className={`${borderRadius} p-6 relative`}
                    style={{ backgroundColor: `${colors.primary}10` }}
                  >
                    <Quote
                      className="w-8 h-8 absolute top-4 left-4 opacity-20"
                      style={{ color: colors.primary }}
                    />
                    <p className={`${fontSizes.body} italic mb-2 pl-10`}>
                      &ldquo;{quote.text}&rdquo;
                    </p>
                    {quote.author && (
                      <footer className={`text-sm opacity-70 pl-10`}>— {quote.author}</footer>
                    )}
                  </blockquote>
                ))}
              </div>
            </div>
          </section>
        )}

      {/* Tributes Section */}
      {supportedSections.includes("TRIBUTES") &&
        tributesData?.tributes &&
        tributesData.tributes.length > 0 && (
          <section className={spacing.section}>
            <div className={`${containerWidth} mx-auto px-6`}>
              <h2
                className={`${fontSizes.heading.h2} font-bold mb-6`}
                style={{ color: colors.secondary }}
              >
                Tributes & Messages
              </h2>
              <div className={spacing.container}>
                {tributesData.tributes.map((tribute, index) => (
                  <div
                    key={index}
                    className={`${borderRadius} p-6`}
                    style={{ backgroundColor: `${colors.accent}10` }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <Heart
                        className="w-5 h-5 flex-shrink-0 mt-1"
                        style={{ color: colors.accent }}
                      />
                      <div>
                        <p className={`font-semibold`}>{tribute.author}</p>
                        {tribute.relationship && (
                          <p className="text-sm opacity-70">{tribute.relationship}</p>
                        )}
                      </div>
                    </div>
                    <p className={`${fontSizes.body} opacity-90`}>{tribute.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      {/* Empty State */}
      {supportedSections.length === 0 && (
        <div className={`${containerWidth} mx-auto px-6 py-24 text-center`}>
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <h2 className={`${fontSizes.heading.h2} font-bold mb-2 opacity-50`}>
            Preview Your Memorial
          </h2>
          <p className={`${fontSizes.body} opacity-40`}>
            Add content in the editor to see it rendered here
          </p>
        </div>
      )}

      {/* Footer */}
      <footer
        className={`${spacing.section} text-center border-t`}
        style={{ borderColor: `${colors.primary}20` }}
      >
        <div className={`${containerWidth} mx-auto px-6`}>
          <p className={`${fontSizes.body} opacity-60`}>
            Created with love • ForeverPages Memorial Builder
          </p>
        </div>
      </footer>
    </div>
  );
};
