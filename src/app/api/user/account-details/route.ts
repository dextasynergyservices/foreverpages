import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { accountDetails: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      accountDetails: user.accountDetails || [],
    });
  } catch (error) {
    console.error("Error fetching account details:", error);
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { accountDetails } = await req.json();

    if (!Array.isArray(accountDetails)) {
      return NextResponse.json(
        { success: false, error: "Invalid account details format" },
        { status: 400 }
      );
    }

    // Validate account details structure
    for (const account of accountDetails) {
      if (!account.accountName || !account.accountNumber || !account.type) {
        return NextResponse.json(
          { success: false, error: "Missing required account details" },
          { status: 400 }
        );
      }
    }

    // Update user's account details
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { accountDetails },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser.accountDetails,
    });
  } catch (error) {
    console.error("Error updating account details:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update account details",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
