"use client";

import { useState } from "react";
import { StreamStatus, StreamQuality } from "@/generated/prisma";
import MemorialHero from "@/components/memorial/MemorialHero";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface Memorial {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  biography: string | null;
  birthDate: string;
  deathDate: string;
  profilePhoto: string | null;
  coverPhoto: string | null;
  allowComments: boolean;
  password: string | null;
  viewCount: number;
  candleCount: number;
}

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

interface MemorialPageClientProps {
  memorial: Memorial;
  activeStream: ActiveStream | null;
}

export default function MemorialPageClient({ memorial, activeStream }: MemorialPageClientProps) {
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);

  // Check if stream requires password and is not verified
  const requiresPassword =
    activeStream && activeStream.password && !activeStream.isPublic && !isPasswordVerified;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Dynamic Hero Section */}
        <MemorialHero
          memorial={memorial}
          activeStream={activeStream}
          requiresPassword={!!requiresPassword}
          onPasswordVerified={() => setIsPasswordVerified(true)}
        />

        {/* TODO: Photo Gallery Section */}
        {/* TODO: Tribute Wall Section */}
        {/* TODO: Service Information Section */}
      </main>

      <Footer />
    </div>
  );
}
