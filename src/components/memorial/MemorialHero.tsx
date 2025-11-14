"use client";

import { StreamStatus, StreamQuality } from "@/generated/prisma";
import LivestreamViewer from "@/components/memorial/LivestreamViewer";
import NormalHero from "@/components/memorial/NormalHero";
import PasswordProtectionModal from "@/components/memorial/PasswordProtectionModal";

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

interface MemorialHeroProps {
  memorial: Memorial;
  activeStream: ActiveStream | null;
  requiresPassword?: boolean;
  onPasswordVerified: () => void;
}

export default function MemorialHero({
  memorial,
  activeStream,
  requiresPassword = false,
  onPasswordVerified,
}: MemorialHeroProps) {
  // Determine if we should show the livestream
  const shouldShowLivestream =
    activeStream &&
    (activeStream.status === "LIVE" ||
      activeStream.status === "PAUSED" ||
      // Show recording if stream ended and has recording
      (activeStream.status === "ENDED" && activeStream.recordingUrl));

  // Show normal hero if:
  // 1. No active stream
  // 2. Stream is scheduled but not started yet
  // 3. Stream ended without recording
  if (!shouldShowLivestream) {
    return <NormalHero memorial={memorial} />;
  }

  // Show livestream viewer
  return (
    <>
      <LivestreamViewer memorial={memorial} stream={activeStream} isLocked={requiresPassword} />

      {/* Password Protection Modal */}
      {requiresPassword && (
        <PasswordProtectionModal streamId={activeStream.id} onSuccess={onPasswordVerified} />
      )}
    </>
  );
}
