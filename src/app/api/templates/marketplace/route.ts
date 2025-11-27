import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? undefined;
    const category = url.searchParams.get("category") ?? undefined;
    const sort = (url.searchParams.get("sort") as string) ?? "popular";
    const planId = url.searchParams.get("planId") ?? undefined;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscriptions: true, currentPlan: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const planIds = new Set<string>();
    if (user.currentPlan) planIds.add(user.currentPlan.id);
    for (const s of user.subscriptions ?? []) {
      if (s.status === "ACTIVE" || s.status === "GRACE_PERIOD") {
        if (s.planId) planIds.add(s.planId);
      }
    }

    // Build a typed where clause — only templates assigned to user's plans
    const where: Prisma.TemplateWhereInput = { isActive: true };
    if (planIds.size) {
      where.plans = { some: { id: { in: Array.from(planIds) } } };
    } else {
      return NextResponse.json({ data: { templates: [] } });
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "all") {
      const cats = category
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      if (cats.length === 1) {
        where.templateCategories = {
          some: { category: { name: { equals: cats[0], mode: "insensitive" } } },
        };
      } else if (cats.length > 1) {
        where.templateCategories = {
          some: { category: { name: { in: cats, mode: "insensitive" } } },
        };
      }
    }

    if (planId && planIds.has(planId)) {
      where.plans = { some: { id: planId } };
    }

    const orderBy: Prisma.TemplateOrderByWithRelationInput =
      sort === "newest" ? { createdAt: "desc" } : { usageCount: "desc" };

    const include = { templateCategories: { include: { category: true } }, plans: true };

    const templates = await prisma.template.findMany({
      where,
      include,
      orderBy,
      take: 100,
    });

    type TemplateWithRelations = Prisma.TemplateGetPayload<{ include: typeof include }>;

    const mapped = (templates as TemplateWithRelations[]).map((t) => {
      const rec = t as unknown as Record<string, unknown>;
      const ratingVal = Number(rec["rating"] ?? 0) || 0;
      const reviewCountVal = Number(rec["reviewCount"] ?? 0) || 0;
      const isFeaturedVal = Boolean(rec["isFeatured"] ?? false);
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        previewImage: t.previewImage,
        thumbnailImage: t.thumbnailImage,
        rating: ratingVal,
        reviewCount: reviewCountVal,
        downloadCount: Number(t.usageCount ?? 0) || 0,
        category: t.templateCategories?.[0]?.category?.name ?? "uncategorized",
        tags: [],
        author: { name: "Admin" },
        // Treat templates assigned to plans as premium (paid) templates
        isPremium: (t.plans?.length ?? 0) > 0,
        isFeatured: isFeaturedVal,
        createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
      };
    });

    return NextResponse.json({ data: { templates: mapped } });
  } catch (err) {
    console.error("Marketplace list error:", err);
    return NextResponse.json({ error: "Failed to fetch marketplace" }, { status: 500 });
  }
}
