import { NextRequest, NextResponse } from "next/server";
import { cleanupOldExtractions } from "@/server/cleanup/cleanupExtracts";

const INTERNAL_SECRET = process.env.CRON_SECRET || "";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-internal-secret") || "";
  if (!INTERNAL_SECRET || secret !== INTERNAL_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // optional query param days
    const url = new URL(request.url);
    const days = Number(url.searchParams.get("days") || "7");
    await cleanupOldExtractions(days);
    return NextResponse.json({ message: "Cleanup started" });
  } catch (err) {
    console.error("Cleanup endpoint error", err);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}
