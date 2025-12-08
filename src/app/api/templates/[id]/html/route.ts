/**
 * API route to serve template HTML for preview
 * This proxies requests to templates in /app/templates/{slug}/
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Get template info including built artifacts
    const template = await prisma.template.findUnique({
      where: { id },
      select: {
        slug: true,
        name: true,
        artifactAssets: true,
        processingStatus: true,
      },
    });

    if (!template) {
      return new NextResponse("Template not found", { status: 404 });
    }

    // Check if template has built artifacts from GitHub Actions
    const artifacts = template.artifactAssets as Record<string, string> | null;

    if (artifacts && artifacts["index.html"]) {
      // Template has been built by GitHub Actions
      // Redirect to the built HTML
      return NextResponse.redirect(artifacts["index.html"]);
    }

    // Fallback: Try to read local template file (for development)
    const templatePath = path.join(
      process.cwd(),
      "src",
      "app",
      "templates",
      template.slug,
      "index.html"
    );

    try {
      // Check if local file exists
      await fs.access(templatePath);

      // For local dev, we can't serve the Vite app directly
      // Show a message that template needs to be built
      const devHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${template.name} - Preview</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-center;
                min-height: 100vh;
                color: white;
              }
              .container {
                text-align: center;
                padding: 2rem;
                max-width: 600px;
              }
              h1 {
                font-size: 2.5rem;
                margin-bottom: 1rem;
              }
              p {
                font-size: 1.125rem;
                opacity: 0.9;
                margin-bottom: 1rem;
              }
              .status {
                display: inline-block;
                padding: 0.5rem 1rem;
                background: rgba(255,255,255,0.2);
                border-radius: 0.5rem;
                margin-top: 1rem;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${template.name}</h1>
              <p>This template will be available for preview once it's been built and deployed.</p>
              <div class="status">
                Status: ${template.processingStatus || "PENDING"}
              </div>
              <p style="font-size: 0.875rem; margin-top: 2rem; opacity: 0.7;">
                Templates are automatically built when uploaded via the admin panel.
              </p>
            </div>
          </body>
        </html>
      `;

      return new NextResponse(devHtml, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    } catch (err) {
      console.error(`Template files not found for ${template.slug}:`, err);

      // Fallback: Return a simple HTML that shows the template info
      const fallbackHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${template.name} - Preview</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-center;
                min-height: 100vh;
                color: white;
              }
              .container {
                text-align: center;
                padding: 2rem;
              }
              h1 {
                font-size: 2.5rem;
                margin-bottom: 1rem;
              }
              p {
                font-size: 1.125rem;
                opacity: 0.9;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${template.name}</h1>
              <p>Template preview will be available once the template is built.</p>
              <p style="font-size: 0.875rem; margin-top: 2rem;">Template: ${template.slug}</p>
            </div>
          </body>
        </html>
      `;

      return new NextResponse(fallbackHtml, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    }
  } catch (error) {
    console.error("Error in template HTML route:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
