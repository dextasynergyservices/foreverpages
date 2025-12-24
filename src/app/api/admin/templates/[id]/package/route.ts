import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role || "USER")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = params.id;
    const t = await prisma.template.findUnique({ where: { id }, select: { packageUrl: true } });
    if (!t) return NextResponse.json({ message: "Not found" }, { status: 404 });
    if (!t.packageUrl)
      return NextResponse.json({ message: "No package persisted" }, { status: 404 });
    return NextResponse.json({ data: { packageUrl: t.packageUrl } });
  } catch (e) {
    console.error("Package endpoint error", e);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
