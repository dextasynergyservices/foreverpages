import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

/**
 * GET /api/streams/[id]/comments/export
 * Export chat transcript as CSV
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const streamId = params.id;

    // Verify stream ownership
    const stream = await prisma.memorialStream.findUnique({
      where: { id: streamId },
      select: {
        id: true,
        title: true,
        startedAt: true,
        endedAt: true,
        memorial: {
          select: { ownerId: true, firstName: true, lastName: true },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    if (stream.memorial.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all comments (including hidden ones for archival purposes)
    const comments = await prisma.streamComment.findMany({
      where: { streamId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Generate CSV
    const csvRows = [
      // Header
      ["Timestamp", "Author Name", "Author Email", "Message", "Status", "Moderation Reason"],
    ];

    for (const comment of comments) {
      const timestamp = format(comment.createdAt, "yyyy-MM-dd HH:mm:ss");
      const authorName = comment.authorName;
      const authorEmail = comment.authorEmail || comment.user?.email || "N/A";
      const message = comment.content.replace(/"/g, '""'); // Escape quotes
      const status = comment.isHidden ? "Hidden" : comment.isPinned ? "Pinned" : "Visible";
      const moderationReason = comment.moderationReason || "";

      csvRows.push([
        timestamp,
        authorName,
        authorEmail,
        `"${message}"`, // Wrap in quotes for CSV
        status,
        moderationReason,
      ]);
    }

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");

    // Generate filename
    const streamTitle = stream.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const dateStr = stream.startedAt
      ? format(stream.startedAt, "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");
    const filename = `chat_${streamTitle}_${dateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting chat:", error);
    return NextResponse.json({ error: "Failed to export chat" }, { status: 500 });
  }
}
