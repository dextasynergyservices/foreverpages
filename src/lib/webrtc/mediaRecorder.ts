import { getTargetBitrate, STREAM_QUALITY_PRESETS } from "./config";

/**
 * StreamRecorder - Handles browser-based stream recording using MediaRecorder API
 *
 * Features:
 * - Automatic codec selection (VP9 > VP8 > H.264)
 * - Chunked recording (10-second chunks for reliability)
 * - Quality-based bitrate configuration
 * - Automatic upload to Cloudinary after recording
 */

type StreamQuality = keyof typeof STREAM_QUALITY_PRESETS;

export class StreamRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream;
  private streamId: string;
  private quality: StreamQuality;
  private onUploadProgress?: (progress: number) => void;
  private onUploadComplete?: (url: string) => void;
  private onUploadError?: (error: Error) => void;

  constructor(
    stream: MediaStream,
    streamId: string,
    quality: StreamQuality = "FULL_HD",
    callbacks?: {
      onUploadProgress?: (progress: number) => void;
      onUploadComplete?: (url: string) => void;
      onUploadError?: (error: Error) => void;
    }
  ) {
    this.stream = stream;
    this.streamId = streamId;
    this.quality = quality;
    this.onUploadProgress = callbacks?.onUploadProgress;
    this.onUploadComplete = callbacks?.onUploadComplete;
    this.onUploadError = callbacks?.onUploadError;
  }

  /**
   * Check if browser supports recording
   */
  static isSupported(): boolean {
    return typeof MediaRecorder !== "undefined";
  }

  /**
   * Get the best supported video codec
   */
  private getSupportedOptions(): MediaRecorderOptions {
    const bitrate = getTargetBitrate(this.quality);

    // Try codecs in order of preference
    const codecOptions: MediaRecorderOptions[] = [
      // VP9 (best quality, good compression)
      {
        mimeType: "video/webm;codecs=vp9,opus",
        videoBitsPerSecond: bitrate,
        audioBitsPerSecond: 128000,
      },
      // VP8 (good quality, wide support)
      {
        mimeType: "video/webm;codecs=vp8,opus",
        videoBitsPerSecond: bitrate,
        audioBitsPerSecond: 128000,
      },
      // H.264 (best compatibility)
      {
        mimeType: "video/webm;codecs=h264,opus",
        videoBitsPerSecond: bitrate,
        audioBitsPerSecond: 128000,
      },
      // Fallback to any WebM
      {
        mimeType: "video/webm",
        videoBitsPerSecond: bitrate,
        audioBitsPerSecond: 128000,
      },
      // Last resort: MP4 (Safari)
      {
        mimeType: "video/mp4",
        videoBitsPerSecond: bitrate,
        audioBitsPerSecond: 128000,
      },
    ];

    // Find first supported option
    for (const option of codecOptions) {
      if (option.mimeType && MediaRecorder.isTypeSupported(option.mimeType)) {
        console.log("✅ Using codec:", option.mimeType);
        return option;
      }
    }

    // No specific codec supported, use browser default
    console.log("⚠️ Using browser default codec");
    return {
      videoBitsPerSecond: bitrate,
      audioBitsPerSecond: 128000,
    };
  }

  /**
   * Start recording the stream
   */
  async start(): Promise<void> {
    if (!StreamRecorder.isSupported()) {
      throw new Error("MediaRecorder is not supported in this browser");
    }

    if (this.mediaRecorder) {
      throw new Error("Recording already in progress");
    }

    const options = this.getSupportedOptions();

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, options);

      // Collect recorded data
      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.chunks.push(event.data);
          console.log(
            `📼 Recording chunk: ${event.data.size} bytes (total: ${this.chunks.length} chunks)`
          );
        }
      };

      // Handle recording stop
      this.mediaRecorder.onstop = async () => {
        console.log("🛑 Recording stopped, uploading...");
        await this.uploadRecording();
      };

      // Handle errors
      this.mediaRecorder.onerror = (event: Event) => {
        console.error("❌ Recording error:", event);
        this.onUploadError?.(new Error("Recording failed"));
      };

      // Start recording in 10-second chunks for reliability
      // This ensures we don't lose everything if browser crashes
      this.mediaRecorder.start(10000);
      console.log("🔴 Recording started");
    } catch (error) {
      console.error("Failed to start recording:", error);
      throw error;
    }
  }

  /**
   * Stop recording
   */
  stop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
  }

  /**
   * Pause recording (if supported)
   */
  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.pause();
    }
  }

  /**
   * Resume recording (if supported)
   */
  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === "paused") {
      this.mediaRecorder.resume();
    }
  }

  /**
   * Get current recording state
   */
  getState(): RecordingState | null {
    return this.mediaRecorder?.state || null;
  }

  /**
   * Upload the recording to the server
   */
  private async uploadRecording(): Promise<void> {
    if (this.chunks.length === 0) {
      console.warn("⚠️ No recording data to upload");
      return;
    }

    try {
      // Combine all chunks into a single blob
      const mimeType = this.mediaRecorder?.mimeType || "video/webm";
      const blob = new Blob(this.chunks, { type: mimeType });
      const fileSize = blob.size;

      console.log(`📤 Uploading recording: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

      // Create form data
      const formData = new FormData();
      const extension = mimeType.includes("mp4") ? "mp4" : "webm";
      const filename = `stream-${this.streamId}-${Date.now()}.${extension}`;

      formData.append("video", blob, filename);
      formData.append("streamId", this.streamId);
      formData.append("quality", this.quality);

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          this.onUploadProgress?.(progress);
          console.log(`📤 Upload progress: ${progress.toFixed(1)}%`);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            // Server returns { stream: { recordingUrl: string, ... } }
            const recordingUrl = response?.stream?.recordingUrl || response?.url || null;
            console.log("✅ Recording uploaded successfully:", recordingUrl ?? response);
            if (recordingUrl) {
              this.onUploadComplete?.(recordingUrl);
            } else {
              // If no URL was returned, still resolve with raw response
              this.onUploadComplete?.(JSON.stringify(response));
            }
          } catch (err) {
            console.warn("Uploaded but failed to parse response:", err, xhr.responseText);
            this.onUploadComplete?.(xhr.responseText);
          }
        } else {
          const error = new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`);
          console.error("❌ Upload failed:", error);
          this.onUploadError?.(error);
        }
      };

      xhr.onerror = () => {
        const error = new Error("Network error during upload");
        console.error("❌ Upload error:", error);
        this.onUploadError?.(error);
      };

      // POST to the stream-scoped upload endpoint so the server can associate the file
      xhr.open("POST", `/api/streams/${encodeURIComponent(this.streamId)}/upload-recording`);
      xhr.send(formData);
    } catch (error) {
      console.error("Failed to upload recording:", error);
      this.onUploadError?.(error as Error);
    } finally {
      // Clear chunks to free memory
      this.chunks = [];
    }
  }

  /**
   * Get estimated file size (approximate)
   */
  getEstimatedSize(): number {
    return this.chunks.reduce((total, chunk) => total + chunk.size, 0);
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.mediaRecorder) {
      if (this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      }
      this.mediaRecorder = null;
    }
    this.chunks = [];
  }
}
