import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload livestream recording to Cloudinary
 */
export async function uploadStreamRecording(
  videoBuffer: Buffer,
  options: {
    streamId: string;
    quality: string;
    filename?: string;
  }
): Promise<{
  url: string;
  secureUrl: string;
  publicId: string;
  duration: number;
  width: number;
  height: number;
  format: string;
  bytes: number;
}> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: "livestream-recordings",
        upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_VIDEO,
        public_id: options.filename || `stream-${options.streamId}-${Date.now()}`,
        // Apply transformations for optimization
        transformation: [
          { quality: "auto", fetch_format: "auto" },
          { width: 1920, crop: "limit" }, // Max 1920px width
        ],
        // Video-specific settings
        eager: [
          { width: 640, height: 360, crop: "limit", format: "jpg" }, // Thumbnail
        ],
        eager_async: true,
        // Metadata
        context: {
          streamId: options.streamId,
          quality: options.quality,
          uploadedAt: new Date().toISOString(),
        },
        // Access control
        access_mode: "public",
      },
      (error, result) => {
        if (error) {
          console.error("❌ Cloudinary upload failed:", error);
          reject(error);
        } else if (result) {
          console.log("✅ Video uploaded to Cloudinary:", result.secure_url);
          resolve({
            url: result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
            duration: result.duration || 0,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        }
      }
    );

    uploadStream.end(videoBuffer);
  });
}

/**
 * Delete recording from Cloudinary
 */
export async function deleteStreamRecording(publicId: string): Promise<void> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "video",
    });
    console.log("🗑️ Video deleted from Cloudinary:", result);
  } catch (error) {
    console.error("❌ Failed to delete video from Cloudinary:", error);
    throw error;
  }
}

/**
 * Generate video thumbnail URL
 */
export function getVideoThumbnailUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    resource_type: "video",
    format: "jpg",
    transformation: [
      { width: 640, height: 360, crop: "fill", quality: "auto" },
      { start_offset: "2" }, // Frame at 2 seconds
    ],
  });
}

/**
 * Generate streaming URL with transformations
 */
export function getStreamingUrl(
  publicId: string,
  quality: "auto" | "low" | "high" = "auto"
): string {
  const qualityMap = {
    auto: "auto",
    low: "low",
    high: "high",
  };

  return cloudinary.url(publicId, {
    resource_type: "video",
    streaming_profile: "full_hd",
    format: "m3u8", // HLS format
    transformation: [{ quality: qualityMap[quality], fetch_format: "auto" }],
  });
}

export default cloudinary;
