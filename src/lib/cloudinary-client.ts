// Client-safe Cloudinary helpers — do NOT import the server-side Cloudinary SDK here.
// These helpers construct Cloudinary URLs using the public cloud name and simple
// transformation parameters so they can be used inside client components.

export function getOptimizedImageUrl(
  publicId: string | null | undefined,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
    gravity?: string;
    resourceType?: "image" | "video" | "auto";
  } = {}
): string {
  if (!publicId) return "";

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return publicId;

  const {
    width,
    height,
    crop = "limit",
    quality = "auto:good",
    format = "auto",
    gravity,
    resourceType = "image",
  } = options;

  const transformations: string[] = [];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);
  if (quality) transformations.push(`q_${quality}`);
  if (gravity) transformations.push(`g_${gravity}`);
  if (format && format !== "auto") transformations.push(`f_${format}`);

  const transformationPath = transformations.length > 0 ? transformations.join(",") + "/" : "";

  // Ensure publicId does not start with a slash
  const cleanedPublicId = publicId.replace(/^\/+/, "");

  // Build URL: https://res.cloudinary.com/<cloudName>/<resource_type>/upload/<transformations>/<publicId>
  const rt = resourceType === "auto" ? "image" : resourceType;
  return `https://res.cloudinary.com/${cloudName}/${rt}/upload/${transformationPath}${cleanedPublicId}`;
}

export function extractPublicId(url: string): string | null {
  if (!url) return null;
  try {
    // Try to extract the part after /upload/ and before any extension or query params
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) return null;
    const afterUpload = url.substring(uploadIndex + "/upload/".length);
    // Remove any transformation prefixes (they contain slashes and commas). The public id usually comes after them.
    // If the URL contains /v{number}/... we remove up to that too.
    const vMatch = afterUpload.match(/v\d+\//);
    const withoutVersion = vMatch ? afterUpload.split(vMatch[0])[1] || afterUpload : afterUpload;

    // Remove query string
    const withoutQuery = withoutVersion.split("?")[0];
    // Remove format extension if present
    const withoutExt = withoutQuery.replace(/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|svg)$/i, "");
    return withoutExt || null;
  } catch {
    return null;
  }
}

// Named exports only; no default export to avoid unused export warnings in client bundles.
