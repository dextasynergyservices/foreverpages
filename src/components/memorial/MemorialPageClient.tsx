"use client";

import { useState } from "react";
import { StreamStatus, StreamQuality, UserTemplate, Template, Memorial } from "@/generated/prisma";
import MemorialHero from "@/components/memorial/MemorialHero";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TemplateRenderer } from "@/components/templates/base/TemplateRenderer";

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
  userTemplate:
    | (UserTemplate & {
        baseTemplate: Template;
      })
    | null;
}

interface MemorialPageClientProps {
  memorial: MemorialWithTemplate;
  activeStream: ActiveStream | null;
}

export default function MemorialPageClient({ memorial, activeStream }: MemorialPageClientProps) {
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);

  // Check if stream requires password and is not verified
  const requiresPassword =
    activeStream && activeStream.password && !activeStream.isPublic && !isPasswordVerified;

  // If memorial has a template, use the template system
  if (memorial.userTemplate) {
    return <TemplateRenderer userTemplate={memorial.userTemplate} memorial={memorial} />;
  }

  // Fallback to legacy hardcoded layout
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Dynamic Hero Section */}
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

        {/* TODO: Photo Gallery Section */}
        {/* TODO: Tribute Wall Section */}
        {/* TODO: Service Information Section */}
      </main>

      <Footer />
    </div>
  );
}
