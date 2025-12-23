import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        accountDetails: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      accountDetails: user.accountDetails || [],
      ownerName: user.name,
    });
  } catch (error) {
    console.error("Error fetching user account details:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch account details",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
