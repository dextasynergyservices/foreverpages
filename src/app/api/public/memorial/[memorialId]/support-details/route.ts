import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ memorialId: string }> }) {
  try {
    const resolvedParams = await params;
    console.log("🔍 API: Received params:", resolvedParams);
    const { memorialId } = resolvedParams;
    console.log("🔍 API: Extracted memorialId:", memorialId);

    if (!memorialId) {
      console.log("❌ API: Memorial ID is missing from params");
      return NextResponse.json({ success: false, error: "Memorial ID is required" }, { status: 400 });
    }

    console.log("🔍 API: Looking for memorial with ID:", memorialId);
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        ownerId: true,
        owner: {
          select: {
            name: true,
            accountDetails: true,
          },
        },
      },
    });

    console.log("👤 API: Found memorial:", memorial);

    if (!memorial) {
      console.log("❌ API: Memorial not found for ID:", memorialId);
      return NextResponse.json({ success: false, error: "Memorial not found" }, { status: 404 });
    }

    console.log("💳 API: Owner account details:", memorial.owner.accountDetails);

    return NextResponse.json({
      success: true,
      memorialName: `${memorial.firstName} ${memorial.lastName}`.trim(),
      ownerName: memorial.owner.name,
      ownerId: memorial.ownerId,
      accountDetails: memorial.owner.accountDetails || [],
    });
  } catch (error) {
    console.error("💥 API: Error fetching memorial support details:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}