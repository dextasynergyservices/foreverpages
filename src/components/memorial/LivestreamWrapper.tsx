"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { StreamStatus, StreamQuality } from "@/generated/prisma";
import LivestreamViewer from "@/components/memorial/LivestreamViewer";
import PasswordProtectionModal from "@/components/memorial/PasswordProtectionModal";
import { LivestreamErrorBoundary } from "@/components/livestream/LivestreamErrorBoundary";

export interface ActiveStream {
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

interface Memorial {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
}

interface LivestreamWrapperProps {
  memorial: Memorial;
  activeStream: ActiveStream | null;
  children: React.ReactNode;
}

/**
 * LivestreamWrapper - Handles livestream display for any memorial page/template.
 *
 * When there's an active livestream (LIVE or PAUSED), this component renders
 * the LivestreamViewer prominently at the top of the page, followed by the
 * normal template content below.
 *
 * This provides a consistent livestream experience across ALL templates without
 * requiring each template to implement livestream logic individually.
 */
export default function LivestreamWrapper({
  memorial,
  activeStream: initialActiveStream,
  children,
}: LivestreamWrapperProps) {
  const queryClient = useQueryClient();
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [clientActiveStream, setClientActiveStream] = useState<ActiveStream | null>(null);

  // Effect: Poll for active livestream if SSR didn't include one
  // This catches streams that start after the page was server-rendered
  useEffect(() => {
    const shouldLookupLive = !initialActiveStream || initialActiveStream.status !== "LIVE";
    if (!shouldLookupLive) return;

    let cancelled = false;

    const checkForLiveStream = async () => {
      try {
        const res = await fetch(`/api/memorials/${memorial.id}/active-stream`);
        if (!res.ok || cancelled) return;
        const j = await res.json();
        const payload = (j && j.stream) || j;
        if (cancelled) return;

        if (payload && (payload.status === "LIVE" || payload.status === "PAUSED")) {
          // Sanitize recordingUrl for public viewers
          if (payload.recordingUrl) payload.recordingUrl = null;
          queryClient.setQueryData(["stream", payload.id], payload);
          setClientActiveStream(payload);
        } else {
          setClientActiveStream(null);
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.debug("[LivestreamWrapper] active-stream lookup failed:", err);
        }
      }
    };

    // Check immediately
    checkForLiveStream();

    // Poll every 30 seconds to catch new streams
    const interval = setInterval(checkForLiveStream, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [initialActiveStream, memorial.id, queryClient]);

  // Effect: If we have an SSR stream, fetch fresh metadata
  useEffect(() => {
    if (!initialActiveStream?.id) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/streams/${initialActiveStream.id}`);
        if (!res.ok || cancelled) return;
        const j = await res.json();
        const payload = (j && j.stream) || j;
        if (cancelled || !payload) return;

        // Sanitize and cache
        if (payload.recordingUrl) payload.recordingUrl = null;
        queryClient.setQueryData(["stream", initialActiveStream.id], payload);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.debug("[LivestreamWrapper] failed to refresh stream metadata:", err);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialActiveStream?.id, queryClient]);

  // Determine which stream to show (client-discovered takes precedence)
  const selectedStream = clientActiveStream ?? initialActiveStream;
  const effectiveStatus = selectedStream?.status;
  const shouldShowLivestream =
    !!selectedStream && (effectiveStatus === "LIVE" || effectiveStatus === "PAUSED");

  // Check if password is required
  const requiresPassword =
    selectedStream && selectedStream.password && !selectedStream.isPublic && !isPasswordVerified;

  // If no active livestream, just render the children (normal template)
  if (!shouldShowLivestream || !selectedStream) {
    return <>{children}</>;
  }

  // Show livestream viewer prominently, with template content below
  return (
    <div className="min-h-screen">
      {/* Livestream Viewer - Full width, prominent placement */}
      <LivestreamErrorBoundary
        componentType="viewer"
        memorialSlug={memorial.slug}
        onReset={() => {
          // Force re-fetch stream data on error recovery
          queryClient.invalidateQueries({ queryKey: ["stream", selectedStream.id] });
        }}
      >
        <LivestreamViewer
          memorial={{
            id: memorial.id,
            slug: memorial.slug,
            firstName: memorial.firstName,
            lastName: memorial.lastName,
            middleName: memorial.middleName,
          }}
          stream={selectedStream}
          isLocked={!!requiresPassword}
        />
      </LivestreamErrorBoundary>

      {/* Password Protection Modal */}
      {requiresPassword && (
        <PasswordProtectionModal
          streamId={selectedStream.id}
          onSuccess={() => setIsPasswordVerified(true)}
        />
      )}

      {/* Rest of the memorial content below the stream */}
      <div className="mt-8">{children}</div>
    </div>
  );
}
