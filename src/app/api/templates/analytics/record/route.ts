import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type AnalyticsEvent = {
  templateId: string;
  eventType: "view" | "download" | "purchase";
  userId?: string | null;
  planId?: string | null;
  timestamp: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "template-analytics.json");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = body as AnalyticsEvent;
    if (!event || !event.templateId || !event.eventType) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const existing = fs.existsSync(FILE_PATH) ? JSON.parse(fs.readFileSync(FILE_PATH, "utf8")) : [];
    existing.push({ ...event, timestamp: new Date().toISOString() });
    fs.writeFileSync(FILE_PATH, JSON.stringify(existing, null, 2), "utf8");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Analytics record error:", err);
    return NextResponse.json({ error: "Failed to record analytics" }, { status: 500 });
  }
}
