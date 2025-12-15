import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This route serves the template HTML for /templates/preview/[id] and ALL sub-paths
// This allows the template's React Router to handle client-side routing
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    console.log(`[template-preview-route] Serving template ${id}`);

    if (!id) {
      return new NextResponse("Template ID is required", { status: 400 });
    }

    // Fetch the template from the database
    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template || !template.artifactAssets) {
      return new NextResponse("Template not found", { status: 404 });
    }

    const artifactAssets =
      typeof template.artifactAssets === "string"
        ? JSON.parse(template.artifactAssets)
        : template.artifactAssets;

    // Get the index.html file
    const indexHtmlUrl = artifactAssets["index.html"];
    if (!indexHtmlUrl) {
      return new NextResponse("Template HTML not found", { status: 404 });
    }

    // Fetch the HTML content from Cloudinary
    const htmlResponse = await fetch(indexHtmlUrl);
    if (!htmlResponse.ok) {
      return new NextResponse("Failed to fetch template HTML", {
        status: 502,
      });
    }

    let htmlContent = await htmlResponse.text();

    // Inject a script to set React Router basename to the current path
    // This tells React Router that its routes start from /templates/preview/[id]
    const routerBasenameScript = `
      <script>
        // Override React Router's basename before it initializes
        window.__REACT_ROUTER_BASENAME__ = window.location.pathname;
        console.log('Setting React Router basename to:', window.__REACT_ROUTER_BASENAME__);
      </script>
    `;

    htmlContent = htmlContent.replace(/<head>/i, `<head>${routerBasenameScript}`);

    // Rewrite relative paths to absolute Cloudinary URLs
    for (const [filePath, cloudinaryUrl] of Object.entries(artifactAssets)) {
      if (filePath === "index.html") continue;

      // Normalize the path (remove leading slash if present)
      const normalizedPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;

      // Create different path variations
      const pathVariations = [
        filePath,
        `/${normalizedPath}`,
        normalizedPath,
        `./${normalizedPath}`,
      ];

      // Replace all variations in various HTML attributes
      for (const pathVar of pathVariations) {
        const escapedPath = pathVar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        htmlContent = htmlContent.replace(
          new RegExp(`src=["']${escapedPath}["']`, "g"),
          `src="${cloudinaryUrl}"`
        );

        htmlContent = htmlContent.replace(
          new RegExp(`href=["']${escapedPath}["']`, "g"),
          `href="${cloudinaryUrl}"`
        );

        htmlContent = htmlContent.replace(
          new RegExp(`data-src=["']${escapedPath}["']`, "g"),
          `data-src="${cloudinaryUrl}"`
        );
      }
    }

    // Return the HTML - React Router in the template will handle any sub-routes client-side
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error in template preview route:", error);
    return new NextResponse(`Internal server error: ${error}`, { status: 500 });
  }
}
