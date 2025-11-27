import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deleteFromCloudinary, extractPublicId } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const { field } = body; // e.g. 'previewImage' or 'thumbnailImage'
    if (!field) return NextResponse.json({ error: "Missing field" }, { status: 400 });

    const template = await prisma.template.findUnique({ where: { id: params.id } });
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const url = (template as unknown as Record<string, string | null>)[field] as string | null;
    if (!url) return NextResponse.json({ success: true });

    const publicId = extractPublicId(url);
    if (publicId) await deleteFromCloudinary(publicId, "image");

    // Remove reference from template
    const updateData = { [field]: null } as unknown as Prisma.TemplateUpdateInput;
    await prisma.template.update({ where: { id: params.id }, data: updateData });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete asset:", err);
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
  }
}
