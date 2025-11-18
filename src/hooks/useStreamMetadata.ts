import { useQuery } from "@tanstack/react-query";

export type StreamMeta = {
  id: string;
  status?: string;
  recordingUrl?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  streamQuality?: string;
  viewers?: number;
};

export function useStreamMetadata(streamId?: string) {
  return useQuery<StreamMeta | undefined>({
    queryKey: ["stream", streamId],
    queryFn: async () => {
      if (!streamId) return undefined;
      const res = await fetch(`/api/streams/${streamId}`);
      if (!res.ok) throw new Error("Failed to fetch stream metadata");
      const j = await res.json();
      // API returns { stream: {...} } for this endpoint. Normalize to return the
      // stream object directly so consumers (and setQueryData merges) operate
      // on the StreamMeta shape.
      return (j && j.stream) || j;
    },
    enabled: !!streamId,
    // Poll for changes so viewers detect when a stream becomes LIVE quickly.
    // 5s is a reasonable tradeoff for near-real-time UX without excessive load.
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
    staleTime: 5_000,
  });
}
