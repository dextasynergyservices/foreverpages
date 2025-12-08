import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { PrismaClient, TemplateSectionType, TemplateSectionLayout } from "@/generated/prisma";

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface ProcessedAssets {
  previewImage: string | null;
  thumbnailImage: string | null;
}

/**
 * Extract and upload preview and thumbnail images from extracted template directory
 */
export async function processTemplateAssets(
  templateId: string,
  extractedDir: string
): Promise<ProcessedAssets> {
  const result: ProcessedAssets = {
    previewImage: null,
    thumbnailImage: null,
  };

  try {
    // Look for preview.png and thumbnail.png in the extracted directory
    const previewPath = findFile(extractedDir, "preview.png");
    const thumbnailPath = findFile(extractedDir, "thumbnail.png");

    // Upload preview image to Cloudinary
    if (previewPath && fs.existsSync(previewPath)) {
      console.log(`[process-assets] Uploading preview image for template ${templateId}`);
      const previewResult = await cloudinary.uploader.upload(previewPath, {
        folder: `templates/${templateId}`,
        public_id: "preview",
        overwrite: true,
        resource_type: "image",
      });
      result.previewImage = previewResult.secure_url;
      console.log(`[process-assets] ✓ Preview uploaded: ${result.previewImage}`);
    }

    // Upload thumbnail image to Cloudinary
    if (thumbnailPath && fs.existsSync(thumbnailPath)) {
      console.log(`[process-assets] Uploading thumbnail image for template ${templateId}`);
      const thumbnailResult = await cloudinary.uploader.upload(thumbnailPath, {
        folder: `templates/${templateId}`,
        public_id: "thumbnail",
        overwrite: true,
        resource_type: "image",
      });
      result.thumbnailImage = thumbnailResult.secure_url;
      console.log(`[process-assets] ✓ Thumbnail uploaded: ${result.thumbnailImage}`);
    }

    return result;
  } catch (error) {
    console.error(`[process-assets] Error processing template assets:`, error);
    return result;
  }
}

/**
 * Parse config.json and create TemplateSection entries
 */
export async function createTemplateSections(templateId: string, extractedDir: string) {
  try {
    // Find and parse config.json
    const configPath = findFile(extractedDir, "config.json");
    if (!configPath || !fs.existsSync(configPath)) {
      console.warn(`[process-sections] No config.json found for template ${templateId}`);
      return;
    }

    const configContent = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(configContent);

    if (!config.defaultConfig?.sections || !Array.isArray(config.defaultConfig.sections)) {
      console.warn(
        `[process-sections] No sections found in config.json for template ${templateId}`
      );
      return;
    }

    console.log(
      `[process-sections] Creating ${config.defaultConfig.sections.length} sections for template ${templateId}`
    );

    // Map section types from config to Prisma enum
    const sectionTypeMap: Record<string, TemplateSectionType> = {
      hero: TemplateSectionType.HERO,
      biography: TemplateSectionType.BIOGRAPHY,
      gallery: TemplateSectionType.GALLERY,
      timeline: TemplateSectionType.TIMELINE,
      family: TemplateSectionType.FAMILY_TREE,
      tributes: TemplateSectionType.TRIBUTES,
      condolences: TemplateSectionType.CONDOLENCES,
      guestbook: TemplateSectionType.GUESTBOOK,
      donations: TemplateSectionType.DONATIONS,
      funeralInfo: TemplateSectionType.FUNERAL_INFO,
      funeral_info: TemplateSectionType.FUNERAL_INFO,
      memories: TemplateSectionType.MEMORIES,
      achievements: TemplateSectionType.ACHIEVEMENTS,
      military: TemplateSectionType.MILITARY_SERVICE,
      military_service: TemplateSectionType.MILITARY_SERVICE,
      education: TemplateSectionType.EDUCATION_CAREER,
      career: TemplateSectionType.EDUCATION_CAREER,
      photos: TemplateSectionType.PHOTO_ALBUM,
      photo_album: TemplateSectionType.PHOTO_ALBUM,
      videos: TemplateSectionType.VIDEO_GALLERY,
      video_gallery: TemplateSectionType.VIDEO_GALLERY,
      audio: TemplateSectionType.AUDIO_MEMORIES,
      documents: TemplateSectionType.DOCUMENTS,
      candles: TemplateSectionType.VIRTUAL_CANDLES,
      virtual_candles: TemplateSectionType.VIRTUAL_CANDLES,
      flowers: TemplateSectionType.VIRTUAL_FLOWERS,
      virtual_flowers: TemplateSectionType.VIRTUAL_FLOWERS,
      map: TemplateSectionType.MAP_LOCATIONS,
      locations: TemplateSectionType.MAP_LOCATIONS,
      testimonials: TemplateSectionType.TESTIMONIALS,
      quotes: TemplateSectionType.QUOTES,
    };

    const layoutMap: Record<string, TemplateSectionLayout> = {
      default: TemplateSectionLayout.DEFAULT,
      cover: TemplateSectionLayout.DEFAULT,
      split: TemplateSectionLayout.DEFAULT,
      "two-column": TemplateSectionLayout.DEFAULT,
      "three-column": TemplateSectionLayout.GRID,
      masonry: TemplateSectionLayout.MASONRY,
      grid: TemplateSectionLayout.GRID,
      cards: TemplateSectionLayout.CARDS,
      list: TemplateSectionLayout.LIST,
      timeline: TemplateSectionLayout.TIMELINE_VERTICAL,
      "timeline-vertical": TemplateSectionLayout.TIMELINE_VERTICAL,
      "timeline-horizontal": TemplateSectionLayout.TIMELINE_HORIZONTAL,
      accordion: TemplateSectionLayout.ACCORDION,
      tabbed: TemplateSectionLayout.TABBED,
      slider: TemplateSectionLayout.SLIDER,
      carousel: TemplateSectionLayout.TESTIMONIAL_SLIDER,
      statistics: TemplateSectionLayout.STATISTICS,
    };

    // Delete existing sections for this template
    await prisma.templateSection.deleteMany({
      where: { templateId },
    });

    // Create new sections
    for (let i = 0; i < config.defaultConfig.sections.length; i++) {
      const section = config.defaultConfig.sections[i];
      const sectionType = sectionTypeMap[section.type] || TemplateSectionType.CUSTOM;
      const layout = layoutMap[section.layout] || TemplateSectionLayout.DEFAULT;

      await prisma.templateSection.create({
        data: {
          templateId,
          type: sectionType,
          name: section.type.charAt(0).toUpperCase() + section.type.slice(1).replace(/_/g, " "),
          description: `${section.type} section with ${section.layout} layout`,
          layout,
          order: i,
          required: section.type === "hero",
          defaultVisible: true,
          isHideable: section.type !== "hero",
          propsSchema: section.props || {},
          contentConfig: {
            layout: section.layout,
            props: section.props,
          },
        },
      });

      console.log(`[process-sections] ✓ Created section: ${section.type} (${sectionType})`);
    }

    // Update template with supported sections
    const supportedSections = config.defaultConfig.sections
      .map((s: { type: string }) => sectionTypeMap[s.type])
      .filter(Boolean);

    if (supportedSections.length > 0) {
      await prisma.template.update({
        where: { id: templateId },
        data: { supportedSections },
      });
      console.log(`[process-sections] ✓ Updated template supportedSections`);
    }
  } catch (error) {
    console.error(`[process-sections] Error creating template sections:`, error);
  }
}

/**
 * Recursively search for a file in a directory
 */
function findFile(dir: string, filename: string): string | null {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isFile() && entry.name.toLowerCase() === filename.toLowerCase()) {
        return fullPath;
      }

      if (entry.isDirectory()) {
        // Skip common directories that won't contain templates
        if (
          entry.name === "node_modules" ||
          entry.name === ".git" ||
          entry.name === "dist" ||
          entry.name === "build"
        ) {
          continue;
        }

        const found = findFile(fullPath, filename);
        if (found) return found;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error searching for file ${filename}:`, error);
    return null;
  }
}
