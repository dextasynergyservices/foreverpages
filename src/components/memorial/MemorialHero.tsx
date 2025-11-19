"use client";

import { StreamStatus, StreamQuality } from "@/generated/prisma";
import LivestreamViewer from "@/components/memorial/LivestreamViewer";
import NormalHero from "@/components/memorial/NormalHero";
import PasswordProtectionModal from "@/components/memorial/PasswordProtectionModal";
import { useStreamMetadata } from "@/hooks/useStreamMetadata";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

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
  // clientActiveStream holds a LIVE stream obtained via client lookup
  // (e.g. broadcaster started after SSR). We prefer this over the SSR
  // `activeStream` when present.
  const [clientActiveStream, setClientActiveStream] = useState<ActiveStream | null>(null);

  // Query the stream ID we should be watching: prefer clientActiveStream id
  const streamIdToQuery = clientActiveStream?.id ?? activeStream?.id;
  const streamMetaQuery = useStreamMetadata(streamIdToQuery);
  const liveStreamData = streamMetaQuery.data;

  const queryClient = useQueryClient();

  // Effect A: when SSR didn't include an activeStream (or it isn't LIVE),
  // try to discover a LIVE stream for this memorial.
  useEffect(() => {
    const shouldLookupLive = !activeStream || activeStream.status !== "LIVE";
    if (!shouldLookupLive) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/memorials/${memorial.id}/active-stream`);
        if (!res.ok || cancelled) return;
        const j = await res.json();
        const payload = (j && j.stream) || j;
        if (cancelled) return;
        if (payload && payload.status === "LIVE") {
          // sanitize recordingUrl just in case
          if (payload.recordingUrl) payload.recordingUrl = null;
          queryClient.setQueryData(["stream", payload.id], payload);
          setClientActiveStream(payload);
          return;
        }
        setClientActiveStream(null);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.debug("[MemorialHero] active-stream lookup failed:", err);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeStream, memorial.id, queryClient]);

  // Effect B: if there is an SSR activeStream id, fetch its freshest metadata
  // to seed the query cache (and sanitize recordingUrl for public pages) yes.
  useEffect(() => {
    if (!activeStream?.id) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/streams/${activeStream.id}`);
        if (!res.ok || cancelled) return;
        const j = await res.json();
        const payload = (j && j.stream) || j;
        if (cancelled || !payload) return;
        if (payload.recordingUrl) {
          // clone object to avoid mutating response
          const sanitized = { ...payload, recordingUrl: null };
          queryClient.setQueryData(["stream", activeStream.id], sanitized);
        } else {
          queryClient.setQueryData(["stream", activeStream.id], payload);
        }
        if (process.env.NODE_ENV !== "production") {
          console.debug("[MemorialHero] fetched latest stream metadata:", payload);
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.debug("[MemorialHero] failed to fetch stream metadata:", err);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeStream?.id, queryClient]);

  const selectedStream = clientActiveStream ?? activeStream;
  const effectiveStatus = liveStreamData?.status ?? selectedStream?.status;

  const shouldShowLivestream =
    !!selectedStream && (effectiveStatus === "LIVE" || effectiveStatus === "PAUSED");

  if (!shouldShowLivestream) {
    return <NormalHero memorial={memorial} />;
  }

  // Show livestream viewer
  return (
    <>
      {/* Dev overlay: helps inspect live vs SSR stream metadata when debugging */}
      {process.env.NODE_ENV !== "production" && (
        <div className="absolute top-24 right-4 z-50 bg-black/70 text-white text-xs p-2 rounded max-w-sm">
          <div className="font-semibold">Dev: stream debug</div>
          <div>effectiveStatus: {String(effectiveStatus)}</div>
          <details className="mt-2">
            <summary className="cursor-pointer">liveStreamData</summary>
            <pre className="whitespace-pre-wrap max-h-48 overflow-auto">
              {JSON.stringify(liveStreamData, null, 2)}
            </pre>
          </details>
          <details className="mt-2">
            <summary className="cursor-pointer">activeStream (SSR)</summary>
            <pre className="whitespace-pre-wrap max-h-48 overflow-auto">
              {JSON.stringify(activeStream, null, 2)}
            </pre>
          </details>
        </div>
      )}
      <LivestreamViewer memorial={memorial} stream={selectedStream} isLocked={requiresPassword} />

      {/* Password Protection Modal - guard against null selectedStream */}
      {requiresPassword && selectedStream && (
        <PasswordProtectionModal streamId={selectedStream.id} onSuccess={onPasswordVerified} />
      )}
    </>
  );
}
