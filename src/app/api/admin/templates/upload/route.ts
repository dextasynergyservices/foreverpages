import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { validateAndExtractZip } from "@/lib/template/validation";
import { deleteFromCloudinary, extractPublicId } from "@/lib/cloudinary";
import { PrismaClient, Prisma } from "@/generated/prisma";

const prisma = new PrismaClient();

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role || "USER")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      const body = { message: "Expected multipart/form-data" };
      console.warn("Upload: unexpected content-type", contentType, body);
      return NextResponse.json(body, { status: 400 });
    }

    // Parse form data with defensive error handling to aid debugging
    let form: FormData;
    try {
      form = await request.formData();
    } catch (e) {
      const body = { message: "Failed to parse multipart/form-data", error: String(e) };
      console.error("Upload: failed to parse form data", e);
      return NextResponse.json(body, { status: 400 });
    }

    // Expose which form keys were received for easier diagnosis
    try {
      const maybeKeysFn = (form as unknown as FormData).keys;
      const keysIter: IterableIterator<string> | null =
        typeof maybeKeysFn === "function"
          ? (maybeKeysFn.call(form as FormData) as IterableIterator<string>)
          : null;
      const keys = keysIter
        ? Array.from(keysIter)
        : Array.from((form as FormData).entries()).map((p) => String(p[0]));
      console.debug("Upload: received form keys:", keys);
    } catch (e) {
      console.debug("Upload: unable to enumerate form keys", e);
    }

    const file = form.get("file") as File | null;

    if (!file) {
      const contentLength = request.headers.get("content-length");
      const body = {
        message: "No file provided (missing 'file' field)",
        diagnostics: { contentType, contentLength },
      };
      console.warn("Upload: no file field in form data", { contentType, contentLength, body });
      return NextResponse.json(body, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const validation = await validateAndExtractZip(buffer, { maxSizeMB: 50 });

    if (!validation.isValid) {
      const body = { message: "Validation failed", errors: validation.errors };
      console.debug("Upload: validation failed", body);
      return NextResponse.json(body, { status: 400 });
    }

    // Persist template record in DB and create relations
    const manifest = validation.manifest as unknown;
    function getManifestField(key: string): unknown {
      if (manifest && typeof manifest === "object") {
        const m = manifest as Record<string, unknown>;
        return m[key];
      }
      return undefined;
    }

    function parseIds(val: FormDataEntryValue | null) {
      if (!val) return [] as string[];
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed as string[];
        } catch {}
        // allow comma-separated or single id
        return val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [] as string[];
    }

    const planIds = parseIds(form.get("planIds"));
    const categoryIds = parseIds(form.get("categoryIds"));
    const replaceTemplateId =
      typeof form.get("replaceTemplateId") === "string"
        ? (form.get("replaceTemplateId") as string)
        : null;

    // Require at least one plan and one category for upload
    if (!planIds.length) {
      const body = { message: "At least one planId is required" };
      console.debug("Upload: missing plan ids", body);
      return NextResponse.json(body, { status: 400 });
    }
    if (!categoryIds.length) {
      const body = { message: "At least one categoryId is required" };
      console.debug("Upload: missing category ids", body);
      return NextResponse.json(body, { status: 400 });
    }

    // Validate plans and categories exist and are active/visible
    const foundPlans = await prisma.plan.findMany({ where: { id: { in: planIds } } });
    const missingPlanIds = planIds.filter((id) => !foundPlans.find((p) => p.id === id));

    const foundCategories = await prisma.templateCategory.findMany({
      where: { id: { in: categoryIds } },
    });
    const missingCategoryIds = categoryIds.filter(
      (id) => !foundCategories.find((c) => c.id === id)
    );

    if (missingPlanIds.length || missingCategoryIds.length) {
      const body = {
        message: "Invalid plan or category ids",
        missingPlanIds: missingPlanIds.length ? missingPlanIds : undefined,
        missingCategoryIds: missingCategoryIds.length ? missingCategoryIds : undefined,
      };
      console.debug("Upload: invalid plan/category ids", body);
      return NextResponse.json(body, { status: 400 });
    }

    let template;
    try {
      if (replaceTemplateId) {
        // Update existing template and remove previous assets
        template = await prisma.$transaction(async (tx) => {
          const existing = await tx.template.findUnique({ where: { id: replaceTemplateId } });
          if (!existing) throw new Error("Template to replace not found");

          // Delete previous preview/thumbnail assets from Cloudinary if present
          try {
            if (existing.previewImage) {
              const pub = extractPublicId(existing.previewImage);
              if (pub) await deleteFromCloudinary(pub, "image");
            }
            if (existing.thumbnailImage) {
              const pub2 = extractPublicId(existing.thumbnailImage);
              if (pub2) await deleteFromCloudinary(pub2, "image");
            }
          } catch (delErr) {
            console.warn("Failed to delete existing cloudinary assets:", delErr);
          }

          const upd = await tx.template.update({
            where: { id: replaceTemplateId },
            data: {
              name:
                (typeof getManifestField("name") === "string" &&
                  (getManifestField("name") as string)) ||
                existing.name,
              slug:
                (typeof getManifestField("slug") === "string" &&
                  (getManifestField("slug") as string)) ||
                existing.slug,
              description:
                (typeof getManifestField("description") === "string" &&
                  (getManifestField("description") as string)) ||
                existing.description,
              version:
                (typeof getManifestField("version") === "string" &&
                  (getManifestField("version") as string)) ||
                existing.version,
              previewImage: validation.uploaded?.preview?.url || existing.previewImage,
              thumbnailImage: validation.uploaded?.thumbnail?.url || existing.thumbnailImage,
              componentPath:
                (typeof getManifestField("main") === "string" &&
                  (getManifestField("main") as string)) ||
                existing.componentPath,
              designTokens: (getManifestField("designTokens") as object) || existing.designTokens,
              defaultConfig:
                (getManifestField("defaultConfig") as object) || existing.defaultConfig,
              processingStatus: "PROCESSING",
              storagePath: validation.tempDir,
              manifest: (validation.manifest as unknown) || undefined,
              packageUrl: validation.uploaded?.package?.url || existing.packageUrl,
              categoryId: categoryIds[0] || existing.categoryId,
            },
          });

          // Create a version snapshot of the existing template before update
          try {
            await tx.templateVersion.create({
              data: {
                templateId: existing.id,
                name: existing.name,
                slug: existing.slug,
                description: existing.description,
                version: existing.version,
                previewImage: existing.previewImage || undefined,
                thumbnailImage: existing.thumbnailImage || undefined,
                componentPath: existing.componentPath || undefined,
                designTokens: (existing.designTokens as unknown as Prisma.JsonValue) || undefined,
                defaultConfig: (existing.defaultConfig as unknown as Prisma.JsonValue) || undefined,
                manifest: (existing.manifest as unknown as Prisma.JsonValue) || undefined,
                packageUrl: existing.packageUrl || undefined,
                storagePath: existing.storagePath || undefined,
                createdById: session.user.id,
              },
            });
          } catch (verErr) {
            console.warn("Failed to create template version snapshot:", verErr);
          }

          // Replace plan relations: set new plan connections
          if (planIds && planIds.length) {
            await tx.$executeRaw`DELETE FROM "_PlanToTemplate" WHERE "A" = ${replaceTemplateId}`;
            await tx.template.update({
              where: { id: replaceTemplateId },
              data: { plans: { connect: planIds.map((id: string) => ({ id })) } },
            });
          }

          // Replace category relations
          await tx.templateCategoryRelation.deleteMany({
            where: { templateId: replaceTemplateId },
          });
          if (categoryIds && categoryIds.length) {
            await tx.templateCategoryRelation.createMany({
              data: categoryIds.map((catId: string) => ({
                templateId: replaceTemplateId,
                categoryId: catId,
              })),
              skipDuplicates: true,
            });
          }

          return upd;
        });
      } else {
        template = await prisma.$transaction(async (tx) => {
          const tpl = await tx.template.create({
            data: {
              name:
                (typeof getManifestField("name") === "string" &&
                  (getManifestField("name") as string)) ||
                (typeof getManifestField("slug") === "string" &&
                  (getManifestField("slug") as string)) ||
                "Unnamed",
              slug:
                (typeof getManifestField("slug") === "string" &&
                  (getManifestField("slug") as string)) ||
                `template-${Date.now()}`,
              description:
                (typeof getManifestField("description") === "string" &&
                  (getManifestField("description") as string)) ||
                null,
              version:
                (typeof getManifestField("version") === "string" &&
                  (getManifestField("version") as string)) ||
                "1.0.0",
              previewImage: validation.uploaded?.preview?.url || "",
              thumbnailImage: validation.uploaded?.thumbnail?.url || "",
              componentPath:
                (typeof getManifestField("main") === "string" &&
                  (getManifestField("main") as string)) ||
                "MemorialTemplate",
              designTokens: (getManifestField("designTokens") as object) || undefined,
              defaultConfig: (getManifestField("defaultConfig") as object) || undefined,
              isActive: true,
              processingStatus: "PROCESSING",
              storagePath: validation.tempDir,
              manifest: (validation.manifest as unknown) || undefined,
              packageUrl: validation.uploaded?.package?.url || undefined,
              // Connect selected plans
              plans:
                planIds && planIds.length
                  ? { connect: planIds.map((id: string) => ({ id })) }
                  : undefined,
              // Set primary category to first selected category for quick queries
              categoryId: categoryIds[0] || undefined,
            },
          });

          // Persist category relations using relation table
          if (categoryIds && categoryIds.length) {
            await tx.templateCategoryRelation.createMany({
              data: categoryIds.map((catId: string) => ({ templateId: tpl.id, categoryId: catId })),
              skipDuplicates: true,
            });
          }

          return tpl;
        });
      }
    } catch (e) {
      // On DB errors, remove extracted files to avoid leftover temp data
      try {
        if (validation.tempDir)
          await fs.promises.rm(validation.tempDir, { recursive: true, force: true });
      } catch (er) {
        console.warn("Failed to cleanup tempDir after DB error", er);
      }
      throw e;
    }

    // Create category relations if provided (already created inside transaction usually)
    if (categoryIds && categoryIds.length) {
      try {
        await prisma.templateCategoryRelation.createMany({
          data: categoryIds.map((catId: string) => ({
            templateId: template.id,
            categoryId: catId,
          })),
          skipDuplicates: true,
        });
      } catch (e) {
        // cleanup on error
        try {
          if (validation.tempDir)
            await fs.promises.rm(validation.tempDir, { recursive: true, force: true });
        } catch (er) {
          console.warn("Failed to cleanup tempDir after relation error", er);
        }
        throw e;
      }
    }

    // Enqueue background processing job
    try {
      const { enqueueTemplateProcessing } = await import("@/server/template-workers/queue");
      if (validation.tempDir)
        await enqueueTemplateProcessing(template.id, validation.tempDir, undefined, true);
    } catch (e) {
      console.error("Failed to enqueue worker, rolling back template and files", e);
      // Attempt to remove DB record and cleanup extracted files
      try {
        await prisma.template.delete({ where: { id: template.id } });
      } catch (delErr) {
        console.warn("Failed to delete template after enqueue error", delErr);
      }
      try {
        if (validation.tempDir)
          await fs.promises.rm(validation.tempDir, { recursive: true, force: true });
      } catch (rmErr) {
        console.warn("Failed to cleanup tempDir after enqueue error", rmErr);
      }
      return NextResponse.json({ message: "Failed to start processing" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Upload accepted",
      data: {
        manifest: validation.manifest,
        generatedManifest: validation.generatedManifest,
        generatedNotes: validation.generatedNotes,
        uploaded: validation.uploaded,
        templateId: template.id,
      },
    });
  } catch (err) {
    console.error("Template upload error:", err);
    // During local development expose the error message to aid debugging. Remove in production.
    const devBody =
      process.env.NODE_ENV === "production"
        ? { message: "Internal server error" }
        : { message: "Internal server error", error: String((err as Error)?.message || err) };
    return NextResponse.json(devBody, { status: 500 });
  }
}
