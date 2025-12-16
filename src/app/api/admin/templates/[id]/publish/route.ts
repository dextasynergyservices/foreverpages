import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

/**
 * POST /api/admin/templates/[id]/publish
 * Publish a VALIDATED template (make it active and available for users)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get template
    const template = await prisma.template.findUnique({
      where: { id },
      select: {
        id: true,
        processingStatus: true,
        isActive: true,
        slug: true,
      },
    });

    if (!template) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    // Only allow publishing VALIDATED templates
    if (template.processingStatus !== "VALIDATED") {
      return NextResponse.json(
        {
          message: `Cannot publish template with status ${template.processingStatus}. Only VALIDATED templates can be published.`,
        },
        { status: 400 }
      );
    }

    // Update template to published state
    const updated = await prisma.template.update({
      where: { id },
      data: {
        isActive: true,
        isFeatured: false, // Can be manually set to true later if needed
        processingStatus: "PUBLISHED",
        processingLogs: `Template published and activated at ${new Date().toISOString()}`,
      },
      include: {
        sections: true,
        plans: true,
      },
    });

    return NextResponse.json({
      message: "Template published successfully",
      template: {
        id: updated.id,
        slug: updated.slug,
        isActive: updated.isActive,
        isFeatured: updated.isFeatured,
        processingStatus: updated.processingStatus,
        sectionsCount: updated.sections.length,
        plansCount: updated.plans.length,
      },
    });
  } catch (error) {
    console.error("Error publishing template:", error);
    return NextResponse.json(
      {
        message: "Failed to publish template",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/templates/[id]/publish
 * Unpublish a template (deactivate it)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Update template to unpublished state
    const updated = await prisma.template.update({
      where: { id },
      data: {
        isActive: false,
        processingStatus: "VALIDATED",
        processingLogs: `Template unpublished/deactivated at ${new Date().toISOString()}`,
      },
    });

    return NextResponse.json({
      message: "Template unpublished successfully",
      template: {
        id: updated.id,
        isActive: updated.isActive,
        processingStatus: updated.processingStatus,
      },
    });
  } catch (error) {
    console.error("Error unpublishing template:", error);
    return NextResponse.json(
      {
        message: "Failed to unpublish template",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
