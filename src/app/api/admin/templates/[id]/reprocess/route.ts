import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user?.id ||
      !(session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN")
    ) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const templateId = params.id;
    const tpl = await prisma.template.findUnique({ where: { id: templateId } });
    if (!tpl) return NextResponse.json({ message: "Not found" }, { status: 404 });
    if (!tpl.storagePath)
      return NextResponse.json({ message: "No storagePath on template" }, { status: 400 });

    try {
      const { enqueueTemplateProcessing } = await import("@/server/template-workers/queue");
      await enqueueTemplateProcessing(templateId, tpl.storagePath, undefined, true);
    } catch (e) {
      console.error("Failed to enqueue processing:", e);
      return NextResponse.json({ message: "Failed to enqueue processing" }, { status: 500 });
    }

    return NextResponse.json({ message: "Re-enqueued", data: { templateId } });
  } catch (err) {
    console.error("Reprocess failed:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
