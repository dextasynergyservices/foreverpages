import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

function serializeEvent(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role || "USER")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      // close if client disconnects
      const onClose = () => {
        closed = true;
      };

      // keep last seen snapshot to avoid duplicate events
      let last: Record<string, unknown> | null = null;

      async function pollOnce() {
        if (closed) return;
        try {
          const t = await prisma.template.findUnique({
            where: { id },
            select: {
              id: true,
              processingStatus: true,
              processingLogs: true,
              processingLogsUrl: true,
              packageUrl: true,
              prUrl: true,
              prNumber: true,
            },
          });
          if (!t) {
            controller.enqueue(serializeEvent({ type: "not_found" }));
            controller.close();
            return;
          }
          const now = {
            id: t.id,
            status: t.processingStatus,
            logs: t.processingLogs,
            logsUrl: t.processingLogsUrl,
            packageUrl: t.packageUrl,
            prUrl: t.prUrl,
            prNumber: t.prNumber,
          } as Record<string, unknown>;
          const changed = JSON.stringify(last) !== JSON.stringify(now);
          if (changed) {
            controller.enqueue(serializeEvent({ type: "update", payload: now }));
            last = now;
          }
        } catch (e) {
          controller.enqueue(serializeEvent({ type: "error", message: String(e) }));
        }
      }

      // initial poll immediately
      await pollOnce();

      // Poll every 2s
      const iv = setInterval(async () => {
        if (closed) return clearInterval(iv);
        await pollOnce();
      }, 2000);

      // Keep the stream alive with comments
      const keepAlive = setInterval(() => {
        if (closed) return clearInterval(keepAlive);
        controller.enqueue(`: keep-alive\n\n`);
      }, 15000);

      // There's no direct way to detect client disconnect here in Next's edge runtime,
      // but when controller.close is called (by us) we should clean up.
      controller.enqueue(serializeEvent({ type: "ready" }));

      // When the stream is canceled by the runtime, this cancel method is called
      return () => {
        clearInterval(iv);
        clearInterval(keepAlive);
        onClose();
      };
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
