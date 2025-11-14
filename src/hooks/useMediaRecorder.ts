import { useState, useRef, useCallback, useEffect } from "react";

export type RecordingQuality = "low" | "medium" | "high" | "ultra";

interface RecordingChunk {
  blob: Blob;
  timestamp: number;
  size: number;
}

interface UseMediaRecorderOptions {
  streamId: string;
  stream: MediaStream | null;
  quality?: RecordingQuality;
  autoDownload?: boolean;
  onChunkReady?: (chunk: RecordingChunk) => void;
  onRecordingComplete?: (recording: { blob: Blob; duration: number; size: number }) => void;
  onError?: (error: Error) => void;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // in seconds
  size: number; // in bytes
  error: string | null;
}

const QUALITY_BITRATES: Record<RecordingQuality, number> = {
  low: 500000, // 500 kbps
  medium: 1500000, // 1.5 Mbps
  high: 3000000, // 3 Mbps
  ultra: 6000000, // 6 Mbps
};

const CHUNK_INTERVAL = 10000; // 10 seconds

export function useMediaRecorder({
  streamId,
  stream,
  quality = "high",
  autoDownload = false,
  onChunkReady,
  onRecordingComplete,
  onError,
}: UseMediaRecorderOptions) {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    size: 0,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update duration every second
  useEffect(() => {
    if (state.isRecording && !state.isPaused) {
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setState((prev) => ({ ...prev, duration: elapsed }));
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [state.isRecording, state.isPaused]);

  const startRecording = useCallback(async () => {
    if (!stream) {
      const error = new Error("No media stream available");
      setState((prev) => ({ ...prev, error: error.message }));
      onError?.(error);
      return;
    }

    try {
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        throw new Error("MediaRecorder API is not supported in this browser");
      }

      // Get supported MIME type
      const mimeTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4",
      ];

      let selectedMimeType = "";
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error("No supported video MIME type found");
      }

      // Create MediaRecorder with quality settings
      const options: MediaRecorderOptions = {
        mimeType: selectedMimeType,
        videoBitsPerSecond: QUALITY_BITRATES[quality],
      };

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      // Handle data available (chunks)
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);

          const chunk: RecordingChunk = {
            blob: event.data,
            timestamp: Date.now(),
            size: event.data.size,
          };

          setState((prev) => ({
            ...prev,
            size: prev.size + event.data.size,
          }));

          // Notify chunk ready for progressive upload
          onChunkReady?.(chunk);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const blob = new Blob(chunksRef.current, { type: selectedMimeType });
        const size = blob.size;

        // Auto-download if enabled
        if (autoDownload) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `stream-${streamId}-${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }

        // Notify recording complete
        onRecordingComplete?.({ blob, duration, size });

        setState((prev) => ({
          ...prev,
          isRecording: false,
          isPaused: false,
        }));

        chunksRef.current = [];
      };

      // Handle errors
      mediaRecorder.onerror = (event) => {
        const error = new Error(`MediaRecorder error: ${event}`);
        setState((prev) => ({
          ...prev,
          error: error.message,
          isRecording: false,
        }));
        onError?.(error);
      };

      // Start recording with time slices for chunking
      mediaRecorder.start(CHUNK_INTERVAL);

      setState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        size: 0,
        error: null,
      });

      // Update recording status in database
      await fetch(`/api/streams/${streamId}/recording/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quality }),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Failed to start recording");
      setState((prev) => ({ ...prev, error: err.message }));
      onError?.(err);
    }
  }, [stream, streamId, quality, autoDownload, onChunkReady, onRecordingComplete, onError]);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();

      // Update recording status in database
      await fetch(`/api/streams/${streamId}/recording/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration: state.duration,
          size: state.size,
        }),
      });
    }
  }, [streamId, state.isRecording, state.duration, state.size]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause();
      setState((prev) => ({ ...prev, isPaused: true }));
    }
  }, [state.isRecording, state.isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume();
      setState((prev) => ({ ...prev, isPaused: false }));
    }
  }, [state.isRecording, state.isPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && state.isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [state.isRecording]);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  };
}
