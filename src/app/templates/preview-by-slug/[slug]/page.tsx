/**
 * Template Preview Route - Serves templates as standalone preview pages
 * Works for templates in /app/templates/ by serving them directly
 */

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TemplatePreviewBySlugPage({ params }: PageProps) {
  const { slug } = await params;

  // Find template by slug
  const template = await prisma.template.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!template) {
    notFound();
  }

  // Redirect to the template's own dev server or serve the built version
  // For templates in /app/templates/{slug}/, they have their own HTML entry point

  return (
    <html>
      <head>
        <title>{template.name} - Preview</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {/* Iframe pointing to template's own HTML file */}
        <iframe
          src={`/templates/${slug}/`}
          style={{
            width: "100vw",
            height: "100vh",
            border: "none",
            margin: 0,
            padding: 0,
            display: "block",
          }}
          title={`${template.name} Preview`}
        />
      </body>
    </html>
  );
}
