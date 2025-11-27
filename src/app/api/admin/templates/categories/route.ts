import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.templateCategory.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        templateCategories: {
          include: {
            template: {
              select: {
                id: true,
                name: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    // Map templateCategories relation to a `templates` array for frontend convenience
    const mapped = categories.map((c) => ({
      ...c,
      templates: c.templateCategories?.map((tc) => tc.template) || [],
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description, icon, color, displayOrder = 0 } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const category = await prisma.templateCategory.create({
      data: {
        name,
        slug: slug.toLowerCase(),
        description,
        icon,
        color,
        displayOrder,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating category:", error);
    const err = error as {
      code?: string;
      meta?: { target?: string[] };
      message?: string;
      stack?: string;
    };

    // Handle Prisma unique constraint errors
    if (err?.code === "P2002") {
      const field = err?.meta?.target?.[0];
      if (field === "name") {
        return NextResponse.json(
          { error: "A category with this name already exists" },
          { status: 400 }
        );
      } else if (field === "slug") {
        return NextResponse.json(
          { error: "A category with this slug already exists" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
