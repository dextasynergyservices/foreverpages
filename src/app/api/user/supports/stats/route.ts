import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import log from "@/lib/logger";

/**
 * Get exchange rates from the same API used by the frontend
 */
async function getExchangeRates(): Promise<Record<string, number>> {
  try {
    // Use the same environment variable as the frontend
    const apiKey = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY;
    log.info("🔑 Exchange API Key available:", !!apiKey);

    const apiUrl = apiKey
      ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
      : `https://api.exchangerate-api.com/v4/latest/USD`;

    log.info("📡 Fetching exchange rates from:", apiUrl.replace(apiKey || "", "HIDDEN"));

    const response = await fetch(apiUrl);
    log.info("📨 Exchange API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      log.info("❌ Exchange API error response:", errorText);
      throw new Error(`Exchange rate API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    log.info("💱 Exchange API data received:", {
      success: data.result || "unknown",
      ratesCount: Object.keys(data.rates || {}).length,
      NGN: data.rates?.NGN,
      USD: data.rates?.USD,
    });

    if (data && data.rates) {
      return data.rates;
    } else {
      log.info("❌ Invalid exchange rate API response format:", data);
      throw new Error("Invalid exchange rate API response format");
    }
  } catch (error) {
    log.error("❌ Failed to fetch exchange rates:", error);
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
    log.info("📊 Stats API called for userId:", userId);

    // Get real exchange rates from the same API used by frontend
    let exchangeRates: Record<string, number>;
    try {
      exchangeRates = await getExchangeRates();
      log.info("💱 Exchange rates fetched successfully");
    } catch (error) {
      log.error("❌ Exchange rates unavailable:", error);
      // Temporary fallback to show data while debugging
      log.info("🔄 Using temporary fallback rates for debugging");
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
    log.info("🔍 Found received supports:", receivedSupports.length);

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
    log.info("🔍 Found sent supports:", sentSupports.length);

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

    log.info("💰 Support stats calculation:", {
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
    log.error("Error fetching support stats:", error);
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
