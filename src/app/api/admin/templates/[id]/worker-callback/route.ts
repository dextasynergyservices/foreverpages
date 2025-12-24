import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const secret = request.nextUrl.searchParams.get("secret");
    if (!secret || secret !== process.env.TEMPLATE_WORKER_CALLBACK_SECRET) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const templateId = params.id;
    const logsRaw = typeof body.logs === "string" ? body.logs : JSON.stringify(body.logs || {});

    // Heuristic: scan logs for error-like lines but ignore known benign messages
    const lines = logsRaw
      .split(/\r?\n/)
      .map((l: string) => l.trim())
      .filter(Boolean);

    const errorRegex =
      /\b(error|failed|fatal|uncaught exception|exited with code|segmentation fault|cannot find module|npm ERR!)\b/i;

    const benignRegex =
      /no ts files found|skipping tsc|eslint couldn't find|eslint couldn't find an eslint.config|typescript .*help|tsc --help/i;

    let foundError = false;
    for (const line of lines) {
      if (errorRegex.test(line)) {
        if (!benignRegex.test(line)) {
          foundError = true;
          break;
        }
      }
    }

    const newStatus = foundError ? "ERROR" : "VALIDATED";

    await prisma.template.update({
      where: { id: templateId },
      data: {
        processingLogs: logsRaw,
        processingStatus: newStatus,
      },
    });

    return NextResponse.json({ message: "OK" });
  } catch (err) {
    console.error("Callback error", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
