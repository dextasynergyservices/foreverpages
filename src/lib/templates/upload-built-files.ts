/**
 * Upload built template files (dist folder) to Cloudinary
 * Returns a map of file paths to their public URLs
 */

import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import path from "path";

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface UploadResult {
  [filePath: string]: string; // relative path -> public URL
}

/**
 * Recursively upload all files from dist folder to Cloudinary
 * @param templateId - Template ID for organizing files
 * @param distPath - Path to the dist folder
 * @returns Map of relative file paths to their Cloudinary URLs
 */
export async function uploadTemplateBuiltFiles(
  templateId: string,
  distPath: string
): Promise<UploadResult> {
  const result: UploadResult = {};

  async function uploadDirectory(dirPath: string, relativePath: string = "") {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        // Recursively upload subdirectories
        await uploadDirectory(fullPath, relPath);
      } else if (entry.isFile()) {
        try {
          // Determine resource type based on file extension
          const ext = path.extname(entry.name).toLowerCase();
          let resourceType: "image" | "video" | "raw" = "raw";

          if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"].includes(ext)) {
            resourceType = "image";
          } else if ([".mp4", ".webm", ".mov"].includes(ext)) {
            resourceType = "video";
          }

          // Upload to Cloudinary
          // For raw files (HTML, CSS, JS), preserve the extension in public_id
          const publicId =
            resourceType === "raw"
              ? relPath // Keep extension for raw files
              : relPath.replace(/\.[^.]+$/, ""); // Remove extension for images/videos

          const uploadResult = await cloudinary.uploader.upload(fullPath, {
            folder: `templates/${templateId}/dist`,
            public_id: publicId,
            resource_type: resourceType,
            overwrite: true,
            use_filename: true,
            unique_filename: false,
          });

          result[relPath] = uploadResult.secure_url;
          console.log(`  ✓ Uploaded: ${relPath} -> ${uploadResult.secure_url}`);
        } catch (err) {
          console.warn(`  ⚠ Failed to upload ${relPath}:`, err);
        }
      }
    }
  }

  try {
    await uploadDirectory(distPath);
    console.log(`Uploaded ${Object.keys(result).length} files from dist folder`);
  } catch (err) {
    console.error("Error uploading built files:", err);
    throw err;
  }

  return result;
}

/**
 * Delete all built files for a template from Cloudinary
 * @param templateId - Template ID
 */
export async function deleteTemplateBuiltFiles(templateId: string): Promise<void> {
  try {
    await cloudinary.api.delete_resources_by_prefix(`templates/${templateId}/dist`);
    await cloudinary.api.delete_folder(`templates/${templateId}/dist`);
    console.log(`Deleted built files for template ${templateId}`);
  } catch (err) {
    console.warn(`Failed to delete built files for template ${templateId}:`, err);
  }
}
