import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ ownerId: string }> }) {
  try {
    const { ownerId } = await params;

    console.log("🔍 API: Looking for user with ownerId:", ownerId);
    console.log("🔍 API: Params object:", await params);

    if (!ownerId) {
      return NextResponse.json({ success: false, error: "Owner ID is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: ownerId },
      select: {
        id: true,
        name: true,
        accountDetails: true,
      },
    });

    console.log("👤 API: Found user:", user);

    if (!user) {
      console.log("❌ API: User not found for ownerId:", ownerId);
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    console.log("💳 API: User account details:", user.accountDetails);

    return NextResponse.json({
      success: true,
      ownerName: user.name,
      accountDetails: user.accountDetails || [],
    });
  } catch (error) {
    console.error("💥 API: Error fetching owner account details:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}