import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // If userId is provided in query params, fetch for that user (for peace template compatibility)
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { accountDetails: true, name: true },
      });

      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        accountDetails: user.accountDetails || [],
        ownerName: user.name,
      });
    }

    // Default behavior: fetch for authenticated user
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
      if (!account.accountName || !account.type) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required account details (name and type are required)",
          },
          { status: 400 }
        );
      }

      // Account number is required for traditional payment methods but optional for link-based methods
      const linkBasedTypes = ["paypal", "paystack", "stripe", "other"];
      if (!linkBasedTypes.includes(account.type) && !account.accountNumber) {
        return NextResponse.json(
          { success: false, error: "Account number is required for this payment method" },
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
