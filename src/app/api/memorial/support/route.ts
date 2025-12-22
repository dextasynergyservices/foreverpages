import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { memorialOwnerId, amount, accountType, message } = await req.json();

    if (!memorialOwnerId || !amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid support data" }, { status: 400 });
    }

    // Record the support entry (you can expand this model as needed)
    const support = await prisma.memorialSupport.create({
      data: {
        memorialOwnerId,
        amount,
        accountType,
        message: message || null,
        createdAt: new Date(),
      },
    });

    // Optional: Send notification to memorial owner
    await prisma.notification.create({
      data: {
        userId: memorialOwnerId,
        type: "SUPPORT_RECEIVED",
        title: "New Memorial Support",
        message: `Someone has sent support of $${amount} to your memorial.`,
        data: {
          supportId: support.id,
          amount,
          accountType,
          message,
        },
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
