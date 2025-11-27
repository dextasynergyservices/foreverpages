import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Prisma } from "@/generated/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const templateId = params.id;
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: { plans: true },
    });

    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Only admins may download template packages via this endpoint
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role || session.user?.role || "USER";
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: admin access required" }, { status: 403 });
    }

    // Increment downloadCount if field exists
    try {
      const data = { downloadCount: { increment: 1 } } as unknown as Prisma.TemplateUpdateInput;
      await prisma.template.update({ where: { id: templateId }, data });
    } catch {
      // ignore if schema doesn't have the field
    }

    // Record analytics (fire-and-forget)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/templates/analytics/record`, {
        method: "POST",
        body: JSON.stringify({
          templateId,
          eventType: "admin_download",
          userId: session.user.id,
        }),
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // ignore
    }

    // Return package Url if available so client can download
    return NextResponse.json({ data: { packageUrl: template.packageUrl || null } });
  } catch (err) {
    console.error("Marketplace download error:", err);
    return NextResponse.json({ error: "Failed to process download" }, { status: 500 });
  }
}
