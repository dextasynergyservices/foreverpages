import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/streams/[id]/analytics/export
 * Generate and download analytics as PDF report
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id: streamId } = await params;

    // Check if stream exists
    const stream = await prisma.memorialStream.findUnique({
      where: { id: streamId },
      include: {
        memorial: {
          select: {
            ownerId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    // Only owner can export analytics
    if (session?.user?.id !== stream.memorial.ownerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get analytics data
    const viewers = await prisma.streamViewer.findMany({
      where: { streamId },
      include: { user: { select: { name: true, email: true } } },
    });

    const comments = await prisma.streamComment.findMany({
      where: { streamId },
      select: { content: true, createdAt: true },
    });

    const reactions = await prisma.streamReaction.findMany({
      where: { streamId },
      select: { type: true },
    });

    // Calculate metrics
    const totalViews = stream.totalViews;
    const peakViewers = stream.peakViewers;
    const totalComments = comments.length;
    const totalReactions = reactions.length;
    const uniqueViewers = new Set(viewers.map((v) => v.userId || v.id)).size;
    const registeredViewers = viewers.filter((v) => v.userId).length;
    const anonymousViewers = viewers.filter((v) => !v.userId).length;

    // Duration calculation
    const duration =
      stream.startedAt && stream.endedAt
        ? Math.floor(
            (new Date(stream.endedAt).getTime() - new Date(stream.startedAt).getTime()) / 1000
          )
        : 0;

    const formatDuration = (seconds: number): string => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
      return `${mins}m ${secs}s`;
    };

    // Generate simple HTML report (In production, use a proper PDF library like puppeteer or jsPDF)
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${stream.title} - Analytics Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 { color: #7c3aed; border-bottom: 3px solid #7c3aed; padding-bottom: 10px; }
    h2 { color: #6b21a8; margin-top: 30px; }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    .metric-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      background: #f9fafb;
    }
    .metric-value {
      font-size: 32px;
      font-weight: bold;
      color: #7c3aed;
    }
    .metric-label {
      font-size: 14px;
      color: #6b7280;
      margin-top: 5px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-label { font-weight: bold; color: #6b7280; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #7c3aed;
      color: white;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>${stream.title} - Analytics Report</h1>

  <div class="info-row">
    <span class="info-label">Memorial:</span>
    <span>${stream.memorial.firstName} ${stream.memorial.lastName}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Stream Started:</span>
    <span>${stream.startedAt ? new Date(stream.startedAt).toLocaleString() : "N/A"}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Stream Ended:</span>
    <span>${stream.endedAt ? new Date(stream.endedAt).toLocaleString() : "N/A"}</span>
  </div>
  <div class="info-row">
    <span class="info-label">Duration:</span>
    <span>${formatDuration(duration)}</span>
  </div>

  <h2>Key Metrics</h2>
  <div class="metric-grid">
    <div class="metric-card">
      <div class="metric-value">${totalViews}</div>
      <div class="metric-label">Total Views</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${peakViewers}</div>
      <div class="metric-label">Peak Viewers</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${formatDuration(stream.averageWatchTime)}</div>
      <div class="metric-label">Avg Watch Time</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${stream.replayViews}</div>
      <div class="metric-label">Replay Views</div>
    </div>
  </div>

  <h2>Engagement</h2>
  <div class="metric-grid">
    <div class="metric-card">
      <div class="metric-value">${totalComments}</div>
      <div class="metric-label">Total Comments</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${totalReactions}</div>
      <div class="metric-label">Total Reactions</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${uniqueViewers}</div>
      <div class="metric-label">Unique Viewers</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${(((totalComments + totalReactions) / (totalViews || 1)) * 100).toFixed(1)}%</div>
      <div class="metric-label">Engagement Rate</div>
    </div>
  </div>

  <h2>Audience Breakdown</h2>
  <table>
    <tr>
      <th>Category</th>
      <th>Count</th>
      <th>Percentage</th>
    </tr>
    <tr>
      <td>Registered Viewers</td>
      <td>${registeredViewers}</td>
      <td>${((registeredViewers / (uniqueViewers || 1)) * 100).toFixed(1)}%</td>
    </tr>
    <tr>
      <td>Anonymous Viewers</td>
      <td>${anonymousViewers}</td>
      <td>${((anonymousViewers / (uniqueViewers || 1)) * 100).toFixed(1)}%</td>
    </tr>
  </table>

  <div class="footer">
    <p>Generated on ${new Date().toLocaleString()}</p>
    <p>Forever Pages - Memorial Livestream Analytics</p>
  </div>
</body>
</html>
    `;

    // Return HTML as PDF-like response
    // In production, use puppeteer or similar to convert HTML to actual PDF
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${stream.title.replace(/[^a-z0-9]/gi, "_")}_analytics.html"`,
      },
    });
  } catch (error) {
    console.error("Analytics export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
