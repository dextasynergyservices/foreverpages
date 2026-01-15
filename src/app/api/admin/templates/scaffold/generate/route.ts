import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateTemplateScaffold } from "@/lib/template/scaffold-generator";
import { prepareFilesForPR } from "@/lib/template/enhanced-upload-handler";
import { createPrForTemplate } from "@/lib/github/pr";
import { TemplateScaffoldConfig, TemplateSection } from "@/lib/template/types";
import fs from "fs";
import path from "path";
import { Prisma } from "@/generated/prisma";

export const runtime = "nodejs";

interface GenerateRequestBody {
  templateId?: string;
  extractedPath: string;
  config: {
    name: string;
    slug: string;
    description: string;
    author: string;
    version: string;
    designTokens: TemplateScaffoldConfig["designTokens"];
    sections: Array<{
      id: string;
      name: string;
      component: string;
      required: boolean;
      description?: string;
    }>;
    features?: TemplateScaffoldConfig["features"];
  };
  sectionMappings: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role || "USER")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const requestBody: GenerateRequestBody = await request.json();
    const { templateId, extractedPath, config, sectionMappings } = requestBody;

    if (!extractedPath) {
      return NextResponse.json({ message: "extractedPath is required" }, { status: 400 });
    }

    if (!config?.name || !config?.slug) {
      return NextResponse.json({ message: "Template name and slug are required" }, { status: 400 });
    }

    // Validate extracted path exists
    const fullPath = path.isAbsolute(extractedPath)
      ? extractedPath
      : path.join(process.cwd(), extractedPath);

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { message: "Extracted template path not found", path: fullPath },
        { status: 404 }
      );
    }

    // Build scaffold configuration with section mappings
    const sections: TemplateSection[] = config.sections.map((section) => ({
      ...section,
      component: sectionMappings[section.id] || section.component,
    }));

    const scaffoldConfig: TemplateScaffoldConfig = {
      name: config.name,
      slug: config.slug,
      description: config.description,
      author: config.author,
      version: config.version,
      designTokens: config.designTokens,
      sections,
      features: config.features,
    };

    // Generate scaffold files
    console.log(`📦 Generating scaffold for template: ${scaffoldConfig.slug}`);
    const scaffoldResult = generateTemplateScaffold(scaffoldConfig);

    if (!scaffoldResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Scaffold generation failed",
          errors: scaffoldResult.errors,
          warnings: scaffoldResult.warnings,
        },
        { status: 400 }
      );
    }

    // Prepare files for PR (merge scaffold with uploaded files)
    const mergedFiles = prepareFilesForPR(fullPath, scaffoldResult.files, scaffoldConfig.slug);

    if (!mergedFiles.length) {
      return NextResponse.json({ message: "No files to generate" }, { status: 400 });
    }

    // Create or update template in database
    let template: Awaited<ReturnType<typeof prisma.template.upsert>>;

    if (templateId) {
      // Update existing template
      template = await prisma.template.update({
        where: { id: templateId },
        data: {
          name: scaffoldConfig.name,
          slug: scaffoldConfig.slug,
          description: scaffoldConfig.description,
          version: scaffoldConfig.version,
          processingStatus: "PROCESSING",
          manifest: JSON.parse(
            JSON.stringify({
              name: scaffoldConfig.name,
              slug: scaffoldConfig.slug,
              version: scaffoldConfig.version,
              description: scaffoldConfig.description,
              author: scaffoldConfig.author,
              sections: scaffoldConfig.sections,
              features: scaffoldConfig.features,
            })
          ) as Prisma.InputJsonValue,
          defaultConfig: JSON.parse(
            JSON.stringify(scaffoldConfig.designTokens)
          ) as Prisma.InputJsonValue,
        },
      });
    } else {
      // Create new template
      template = await prisma.template.create({
        data: {
          name: scaffoldConfig.name,
          slug: scaffoldConfig.slug,
          description: scaffoldConfig.description,
          version: scaffoldConfig.version,
          previewImage: `/templates/${scaffoldConfig.slug}/preview.png`,
          thumbnailImage: `/templates/${scaffoldConfig.slug}/thumbnail.png`,
          componentPath: `templates/${scaffoldConfig.slug}`,
          configPath: `templates/${scaffoldConfig.slug}/config`,
          isNextJsTemplate: true,
          previewMode: "NATIVE",
          processingStatus: "PROCESSING",
          layoutType: "FLEXIBLE",
          isActive: false,
          isFeatured: false,
          storagePath: fullPath,
          manifest: JSON.parse(
            JSON.stringify({
              name: scaffoldConfig.name,
              slug: scaffoldConfig.slug,
              version: scaffoldConfig.version,
              description: scaffoldConfig.description,
              author: scaffoldConfig.author,
              sections: scaffoldConfig.sections,
              features: scaffoldConfig.features,
            })
          ) as Prisma.InputJsonValue,
          defaultConfig: JSON.parse(
            JSON.stringify(scaffoldConfig.designTokens)
          ) as Prisma.InputJsonValue,
          supportedSections: sections
            .map((s) => {
              const mappings: Record<string, string> = {
                hero: "HERO",
                gallery: "GALLERY",
                timeline: "TIMELINE",
                tributes: "TRIBUTES",
                candles: "VIRTUAL_CANDLES",
                condolence: "CONDOLENCES",
                biography: "BIOGRAPHY",
                family: "FAMILY_TREE",
                video: "VIDEO_GALLERY",
                donations: "DONATIONS",
              };
              return mappings[s.id];
            })
            .filter(Boolean) as Array<
            | "HERO"
            | "VIRTUAL_CANDLES"
            | "TIMELINE"
            | "GALLERY"
            | "TRIBUTES"
            | "CONDOLENCES"
            | "BIOGRAPHY"
            | "FAMILY_TREE"
            | "VIDEO_GALLERY"
            | "DONATIONS"
          >,
        },
      });
    }

    // Create GitHub PR with the generated files
    const safeSlug = scaffoldConfig.slug
      .toLowerCase()
      .replace(/[^a-z0-9\-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);

    const branch = `template/${safeSlug}-${template.id}-${Date.now()}`;
    const title = `Add template: ${scaffoldConfig.name}`;

    // Build PR body with scaffold info
    const scaffoldFilesList = scaffoldResult.files
      .map((f) => `  - \`${f.path}\` - ${f.description}`)
      .join("\n");

    const prBody = `## Template Scaffold Generation

**Template:** ${scaffoldConfig.name}
**Slug:** ${scaffoldConfig.slug}
**Version:** ${scaffoldConfig.version}
**Template ID:** ${template.id}

### Description
${scaffoldConfig.description || "No description provided"}

### Sections (${sections.length})
${sections.map((s) => `- **${s.name}** (${s.component})`).join("\n")}

### Files Summary
- **Total files:** ${mergedFiles.length}
- **Scaffold-generated files:** ${scaffoldResult.files.length}
- **Uploaded files:** ${mergedFiles.length - scaffoldResult.files.length}

### Scaffold-Generated Files
The following files were auto-generated by the scaffold system:
${scaffoldFilesList}

### File Locations
- Template: \`src/app/templates/${scaffoldConfig.slug}/\`
- MemorialTemplate Bridge: \`src/components/templates/components/${scaffoldConfig.slug}/MemorialTemplate.tsx\`
${mergedFiles.find((f) => f.path.includes("public/")) ? `- Public assets: \`public/templates/${scaffoldConfig.slug}/\`` : ""}

### Design Tokens
\`\`\`json
${JSON.stringify(scaffoldConfig.designTokens, null, 2)}
\`\`\`

${scaffoldResult.warnings && scaffoldResult.warnings.length > 0 ? `### Warnings\n${scaffoldResult.warnings.map((w) => `- ${w}`).join("\n")}` : ""}

---
*This PR was created by the Template Configuration Wizard with scaffold generation.*`;

    console.log(
      `📤 Creating GitHub PR with ${mergedFiles.length} files for template ${template.id}`
    );

    const pr = await createPrForTemplate(branch, mergedFiles, title, prBody, "develop");

    // Update template with PR info
    await prisma.template.update({
      where: { id: template.id },
      data: {
        prNumber: pr.number.toString(),
        prUrl: pr.url,
        processingStatus: "VALIDATED",
        processingLogs: `PR created successfully - ${scaffoldResult.files.length} files generated. Awaiting merge to become active.`,
      },
    });

    console.log(`✅ PR created for template ${template.id}: ${pr.url}`);

    return NextResponse.json({
      success: true,
      message: "Template scaffold generated and PR created",
      data: {
        template: {
          id: template.id,
          name: template.name,
          slug: template.slug,
          version: template.version,
          processingStatus: "VALIDATED",
        },
        pr: {
          number: pr.number,
          url: pr.url,
          branch,
        },
        scaffold: {
          generated: scaffoldResult.files.length,
          files: scaffoldResult.files.map((f) => f.path),
          warnings: scaffoldResult.warnings,
        },
        note: "Template will be active after PR is merged to develop branch",
      },
    });
  } catch (error) {
    console.error("Scaffold generation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate scaffold",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
