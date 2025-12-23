import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Get exchange rates from the same API used by the frontend
 */
async function getExchangeRates(): Promise<Record<string, number>> {
  try {
    // Use the same environment variable as the frontend
    const apiKey = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY;
    console.log("🔑 Exchange API Key available:", !!apiKey);

    const apiUrl = apiKey
      ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
      : `https://api.exchangerate-api.com/v4/latest/USD`;

    console.log("📡 Fetching exchange rates from:", apiUrl.replace(apiKey || "", "HIDDEN"));

    const response = await fetch(apiUrl);
    console.log("📨 Exchange API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ Exchange API error response:", errorText);
      throw new Error(`Exchange rate API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("💱 Exchange API data received:", {
      success: data.result || "unknown",
      ratesCount: Object.keys(data.rates || {}).length,
      NGN: data.rates?.NGN,
      USD: data.rates?.USD,
    });

    if (data && data.rates) {
      return data.rates;
    } else {
      console.log("❌ Invalid exchange rate API response format:", data);
      throw new Error("Invalid exchange rate API response format");
    }
  } catch (error) {
    console.error("❌ Failed to fetch exchange rates:", error);
    throw error;
  }
}

/**
 * GET /api/user/supports/stats
 * Get support statistics for the current user
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("📊 Stats API called for userId:", userId);

    // Get real exchange rates from the same API used by frontend
    let exchangeRates: Record<string, number>;
    try {
      exchangeRates = await getExchangeRates();
      console.log("💱 Exchange rates fetched successfully");
    } catch (error) {
      console.error("❌ Exchange rates unavailable:", error);
      // Temporary fallback to show data while debugging
      console.log("🔄 Using temporary fallback rates for debugging");
      exchangeRates = {
        USD: 1.0,
        NGN: 1650.0,
        EUR: 0.85,
        GBP: 0.73,
      };
    }

    // Get received supports with individual records to handle currency conversion and calculate new stats
    const receivedSupports = await prisma.memorialSupport.findMany({
      where: {
        memorialOwnerId: userId,
      },
      select: {
        amount: true,
        currency: true,
        createdAt: true,
        donorName: true,
        donor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    console.log("🔍 Found received supports:", receivedSupports.length, "records");

    // Get sent supports with individual records to handle currency conversion
    const sentSupports = await prisma.memorialSupport.findMany({
      where: {
        donorUserId: userId,
      },
      select: {
        amount: true,
        currency: true,
      },
    });
    console.log("🔍 Found sent supports:", sentSupports.length, "records");

    // Convert all amounts to USD and sum (using same logic as frontend)
    const totalReceivedUSD = receivedSupports.reduce((total, support) => {
      const rate = exchangeRates[support.currency];
      if (!rate || support.currency === "USD") {
        return total + support.amount; // Already USD or no rate available
      }
      const usdAmount = support.amount / rate; // Convert to USD
      return total + usdAmount;
    }, 0);

    const totalSentUSD = sentSupports.reduce((total, support) => {
      const rate = exchangeRates[support.currency];
      if (!rate || support.currency === "USD") {
        return total + support.amount; // Already USD or no rate available
      }
      const usdAmount = support.amount / rate; // Convert to USD
      return total + usdAmount;
    }, 0);

    // Calculate enhanced stats
    const averageSupport =
      receivedSupports.length > 0 ? totalReceivedUSD / receivedSupports.length : 0;
    const lastSupportDate =
      receivedSupports.length > 0 ? receivedSupports[0].createdAt.toISOString() : null;

    // Find top supporter by amount (convert to USD for comparison)
    let topSupporterName = null;
    let topSupportAmount = 0;

    receivedSupports.forEach((support) => {
      const rate = exchangeRates[support.currency] || 1;
      const usdAmount = support.currency === "USD" ? support.amount : support.amount / rate;

      if (usdAmount > topSupportAmount) {
        topSupportAmount = usdAmount;
        topSupporterName = support.donorName || support.donor?.name || "Anonymous";
      }
    });

    // Calculate current month vs last month totals
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const currentMonthSupports = receivedSupports.filter(
      (support) => support.createdAt >= currentMonthStart
    );
    const lastMonthSupports = receivedSupports.filter(
      (support) => support.createdAt >= lastMonthStart && support.createdAt < currentMonthStart
    );

    const currentMonthTotal = currentMonthSupports.reduce((total, support) => {
      const rate = exchangeRates[support.currency] || 1;
      const usdAmount = support.currency === "USD" ? support.amount : support.amount / rate;
      return total + usdAmount;
    }, 0);

    const lastMonthTotal = lastMonthSupports.reduce((total, support) => {
      const rate = exchangeRates[support.currency] || 1;
      const usdAmount = support.currency === "USD" ? support.amount : support.amount / rate;
      return total + usdAmount;
    }, 0);

    const stats = {
      totalReceived: totalReceivedUSD,
      totalSent: totalSentUSD,
      receivedCount: receivedSupports.length,
      sentCount: sentSupports.length,
      averageSupport,
      lastSupportDate,
      topSupporterName,
      topSupportAmount,
      currentMonthTotal,
      lastMonthTotal,
    };

    console.log("💰 Support stats calculation:", {
      userId,
      receivedSupports: receivedSupports.map((s) => ({
        amount: s.amount,
        currency: s.currency,
        convertedUSD:
          s.currency === "USD"
            ? s.amount
            : exchangeRates[s.currency]
              ? s.amount / exchangeRates[s.currency]
              : 0,
      })),
      totalReceivedUSD: totalReceivedUSD.toFixed(2),
      sentSupports: sentSupports.map((s) => ({
        amount: s.amount,
        currency: s.currency,
        convertedUSD:
          s.currency === "USD"
            ? s.amount
            : exchangeRates[s.currency]
              ? s.amount / exchangeRates[s.currency]
              : 0,
      })),
      totalSentUSD: totalSentUSD.toFixed(2),
      exchangeRates: {
        USD: exchangeRates.USD,
        NGN: exchangeRates.NGN,
        EUR: exchangeRates.EUR,
        GBP: exchangeRates.GBP,
      },
    });

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching support stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch support statistics",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
