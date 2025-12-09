import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PreviewMode } from "@/generated/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }
    const tpl = await prisma.template.findUnique({ where: { id } });
    if (!tpl) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    // Determine effective preview mode: DB override (previewMode) -> manifest.previewMode -> inferred (default iframe)
    let effective: PreviewMode = (tpl.previewMode as PreviewMode) || PreviewMode.AUTO;
    const manifest = (tpl.manifest as Record<string, unknown>) || {};
    if (effective === PreviewMode.AUTO) {
      const pm = (manifest.previewMode as string) || (manifest.preview_mode as string) || "";
      if (pm.toLowerCase() === "static") effective = PreviewMode.STATIC;
      else if (pm.toLowerCase() === "iframe") effective = PreviewMode.IFRAME;
      else effective = PreviewMode.IFRAME;
    }

    // Allow explicit override via query param ?mode=iframe|static
    const url = new URL(request.url);
    const qmode = url.searchParams.get("mode");
    if (qmode === "static") effective = PreviewMode.STATIC;
    if (qmode === "iframe") effective = PreviewMode.IFRAME;

    if (effective === PreviewMode.STATIC) {
      // Prefer packageUrl or artifact index
      const artifactAssets = tpl.artifactAssets as Record<string, string> | null;
      const staticUrl =
        tpl.packageUrl || (artifactAssets ? artifactAssets["index.html"] : undefined);
      if (staticUrl) return NextResponse.redirect(staticUrl);
      return NextResponse.json({ error: "No static preview available" }, { status: 404 });
    }

    // IFRAME: redirect to a viewer route (rendered in the app) that can mount sandboxed runtime viewer
    // We use a simple internal viewer path which exists in the app: /templates/preview/:id
    const viewerUrl = `${process.env.NEXTAUTH_URL || ""}/templates/preview/${tpl.id}`;
    return NextResponse.redirect(viewerUrl);
  } catch (err) {
    console.error("Preview route error", err);
    return NextResponse.json({ error: "Failed to load preview" }, { status: 500 });
  }
}

// Mark route as dynamic to ensure runtime behaviors are explicit for Next.
export const dynamic = "force-dynamic";
