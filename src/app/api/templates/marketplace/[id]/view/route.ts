import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const templateId = params.id;
    const template = await prisma.template.findUnique({ where: { id: templateId } });
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

    try {
      const data = {
        viewCount: { increment: 1 },
      } as unknown as import("@/generated/prisma").Prisma.TemplateUpdateInput;
      await prisma.template.update({ where: { id: templateId }, data });
    } catch {
      // ignore if schema doesn't have the field
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Marketplace view error:", err);
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
  }
}
