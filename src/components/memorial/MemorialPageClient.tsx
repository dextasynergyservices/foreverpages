"use client";

import { useState } from "react";
import { StreamStatus, StreamQuality, UserTemplate, Template, Memorial } from "@/generated/prisma";
import MemorialHero from "@/components/memorial/MemorialHero";
import LivestreamWrapper from "@/components/memorial/LivestreamWrapper";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TemplateRenderer } from "@/components/templates/base/TemplateRenderer";
import { ExpiredMemorialBanner } from "@/components/memorial/ExpiredMemorialBanner";
import { MemorialExpiryCheck } from "@/lib/utils/checkMemorialExpiry";
import { GallerySection } from "@/components/templates/sections/GallerySection";
import { TributesSection } from "@/components/templates/sections/TributesSection";

interface ActiveStream {
  id: string;
  title: string;
  description: string | null;
  status: StreamStatus;
  isPublic: boolean;
  allowComments: boolean;
  allowAnonymous: boolean;
  recordStream: boolean;
  streamQuality: StreamQuality;
  scheduledFor: string | null;
  startedAt: string | null;
  endedAt: string | null;
  recordingUrl: string | null;
  password: string | null;
  peakViewers: number;
  totalViews: number;
}

interface MemorialWithTemplate extends Memorial {
  owner?: {
    id: string;
    name: string | null;
    email: string;
    accountDetails?: unknown;
  };
  userTemplate:
    | (UserTemplate & {
        baseTemplate: Template;
      })
    | null;
}

interface MemorialPageClientProps {
  memorial: MemorialWithTemplate;
  expiryCheck: MemorialExpiryCheck;
  isOwner: boolean;
  activeStream: ActiveStream | null;
}

export default function MemorialPageClient({
  memorial,
  expiryCheck,
  isOwner,
  activeStream,
}: MemorialPageClientProps) {
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);

  // Check if stream requires password and is not verified
  const requiresPassword =
    activeStream && activeStream.password && !activeStream.isPublic && !isPasswordVerified;

  // Show expiry banner if needed (for owner preview, grace period, or expired)
  const showExpiryBanner =
    expiryCheck.reason === "expired" ||
    expiryCheck.reason === "grace_period" ||
    expiryCheck.reason === "owner_preview";

  const memorialName = `${memorial.firstName} ${memorial.lastName}`;

  // Prepare memorial data for livestream wrapper
  const memorialForLivestream = {
    id: memorial.id,
    slug: memorial.slug,
    firstName: memorial.firstName,
    lastName: memorial.lastName,
    middleName: memorial.middleName,
  };

  // If memorial has a template, use the template system wrapped with livestream support
  if (memorial.userTemplate) {
    return (
      <LivestreamWrapper memorial={memorialForLivestream} activeStream={activeStream}>
        {showExpiryBanner && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <ExpiredMemorialBanner
              expiryCheck={expiryCheck}
              isOwner={isOwner}
              memorialName={memorialName}
            />
          </div>
        )}
        <TemplateRenderer userTemplate={memorial.userTemplate} memorial={memorial} />
      </LivestreamWrapper>
    );
  }

  // Fallback to legacy hardcoded layout
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Expiry Banner for owner/grace period */}
        {showExpiryBanner && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <ExpiredMemorialBanner
              expiryCheck={expiryCheck}
              isOwner={isOwner}
              memorialName={memorialName}
            />
          </div>
        )}

        {/* Dynamic Hero Section - already handles livestream internally */}
        <MemorialHero
          memorial={{
            ...memorial,
            birthDate: memorial.birthDate.toISOString(),
            deathDate: memorial.deathDate.toISOString(),
          }}
          activeStream={activeStream}
          requiresPassword={!!requiresPassword}
          onPasswordVerified={() => setIsPasswordVerified(true)}
        />

        {/* Photo Gallery Section */}
        <GallerySection memorial={memorial} />

        {/* Tribute Wall Section */}
        <TributesSection memorial={memorial} />
      </main>

      <Footer />
    </div>
  );
}
