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
 * Auto-discover sections by analyzing template files
 */
function discoverSectionsFromCode(extractedDir: string): Array<{ type: string; order: number }> {
  const discoveredSections: Array<{ type: string; order: number }> = [];

  try {
    // Find main template file (usually MemorialTemplate.tsx or index.tsx)
    const templateFiles = [
      findFile(extractedDir, "MemorialTemplate.tsx"),
      findFile(extractedDir, "index.tsx"),
      findFile(extractedDir, "Template.tsx"),
    ].filter(Boolean) as string[];

    for (const filePath of templateFiles) {
      const content = fs.readFileSync(filePath, "utf-8");

      // Pattern 1: Look for Section components like <HeroSection>, <BiographySection>
      const sectionComponentRegex = /<(\w+Section)/g;
      let match;
      while ((match = sectionComponentRegex.exec(content)) !== null) {
        const componentName = match[1]; // e.g., "HeroSection"
        const sectionType = componentName
          .replace(/Section$/, "")
          .replace(/([A-Z])/g, "_$1")
          .toLowerCase()
          .replace(/^_/, ""); // Convert HeroSection -> hero

        if (!discoveredSections.find((s) => s.type === sectionType)) {
          discoveredSections.push({ type: sectionType, order: discoveredSections.length });
        }
      }

      // Pattern 2: Look for section prop types like section.type === 'hero'
      const sectionTypeRegex = /section\.type\s*===\s*['"](\w+)['"]/g;
      while ((match = sectionTypeRegex.exec(content)) !== null) {
        const sectionType = match[1].toLowerCase();
        if (!discoveredSections.find((s) => s.type === sectionType)) {
          discoveredSections.push({ type: sectionType, order: discoveredSections.length });
        }
      }

      // Pattern 3: Look for imports from section files
      const sectionImportRegex = /from\s+['"].*\/([A-Za-z]+)Section['"]/g;
      while ((match = sectionImportRegex.exec(content)) !== null) {
        const sectionType = match[1].toLowerCase();
        if (!discoveredSections.find((s) => s.type === sectionType)) {
          discoveredSections.push({ type: sectionType, order: discoveredSections.length });
        }
      }
    }

    if (discoveredSections.length > 0) {
      console.log(
        `[process-sections] Auto-discovered ${discoveredSections.length} sections from code`
      );
    }
  } catch (error) {
    console.warn(`[process-sections] Failed to auto-discover sections:`, error);
  }

  return discoveredSections;
}

/**
 * Parse config.json and create TemplateSection entries
 * Also auto-discovers sections from code as fallback/validation
 */
export async function createTemplateSections(templateId: string, extractedDir: string) {
  console.log(`[process-sections] 🚀 Starting section creation for template ${templateId}`);
  console.log(`[process-sections] Extracted directory: ${extractedDir}`);
  
  try {
    let sectionsToCreate: Array<{ type: string; layout?: string; props?: unknown; order: number }> =
      [];
    let configSections: Array<{ type: string; layout: string; props: unknown }> = [];

    // Step 1: Try to read from config.json
    const configPath = findFile(extractedDir, "config.json");
    console.log(`[process-sections] Config path: ${configPath || 'NOT FOUND'}`);
    if (configPath && fs.existsSync(configPath)) {
      try {
        const configContent = fs.readFileSync(configPath, "utf-8");
        const config = JSON.parse(configContent);

        if (config.defaultConfig?.sections && Array.isArray(config.defaultConfig.sections)) {
          configSections = config.defaultConfig.sections;
          console.log(
            `[process-sections] Found ${configSections.length} sections in config.json for template ${templateId}`
          );
        }
      } catch (error) {
        console.warn(`[process-sections] Failed to parse config.json:`, error);
      }
    }

    // Step 2: Auto-discover sections from template code
    const discoveredSections = discoverSectionsFromCode(extractedDir);

    // Step 3: Merge config sections with discovered sections
    if (configSections.length > 0) {
      // Use config as primary source
      sectionsToCreate = configSections.map((s, i) => ({
        type: s.type,
        layout: s.layout,
        props: s.props,
        order: i,
      }));

      // Add any discovered sections not in config
      discoveredSections.forEach((discovered) => {
        if (!sectionsToCreate.find((s) => s.type === discovered.type)) {
          console.log(
            `[process-sections] ⚠️  Section "${discovered.type}" found in code but missing from config - adding it`
          );
          sectionsToCreate.push({
            type: discovered.type,
            layout: "default",
            props: {},
            order: sectionsToCreate.length,
          });
        }
      });
    } else if (discoveredSections.length > 0) {
      // Fallback to discovered sections if config is missing/empty
      console.log(
        `[process-sections] No config sections found, using ${discoveredSections.length} auto-discovered sections`
      );
      sectionsToCreate = discoveredSections.map((s) => ({
        type: s.type,
        layout: "default",
        props: {},
        order: s.order,
      }));
    } else {
      console.warn(
        `[process-sections] No sections found in config.json or code for template ${templateId}`
      );
      return;
    }

    console.log(
      `[process-sections] Creating ${sectionsToCreate.length} sections for template ${templateId}`
    );

    // Map section types from config to Prisma enum
    const sectionTypeMap: Record<string, TemplateSectionType> = {
      hero: TemplateSectionType.HERO,
      biography: TemplateSectionType.BIOGRAPHY,
      gallery: TemplateSectionType.GALLERY,
      timeline: TemplateSectionType.TIMELINE,
      family: TemplateSectionType.FAMILY_TREE,
      family_tree: TemplateSectionType.FAMILY_TREE,
      tributes: TemplateSectionType.TRIBUTES,
      condolences: TemplateSectionType.CONDOLENCES,
      guestbook: TemplateSectionType.GUESTBOOK,
      donations: TemplateSectionType.DONATIONS,
      funeralInfo: TemplateSectionType.FUNERAL_INFO,
      funeral_info: TemplateSectionType.FUNERAL_INFO,
      funeral: TemplateSectionType.FUNERAL_INFO,
      memories: TemplateSectionType.MEMORIES,
      stories: TemplateSectionType.STORIES,
      achievements: TemplateSectionType.ACHIEVEMENTS,
      military: TemplateSectionType.MILITARY_SERVICE,
      military_service: TemplateSectionType.MILITARY_SERVICE,
      education: TemplateSectionType.EDUCATION_CAREER,
      career: TemplateSectionType.EDUCATION_CAREER,
      education_career: TemplateSectionType.EDUCATION_CAREER,
      photos: TemplateSectionType.PHOTO_ALBUM,
      photo_album: TemplateSectionType.PHOTO_ALBUM,
      videos: TemplateSectionType.VIDEO_GALLERY,
      video_gallery: TemplateSectionType.VIDEO_GALLERY,
      audio: TemplateSectionType.AUDIO_MEMORIES,
      audio_memories: TemplateSectionType.AUDIO_MEMORIES,
      documents: TemplateSectionType.DOCUMENTS,
      candles: TemplateSectionType.VIRTUAL_CANDLES,
      virtual_candles: TemplateSectionType.VIRTUAL_CANDLES,
      flowers: TemplateSectionType.VIRTUAL_FLOWERS,
      virtual_flowers: TemplateSectionType.VIRTUAL_FLOWERS,
      map: TemplateSectionType.MAP_LOCATIONS,
      locations: TemplateSectionType.MAP_LOCATIONS,
      map_locations: TemplateSectionType.MAP_LOCATIONS,
      testimonials: TemplateSectionType.TESTIMONIALS,
      quotes: TemplateSectionType.QUOTES,
      // Map unknown/custom types to CUSTOM
      contact: TemplateSectionType.CUSTOM,
      footer: TemplateSectionType.CUSTOM,
      header: TemplateSectionType.CUSTOM,
      playlist: TemplateSectionType.CUSTOM,
      media: TemplateSectionType.CUSTOM,
      navigation: TemplateSectionType.CUSTOM,
    };

    const layoutMap: Record<string, TemplateSectionLayout> = {
      default: TemplateSectionLayout.DEFAULT,
      basic: TemplateSectionLayout.DEFAULT,
      simple: TemplateSectionLayout.DEFAULT,
      cover: TemplateSectionLayout.DEFAULT,
      split: TemplateSectionLayout.DEFAULT,
      compact: TemplateSectionLayout.DEFAULT,
      inline: TemplateSectionLayout.DEFAULT,
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
    for (let i = 0; i < sectionsToCreate.length; i++) {
      const section = sectionsToCreate[i];
      const sectionType = sectionTypeMap[section.type] || TemplateSectionType.CUSTOM;
      const layout = layoutMap[section.layout || "default"] || TemplateSectionLayout.DEFAULT;

      await prisma.templateSection.create({
        data: {
          templateId,
          type: sectionType,
          name: section.type.charAt(0).toUpperCase() + section.type.slice(1).replace(/_/g, " "),
          description: `${section.type} section with ${section.layout || "default"} layout`,
          layout,
          order: section.order,
          required: section.type === "hero",
          defaultVisible: true,
          isHideable: section.type !== "hero",
          propsSchema: section.props || {},
          contentConfig: {
            layout: section.layout || "default",
            props: section.props || {},
          },
        },
      });

      console.log(`[process-sections] ✓ Created section: ${section.type} (${sectionType})`);
    }

    // Update template with supported sections
    const supportedSections = sectionsToCreate.map((s) => sectionTypeMap[s.type]).filter(Boolean);

    if (supportedSections.length > 0) {
      await prisma.template.update({
        where: { id: templateId },
        data: { supportedSections },
      });
      console.log(`[process-sections] ✓ Updated template supportedSections`);
    }
  } catch (error) {
    console.error(`[process-sections] Error creating template sections:`, error);
    // Log full error details for debugging
    if (error instanceof Error) {
      console.error(`[process-sections] Error name: ${error.name}`);
      console.error(`[process-sections] Error message: ${error.message}`);
      console.error(`[process-sections] Error stack: ${error.stack}`);
    }
    throw error; // Re-throw to see the error in build-callback logs
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
