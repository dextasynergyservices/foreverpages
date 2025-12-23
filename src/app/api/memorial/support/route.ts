import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const {
      memorialOwnerId,
      memorialId, // Accept memorialId for tracking
      amount,
      currency = "USD",
      accountType,
      message,
      donorName,
      donorEmail,
      donorPhone,
    } = await req.json();

    console.log("💳 Support API received data:", {
      memorialOwnerId,
      memorialId,
      amount,
      currency,
      accountType,
      donorName,
      donorEmail,
      donorPhone,
      message: message ? "Present" : "None",
    });

    if (!memorialOwnerId || !amount || amount <= 0) {
      console.log(
        "❌ Support API: Invalid data - memorialOwnerId:",
        memorialOwnerId,
        "amount:",
        amount
      );
      return NextResponse.json({ success: false, error: "Invalid support data" }, { status: 400 });
    }

    // Get current session to track sender
    const session = await getServerSession(authOptions);
    const donorUserId = session?.user?.id || null;

    // Record the support entry with enhanced tracking
    const support = await prisma.memorialSupport.create({
      data: {
        memorialOwnerId,
        donorUserId,
        amount,
        currency,
        accountType,
        message: message || null,
        donorName: donorName || session?.user?.name || null,
        donorEmail: donorEmail || session?.user?.email || null,
        donorPhone: donorPhone || null,
        createdAt: new Date(),
      },
    });

    console.log(
      "✅ Support record created:",
      support.id,
      "for owner:",
      memorialOwnerId,
      "amount:",
      amount,
      currency
    );

    // Send notification to memorial owner
    const senderName = donorName || session?.user?.name || "Someone";
    const currencySymbol =
      currency === "USD"
        ? "$"
        : currency === "EUR"
          ? "€"
          : currency === "GBP"
            ? "£"
            : currency === "NGN"
              ? "₦"
              : currency;

    await prisma.notification.create({
      data: {
        userId: memorialOwnerId,
        type: "SUPPORT_RECEIVED",
        title: "New Memorial Support",
        message: `${senderName} has sent support of ${currencySymbol}${amount} to your memorial.${message ? ` Message: "${message}"` : ""}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: support,
    });
  } catch (error) {
    console.error("Error recording memorial support:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to record support",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
