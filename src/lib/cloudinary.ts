import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadOptions {
  folder?: string;
  resourceType?: "image" | "video" | "raw" | "auto";
  transformation?: object[];
  format?: string;
  quality?: string | number;
  eager?: object[];
  tags?: string[];
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail_url?: string;
  created_at: string;
}

/**
 * Generate Cloudinary upload signature
 * Used for secure client-side uploads
 */
export function generateSignature(params: Record<string, string | number | boolean | string[]>): {
  signature: string;
  timestamp: number;
} {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { ...params, timestamp },
    process.env.CLOUDINARY_API_SECRET!
  );

  return { signature, timestamp };
}

/**
 * Upload file to Cloudinary (server-side)
 */
export async function uploadToCloudinary(
  file: string | Buffer,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  try {
    const uploadOptions = {
      folder: options.folder || "foreverpages",
      resource_type: options.resourceType || "auto",
      transformation: options.transformation,
      format: options.format,
      quality: options.quality || "auto:good",
      tags: options.tags || [],
      eager: options.eager || [
        // Generate thumbnail for images
        { width: 400, height: 400, crop: "limit", quality: "auto:good" },
      ],
      eager_async: true,
    };

    const result = await cloudinary.uploader.upload(file as string, uploadOptions);

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      duration: result.duration,
      thumbnail_url: result.eager?.[0]?.secure_url || result.secure_url,
      created_at: result.created_at,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload file to Cloudinary");
  }
}

/**
 * Delete file from Cloudinary
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete file from Cloudinary");
  }
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
    gravity?: string;
  } = {}
): string {
  const {
    width,
    height,
    crop = "limit",
    quality = "auto:good",
    format = "auto",
    gravity,
  } = options;

  return cloudinary.url(publicId, {
    transformation: [
      {
        width,
        height,
        crop,
        quality,
        fetch_format: format,
        gravity,
      },
    ],
    secure: true,
  });
}

/**
 * Get video thumbnail URL
 */
export function getVideoThumbnailUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    startOffset?: number;
  } = {}
): string {
  const { width = 640, height = 360, startOffset } = options;

  return cloudinary.url(publicId, {
    resource_type: "video",
    transformation: [
      {
        width,
        height,
        crop: "fill",
        quality: "auto",
        start_offset: startOffset || "auto",
      },
    ],
    format: "jpg",
    secure: true,
  });
}

/**
 * Extract public ID from Cloudinary URL
 */
export function extractPublicId(url: string): string | null {
  try {
    const regex = /\/v\d+\/(.+?)\.(?:jpg|jpeg|png|gif|webp|mp4|mov|avi)/i;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Validate file type and size
 */
export function validateFile(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSizeMB = 50, // 50MB default
    allowedTypes = ["image/*", "video/*"],
    allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov", "avi", "wmv"],
  } = options;

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // Check file type
  const fileType = file.type;
  const isTypeAllowed = allowedTypes.some((type) => {
    if (type.endsWith("/*")) {
      return fileType.startsWith(type.replace("/*", ""));
    }
    return fileType === type;
  });

  if (!isTypeAllowed) {
    return {
      valid: false,
      error: "File type not allowed",
    };
  }

  // Check file extension
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension .${extension} not allowed`,
    };
  }

  return { valid: true };
}

/**
 * Get Cloudinary upload preset based on file type
 */
export function getUploadPreset(type: "image" | "video"): string {
  return type === "image"
    ? process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_IMAGE || "foreverpages_images"
    : process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_VIDEO || "foreverpages_videos";
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export default cloudinary;
