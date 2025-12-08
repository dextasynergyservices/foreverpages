import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@/generated/prisma";
import { getUserMemorialRole } from "@/lib/permissions";

const prisma = new PrismaClient();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized - Please log in" }, { status: 401 });
    }

    const { id: templateId } = await params;
    const body = await request.json();

    // Body should contain design tokens
    const { colors, fonts, layout } = body;

    if (!colors && !fonts && !layout) {
      return NextResponse.json(
        { message: "At least one design token category is required" },
        { status: 400 }
      );
    }

    // Verify that the template belongs to the user or get it via memorial
    const userTemplate = await prisma.userTemplate.findUnique({
      where: { id: templateId },
      select: {
        userId: true,
        config: true,
        memorials: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!userTemplate) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    // Check if user is owner
    const isOwner = userTemplate.userId === session.user.id;

    // Check if user is ADMIN or EDITOR collaborator on the memorial using this template
    let hasPermission = isOwner;

    if (!isOwner && userTemplate.memorials.length > 0) {
      const memorialId = userTemplate.memorials[0].id;
      const userRole = await getUserMemorialRole(session.user.id, memorialId);

      // ADMIN and EDITOR can edit template customizations
      hasPermission = userRole === "ADMIN" || userRole === "EDITOR";
    }

    if (!hasPermission) {
      return NextResponse.json(
        { message: "Unauthorized - You cannot modify this template" },
        { status: 403 }
      );
    }

    // Merge new design tokens with existing config
    const existingConfig = (userTemplate.config as Record<string, unknown>) || {};
    const designTokens = {
      colors: colors || existingConfig.colors,
      fonts: fonts || existingConfig.fonts,
      layout: layout || existingConfig.layout,
    };

    // Update the template with new design tokens
    const updatedTemplate = await prisma.userTemplate.update({
      where: { id: templateId },
      data: {
        config: designTokens,
      },
      select: {
        id: true,
        name: true,
        config: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Design tokens saved successfully",
        data: updatedTemplate,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving design tokens:", error);
    return NextResponse.json(
      { message: "Internal server error - Please try again later" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized - Please log in" }, { status: 401 });
    }

    const { id: templateId } = await params;

    // Get the template and verify ownership or collaborator access
    const userTemplate = await prisma.userTemplate.findUnique({
      where: { id: templateId },
      select: {
        id: true,
        userId: true,
        config: true,
        name: true,
        memorials: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!userTemplate) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    // Check if user is owner
    const isOwner = userTemplate.userId === session.user.id;

    // Check if user is ADMIN or EDITOR collaborator on the memorial using this template
    let hasPermission = isOwner;

    if (!isOwner && userTemplate.memorials.length > 0) {
      const memorialId = userTemplate.memorials[0].id;
      const userRole = await getUserMemorialRole(session.user.id, memorialId);

      // ADMIN and EDITOR can view template customizations
      hasPermission = userRole === "ADMIN" || userRole === "EDITOR";
    }

    if (!hasPermission) {
      return NextResponse.json(
        { message: "Unauthorized - You cannot access this template" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        message: "Design tokens retrieved successfully",
        data: {
          templateId: userTemplate.id,
          config: userTemplate.config,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving design tokens:", error);
    return NextResponse.json(
      { message: "Internal server error - Please try again later" },
      { status: 500 }
    );
  }
}
