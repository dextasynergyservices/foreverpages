export const WEBRTC_CONFIG: RTCConfiguration = {
  iceServers: [
    // Google's free STUN servers (prioritize closest)
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },

    // Metered.ca TURN servers (only essential ones for low latency)
    {
      urls: "turn:a.relay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10, // Pre-gather ICE candidates for faster connection
  iceTransportPolicy: "all", // Allow all candidates for better connectivity
  bundlePolicy: "max-bundle", // Bundle media for efficiency
  rtcpMuxPolicy: "require", // Require RTCP muxing for lower latency
};

/**
 * Stream Quality Presets
 * Matches the StreamQuality enum from Prisma schema
 */
export const STREAM_QUALITY_PRESETS = {
  LOWEST: {
    video: {
      width: { ideal: 256 },
      height: { ideal: 144 },
      frameRate: { ideal: 15, max: 20 },
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      latency: 0.01, // Minimize audio latency
      sampleRate: 48000,
      channelCount: 1, // Mono for lower latency
    },
    bitrate: 200000, // 200 kbps
  },
  LOW: {
    video: {
      width: { ideal: 426 },
      height: { ideal: 240 },
      frameRate: { ideal: 20, max: 25 },
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      latency: 0.01,
      sampleRate: 48000,
      channelCount: 1,
    },
    bitrate: 400000, // 400 kbps
  },
  MEDIUM: {
    video: {
      width: { ideal: 640 },
      height: { ideal: 360 },
      frameRate: { ideal: 25, max: 30 },
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      latency: 0.01,
      sampleRate: 48000,
      channelCount: 2, // Stereo for medium quality
    },
    bitrate: 800000, // 800 kbps
  },
  SD: {
    video: {
      width: { ideal: 854 },
      height: { ideal: 480 },
      frameRate: { ideal: 30 },
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      latency: 0.01,
      sampleRate: 48000,
      channelCount: 2,
    },
    bitrate: 1500000, // 1.5 Mbps
  },
  HD: {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      latency: 0.01,
      sampleRate: 48000,
      channelCount: 2,
    },
    bitrate: 2500000, // 2.5 Mbps
  },
  FULL_HD: {
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 },
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      latency: 0.01,
      sampleRate: 48000,
      channelCount: 2,
    },
    bitrate: 4000000, // 4 Mbps
  },
} as const;

/**
 * Get media constraints for a specific quality level
 */
export function getMediaConstraints(
  quality: keyof typeof STREAM_QUALITY_PRESETS
): MediaStreamConstraints {
  const preset = STREAM_QUALITY_PRESETS[quality];

  return {
    video: preset.video,
    audio: preset.audio,
  };
}

/**
 * Get target bitrate for a quality level
 */
export function getTargetBitrate(quality: keyof typeof STREAM_QUALITY_PRESETS): number {
  return STREAM_QUALITY_PRESETS[quality].bitrate;
}

/**
 * Network Information API types
 */
interface NetworkInformation {
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g" | "5g";
  downlink?: number;
  rtt?: number;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
  }
}

/**
 * Detect optimal quality based on connection speed
 */
export async function detectOptimalQuality(): Promise<keyof typeof STREAM_QUALITY_PRESETS> {
  if (typeof window === "undefined" || !navigator.connection) {
    return "HD"; // Default to HD if Network Information API not available
  }

  const connection = navigator.connection;
  const effectiveType = connection.effectiveType;

  // Map connection type to quality
  const qualityMap: Record<string, keyof typeof STREAM_QUALITY_PRESETS> = {
    "slow-2g": "LOWEST",
    "2g": "LOW",
    "3g": "MEDIUM",
    "4g": "FULL_HD",
    "5g": "FULL_HD", // 5G gets Full HD by default
  };

  return qualityMap[effectiveType || "4g"] || "HD";
}

/**
 * Check if browser supports WebRTC
 */
export function isWebRTCSupported(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return !!(
      navigator.mediaDevices &&
      "getUserMedia" in navigator.mediaDevices &&
      window.RTCPeerConnection
    );
  } catch {
    return false;
  }
}

/**
 * Get available media devices
 */
export async function getAvailableDevices() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return {
      videoDevices: [],
      audioDevices: [],
    };
  }

  const devices = await navigator.mediaDevices.enumerateDevices();

  return {
    videoDevices: devices.filter((device) => device.kind === "videoinput"),
    audioDevices: devices.filter((device) => device.kind === "audioinput"),
  };
}

/**
 * Optimized WebRTC configuration for low latency
 */
export const LOW_LATENCY_WEBRTC_CONFIG: RTCConfiguration = {
  ...WEBRTC_CONFIG,
  iceCandidatePoolSize: 5, // Smaller pool for faster initial connection
  iceTransportPolicy: "relay", // Prefer relay for faster connection in some cases
};

/**
 * Get optimized config based on connection quality
 */
export function getOptimizedWebRTCConfig(
  connectionQuality?: "excellent" | "good" | "fair" | "poor"
): RTCConfiguration {
  if (!connectionQuality || connectionQuality === "excellent" || connectionQuality === "good") {
    return WEBRTC_CONFIG; // Full config for good connections
  } else {
    return LOW_LATENCY_WEBRTC_CONFIG; // Optimized config for slower connections
  }
}
