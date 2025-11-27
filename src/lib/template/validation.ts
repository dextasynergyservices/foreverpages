import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import {
  createTempExtractionBase,
  extractionPathsForBase,
  ensureExtractionDir,
  cleanupExtractionBase,
} from "@/server/template-extracts/tempExtract";
import Ajv from "ajv";
import sharp from "sharp";
import schema from "./schemas/config.schema.json";
import { scanFileForSecurity, SecurityFinding } from "./securityScan";
import { uploadToCloudinary } from "../cloudinary";

const ajv = new Ajv();
const validateSchema = ajv.compile(schema as object);

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  manifest?: unknown;
  tempDir?: string;
  uploaded?: {
    preview?: { public_id: string; url: string };
    thumbnail?: { public_id: string; url: string };
    package?: { public_id: string; url: string };
  };
  generatedManifest?: unknown;
  generatedNotes?: string[];
}

const REQUIRED_FILES = ["MemorialTemplate.tsx", "config.json", "preview.png", "thumbnail.png"];

export async function validateAndExtractZip(
  zipBuffer: Buffer,
  options: { maxSizeMB?: number } = {}
): Promise<TemplateValidationResult> {
  const result: TemplateValidationResult = { isValid: false, errors: [], warnings: [] };
  if (!zipBuffer || !(zipBuffer instanceof Buffer)) {
    result.errors.push("Missing or invalid zip buffer");
    return result;
  }

  const maxSizeMB = options.maxSizeMB ?? 50;
  if (zipBuffer.length > maxSizeMB * 1024 * 1024) {
    result.errors.push(`Zip exceeds ${maxSizeMB}MB`);
    return result;
  }

  const tmpBase = await createTempExtractionBase("template-extract-");
  const { extractionDir } = extractionPathsForBase(tmpBase);
  await ensureExtractionDir(extractionDir);

  try {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    // detect single-root prefix
    let commonPrefix: string | null = null;
    for (const e of entries) {
      const parts = e.entryName.split(/\\|\//).filter(Boolean);
      if (parts.length === 0) continue;
      const first = parts[0];
      if (commonPrefix === null) commonPrefix = first;
      else if (commonPrefix !== first) {
        commonPrefix = null;
        break;
      }
    }

    // quick required-file check
    const found: Record<string, boolean> = {};
    for (const r of REQUIRED_FILES) found[r] = false;
    for (const e of entries) {
      if (e.isDirectory) continue;
      const normalized = e.entryName.replace(/^\/+/, "");
      const parts = normalized.split(/\\|\//).filter(Boolean);
      const name = parts.slice(parts[0] === commonPrefix ? 1 : 0).join("/");
      if (found.hasOwnProperty(name)) found[name] = true;
    }
    for (const r of REQUIRED_FILES)
      if (!found[r]) result.errors.push(`Missing required file: ${r}`);
    if (result.errors.length) {
      await cleanupExtractionBase(tmpBase);
      return result;
    }

    // Pre-extraction zip entry size checks (reject huge entries)
    const MAX_ENTRY_BYTES = 10 * 1024 * 1024; // 10MB per file
    const MAX_TOTAL_UNCOMPRESSED = 100 * 1024 * 1024; // 100MB
    let totalUncompressed = 0;
    for (const e of entries) {
      if (e.isDirectory) continue;
      const size = e.header.size || e.getData?.().length || 0;
      totalUncompressed += size;
      if (size > MAX_ENTRY_BYTES) {
        result.errors.push(`Zip entry too large: ${e.entryName} (${size} bytes)`);
      }
    }
    if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED) {
      result.errors.push(`Total uncompressed size exceeds limit: ${totalUncompressed} bytes`);
    }
    if (result.errors.length) {
      await cleanupExtractionBase(tmpBase);
      return result;
    }

    // safe extraction: normalize entry names, strip single-root prefix when present
    for (const e of entries) {
      if (e.isDirectory) continue;
      const raw = e.entryName.replace(/^\/+/, "");
      const parts = raw.split(/\\|\//).filter(Boolean);
      const stripped = parts[0] === commonPrefix ? parts.slice(1) : parts;
      if (stripped.length === 0) continue; // nothing to write
      const relPath = stripped.join(path.sep);
      const target = path.join(extractionDir, relPath);
      const dir = path.dirname(target);
      try {
        await fs.promises.mkdir(dir, { recursive: true });
        const normalizedTarget = path.normalize(target);
        if (!normalizedTarget.startsWith(path.normalize(extractionDir + path.sep)))
          throw new Error("Zip contains illegal paths");
        await fs.promises.writeFile(normalizedTarget, e.getData());
      } catch (writeErr) {
        // capture extraction errors and abort
        throw new Error(`Failed to extract ${e.entryName}: ${String(writeErr)}`);
      }
    }

    // manifest validation
    const manifestCandidates = [
      path.join(extractionDir, "config.json"),
      path.join(extractionDir, commonPrefix || "", "config.json"),
    ];
    let manifestPath: string | null = null;
    for (const p of manifestCandidates) if (fs.existsSync(p)) manifestPath = p;
    if (!manifestPath) {
      result.errors.push("Missing manifest file: config.json");
      result.isValid = false;
      await cleanupExtractionBase(tmpBase);
      return result;
    }

    try {
      const raw = await fs.promises.readFile(manifestPath, "utf-8");
      const parsed = JSON.parse(raw) as Record<string, unknown>;

      // Manifest normalization adapter: accept common aliases to make authoring easier.
      // - `entry` -> `main`
      // - `previewMode` may be present; ensure `preview` path exists separately
      // - If `preview` missing and `main` exists and previewMode === "static", use main as preview
      const normalized = { ...parsed };
      if (!normalized["main"] && typeof normalized["entry"] === "string") {
        normalized["main"] = normalized["entry"] as string;
      }
      // Normalize preview: prefer explicit `preview` path; if not present and previewMode === 'static', use main
      if (!normalized["preview"] && typeof normalized["previewMode"] === "string") {
        if (
          String(normalized["previewMode"]) === "static" &&
          typeof normalized["main"] === "string"
        ) {
          normalized["preview"] = normalized["main"];
        }
      }
      // Accept `thumbnail.png` or `thumbnail` field aliases (no-op if not provided)
      if (!normalized["thumbnail"] && typeof normalized["thumbnailPath"] === "string") {
        normalized["thumbnail"] = normalized["thumbnailPath"] as string;
      }

      result.manifest = normalized;
      const ok = validateSchema(normalized);
      if (!ok) {
        const msgs = (validateSchema.errors || [])
          .map((e) => `${e.instancePath} ${e.message}`)
          .join("; ");
        result.errors.push(`Manifest schema validation failed: ${msgs}`);
        result.isValid = false;
        return result;
      }
    } catch (err) {
      result.errors.push("Failed to read/parse manifest");
      result.errors.push(String(err));
      result.isValid = false;
      await cleanupExtractionBase(tmpBase);
      return result;
    }

    // Generate a candidate manifest using heuristics so admins can preview/apply it.
    try {
      const notes: string[] = [];
      const candidate: Record<string, unknown> = {
        ...(result.manifest as Record<string, unknown>),
      };

      // slug
      if (!candidate.slug) {
        const name = (candidate.name as string) || null;
        if (name) {
          candidate.slug = String(name)
            .toLowerCase()
            .replace(/[^a-z0-9\-]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
          notes.push("Slug inferred from name");
        } else {
          candidate.slug = `template-${Date.now()}`;
          notes.push("Slug generated from timestamp");
        }
      }

      // version
      if (!candidate.version) {
        candidate.version = "1.0.0";
        notes.push("Defaulted version to 1.0.0");
      }

      // main/component entry
      if (!candidate.main) {
        const mainPath = path.join(extractionDir, "MemorialTemplate.tsx");
        if (fs.existsSync(mainPath)) {
          candidate.main = "MemorialTemplate.tsx";
          notes.push("Main entry set to MemorialTemplate.tsx");
        }
      }

      // previewMode inference: static if index.html exists
      try {
        const indexRoot = path.join(extractionDir, "index.html");
        if (fs.existsSync(indexRoot)) {
          candidate.previewMode = "static";
          notes.push("previewMode inferred as static from index.html");
          // If no preview path set, use main if available
          if (!candidate.preview && candidate.main) candidate.preview = candidate.main;
        }
      } catch {}

      // Wire preview/thumbnail to uploaded URLs if present
      if (result.uploaded?.preview?.url && !candidate.previewImage) {
        candidate.previewImage = result.uploaded.preview.url;
        notes.push("previewImage set to uploaded preview URL");
      }
      if (result.uploaded?.thumbnail?.url && !candidate.thumbnail) {
        candidate.thumbnail = result.uploaded.thumbnail.url;
        notes.push("thumbnail set to uploaded thumbnail URL");
      }

      // If package uploaded, include packageUrl
      if (result.uploaded?.package?.url) {
        candidate.packageUrl = result.uploaded.package.url;
        notes.push("packageUrl set to uploaded package URL");
      }

      result.generatedManifest = candidate;
      result.generatedNotes = notes;
    } catch {
      // Non-fatal: generation failure should not block validation
      result.warnings.push("Failed to generate candidate manifest");
    }

    // component path discovery
    const compCandidates = [
      path.join(extractionDir, "MemorialTemplate.tsx"),
      path.join(extractionDir, commonPrefix || "", "MemorialTemplate.tsx"),
    ];
    let compPath: string | null = null;
    for (const p of compCandidates) if (p && fs.existsSync(p)) compPath = p;
    if (!compPath) {
      result.errors.push("Missing component file: MemorialTemplate.tsx");
      result.isValid = false;
      await cleanupExtractionBase(tmpBase);
      return result;
    }

    // run AST-based security scan
    try {
      const findings: SecurityFinding[] = scanFileForSecurity(compPath);
      for (const f of findings) {
        const loc = f.line && f.column ? `:${f.line}:${f.column}` : "";
        result.errors.push(`${path.basename(f.file)}${loc} ${f.message}`);
      }
    } catch {
      result.errors.push("Security scan failed");
      result.isValid = false;
      await cleanupExtractionBase(tmpBase);
      return result;
    }

    // basic image checks + uploads (preview, thumbnail)
    const uploaded: TemplateValidationResult["uploaded"] = {};
    try {
      const pickFile = (name: string) => {
        const p1 = path.join(extractionDir, name);
        const p2 = path.join(extractionDir, commonPrefix || "", name);
        if (fs.existsSync(p1)) return p1;
        if (fs.existsSync(p2)) return p2;
        return null;
      };

      const previewPath = pickFile("preview.png");
      const thumbnailPath = pickFile("thumbnail.png");

      const checkAndUpload = async (p: string | null, key: "preview" | "thumbnail") => {
        if (!p) return;
        const buf = await fs.promises.readFile(p);
        const meta = (await sharp(buf).metadata()) as {
          format?: string | undefined;
          width?: number | undefined;
          height?: number | undefined;
          [key: string]: unknown;
        };
        if (!meta.format || !["png", "jpeg", "jpg"].includes(String(meta.format)))
          result.errors.push(`${key} must be PNG or JPEG`);
        if ((meta.width || 0) < 200 || (meta.height || 0) < 100)
          result.warnings.push(`${key} is smaller than recommended`);
        try {
          const res = await uploadToCloudinary(p, {
            folder: `templates/${getManifestSlug(result.manifest)}`,
          });
          uploaded[key] = { public_id: res.public_id, url: res.secure_url };
        } catch {
          result.warnings.push(`Failed to upload ${key}`);
        }
      };

      await checkAndUpload(previewPath, "preview");
      await checkAndUpload(thumbnailPath, "thumbnail");
    } catch {
      result.warnings.push("Image processing failed");
    }

    // upload raw package
    try {
      const packRes = await uploadToCloudinary(zipBuffer, {
        folder: `templates/${getManifestSlug(result.manifest)}`,
        resourceType: "raw",
      });
      uploaded.package = { public_id: packRes.public_id, url: packRes.secure_url };
    } catch {
      result.warnings.push("Failed to persist package zip");
    }

    result.uploaded = uploaded;
    result.isValid = result.errors.length === 0;
    if (result.isValid) {
      result.tempDir = extractionDir;
      return result;
    }
    // cleanup on validation failure
    await cleanupExtractionBase(tmpBase);
    return result;
  } catch (err) {
    await cleanupExtractionBase(tmpBase);
    result.errors.push((err as Error).message || String(err));
    return result;
  }
}

export function getManifestSlug(manifest: unknown): string {
  try {
    if (!manifest || typeof manifest !== "object") return "unnamed";
    const m = manifest as Record<string, unknown>;
    const slug = m["slug"];
    if (typeof slug === "string" && slug.length > 0) return slug;
    return "unnamed";
  } catch {
    return "unnamed";
  }
}
