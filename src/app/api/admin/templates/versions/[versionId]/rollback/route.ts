import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest, { params }: { params: { versionId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user?.id ||
      !(session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const versionId = params.versionId;
    const version = await prisma.templateVersion.findUnique({ where: { id: versionId } });
    if (!version) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Perform rollback: update template with snapshot values and enqueue processing
    const updated = await prisma.$transaction(async (tx) => {
      const tpl = await tx.template.update({
        where: { id: version.templateId },
        data: {
          name: version.name,
          slug: version.slug,
          description: version.description || undefined,
          version: version.version,
          previewImage: version.previewImage || undefined,
          thumbnailImage: version.thumbnailImage || undefined,
          componentPath: version.componentPath || undefined,
          designTokens: (version.designTokens as unknown as Prisma.JsonValue) || undefined,
          defaultConfig: (version.defaultConfig as unknown as Prisma.JsonValue) || undefined,
          packageUrl: version.packageUrl || undefined,
          storagePath: version.storagePath || undefined,
          processingStatus: "PROCESSING",
        },
      });

      // Create a new TemplateVersion for the pre-rollback state
      try {
        await tx.templateVersion.create({
          data: {
            templateId: tpl.id,
            name: tpl.name,
            slug: tpl.slug,
            description: tpl.description || undefined,
            version: tpl.version,
            previewImage: tpl.previewImage || undefined,
            thumbnailImage: tpl.thumbnailImage || undefined,
            componentPath: tpl.componentPath || undefined,
            designTokens: (tpl.designTokens as unknown as Prisma.JsonValue) || undefined,
            defaultConfig: (tpl.defaultConfig as unknown as Prisma.JsonValue) || undefined,
            packageUrl: tpl.packageUrl || undefined,
            storagePath: tpl.storagePath || undefined,
            createdById: session.user.id,
          },
        });
      } catch {
        // ignore snapshot failures
      }

      return tpl;
    });

    try {
      const { enqueueTemplateProcessing } = await import("@/server/template-workers/queue");
      if (updated.storagePath)
        await enqueueTemplateProcessing(updated.id, updated.storagePath, undefined, true);
    } catch (e) {
      console.warn("Failed to enqueue processing after rollback:", e);
    }

    return NextResponse.json({ data: { templateId: updated.id } });
  } catch (err) {
    console.error("Rollback failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
