import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { scanComponents, generateSectionConfig } from "@/lib/template/component-scanner";
import { processTemplateUpload } from "@/lib/template/enhanced-upload-handler";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role || "USER")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { extractedPath } = body;

    if (!extractedPath) {
      return NextResponse.json({ message: "extractedPath is required" }, { status: 400 });
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

    // Scan components in the extracted template
    const scanResult = await scanComponents(fullPath);

    // Process template to get scaffold configuration
    const processResult = await processTemplateUpload(fullPath);

    // Generate section configuration from detected components
    const sectionConfig = generateSectionConfig(scanResult);

    return NextResponse.json({
      success: true,
      config: {
        name: processResult.config.name || "Unnamed Template",
        slug: processResult.config.slug || "unnamed-template",
        description: processResult.config.description || "",
        author: processResult.config.author || "ForeverPages",
        version: processResult.config.version || "1.0.0",
        designTokens: processResult.config.designTokens,
        sections: sectionConfig.length > 0 ? sectionConfig : processResult.config.sections,
        features: processResult.config.features,
      },
      detectedComponents: scanResult.components.map((comp) => ({
        name: comp.name,
        filePath: comp.filePath,
        type: comp.type,
        sectionType: comp.sectionType,
        hasDefaultExport: comp.hasDefaultExport,
        props: comp.props,
      })),
      generatedFiles: processResult.generatedFiles.map((file) => ({
        path: file.path,
        description: file.description,
      })),
      warnings: [...processResult.warnings, ...scanResult.warnings],
      errors: [...processResult.errors, ...scanResult.errors],
      sections: {
        detected: scanResult.sections.length,
        configured: sectionConfig.length,
      },
    });
  } catch (error) {
    console.error("Scaffold preview error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to analyze template",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
