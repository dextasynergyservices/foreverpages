"use client";

import React from "react";
import type { Template, UserTemplate, Memorial } from "@/generated/prisma";
import { TemplateProvider } from "@/app/templates/peace-template/TemplateProvider";
import { Navbar } from "@/app/templates/peace-template/components/Navbar";
import { HeroModern } from "@/app/templates/peace-template/components/HeroModern";
import { Biography } from "@/app/templates/peace-template/components/Biography";
import { TimelineHorizontal } from "@/app/templates/peace-template/components/TimelineHorizontal";
import { GalleryModern } from "@/app/templates/peace-template/components/GalleryModern";
import { VideoTributes } from "@/app/templates/peace-template/components/VideoTributes";
import { TributesModern } from "@/app/templates/peace-template/components/TributesModern";
import { FamilyTree } from "@/app/templates/peace-template/components/FamilyTree";

interface MemorialTemplateProps {
  memorial: Memorial & {
    owner?: {
      id: string;
      name: string | null;
      email: string;
      accountDetails?: unknown[];
    };
  };
  userTemplate: UserTemplate & {
    baseTemplate: Template;
  };
  config?: Record<string, unknown>;
}

export const PeaceMemorialTemplate: React.FC<MemorialTemplateProps> = ({
  memorial,
  userTemplate,
}) => {
  // Safely convert customization - peace template expects different DesignTokens format
  let customization: Record<string, unknown> | null = null;
  try {
    if (userTemplate.customization && typeof userTemplate.customization === "object") {
      customization = userTemplate.customization as Record<string, unknown>;
    }
  } catch (error) {
    console.warn("Failed to parse user customization:", error);
  }

  // Safely convert sections to sections data
  let sectionsData = {};
  try {
    if (userTemplate.sections && typeof userTemplate.sections === "object") {
      sectionsData = userTemplate.sections as Record<string, unknown>;
    }
  } catch (error) {
    console.warn("Failed to parse user sections:", error);
  }

  // Convert memorial to expected format
  const memorialData = {
    id: memorial.id,
    firstName: memorial.firstName,
    lastName: memorial.lastName,
    birthDate: memorial.birthDate,
    deathDate: memorial.deathDate,
    biography: memorial.biography,
    profileImage: memorial.profilePhoto,
  };

  // Extract owner data for donation modal
  const memorialOwner = memorial.owner
    ? {
        id: memorial.owner.id,
        firstName: memorial.owner.name?.split(" ")[0] || null,
        lastName: memorial.owner.name?.split(" ").slice(1).join(" ") || null,
        email: memorial.owner.email,
        accountDetails: memorial.owner.accountDetails || [],
      }
    : null;

  return (
    <TemplateProvider
      customization={customization}
      sectionsData={sectionsData}
      memorial={memorialData}
      memorialOwner={memorialOwner}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Optimizations for preview scrolling */}
        <style jsx global>{`
          .template-preview {
            /* Ensure smooth scrolling */
            scroll-behavior: smooth;
            /* Optimize for preview container */
            contain: layout style;
          }
        `}</style>
        <Navbar />
        <main>
          <HeroModern />
          <Biography />
          <TimelineHorizontal />
          <GalleryModern />
          <VideoTributes />
          <TributesModern />
          <FamilyTree />
        </main>
      </div>
    </TemplateProvider>
  );
};

export default PeaceMemorialTemplate;
