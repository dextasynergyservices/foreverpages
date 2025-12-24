import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role || "USER")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const t = await prisma.template.findUnique({
      where: { id },
      select: {
        processingStatus: true,
        id: true,
        processingLogs: true,
        processingLogsUrl: true,
        packageUrl: true,
        prUrl: true,
        prNumber: true,
      },
    });
    if (!t) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({
      id: t.id,
      processingStatus: t.processingStatus,
      processingLogs: t.processingLogs,
      processingLogsUrl: t.processingLogsUrl,
      packageUrl: t.packageUrl,
      prUrl: t.prUrl,
      prNumber: t.prNumber,
    });
  } catch (e) {
    console.error("Status endpoint error", e);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
