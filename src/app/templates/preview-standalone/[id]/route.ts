import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log(`[preview-standalone] Template ID: ${id}`);

    if (!id) {
      console.error("[preview-standalone] No template ID provided");
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

    // Add base tag to help with routing - place it right after <head>
    htmlContent = htmlContent.replace(/<head>/i, '<head>\n  <base href="/">');

    // Also inject a script to handle React Router basename
    const routerScript = `
      <script>
        // Set global variable for React Router to use root as basename
        window.__REACT_ROUTER_BASENAME__ = '/';
        // Prevent React Router from trying to match the full URL path
        window.__PUBLIC_PATH__ = '/';
      </script>
    `;
    htmlContent = htmlContent.replace(/<head>/i, `<head>${routerScript}`);

    // Rewrite relative paths to absolute Cloudinary URLs
    for (const [filePath, cloudinaryUrl] of Object.entries(artifactAssets)) {
      if (filePath === "index.html") continue;

      // Normalize the path (remove leading slash if present)
      const normalizedPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;

      // Create different path variations
      const pathVariations = [
        filePath, // Original path
        `/${normalizedPath}`, // With leading slash
        normalizedPath, // Without leading slash
        `./${normalizedPath}`, // Relative with ./
      ];

      // Replace all variations in various HTML attributes
      for (const pathVar of pathVariations) {
        // Regular src attributes
        htmlContent = htmlContent.replace(
          new RegExp(`src=["']${pathVar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "g"),
          `src="${cloudinaryUrl}"`
        );

        // href attributes
        htmlContent = htmlContent.replace(
          new RegExp(`href=["']${pathVar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "g"),
          `href="${cloudinaryUrl}"`
        );

        // data-src attributes (lazy loading)
        htmlContent = htmlContent.replace(
          new RegExp(`data-src=["']${pathVar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "g"),
          `data-src="${cloudinaryUrl}"`
        );
      }
    }

    // Return the HTML as a full document
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch (error) {
    console.error("Error in template preview route:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
