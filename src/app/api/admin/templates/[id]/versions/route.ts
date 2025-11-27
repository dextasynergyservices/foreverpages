import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user?.id ||
      !(session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templateId = params.id;
    const versions = await prisma.templateVersion.findMany({
      where: { templateId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: { versions } });
  } catch (err) {
    console.error("Failed to list template versions:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
