/**
 * Renewal Payment Initialization API Route
 * POST /api/payment/renewal/initialize
 *
 * Initializes a Paystack payment for Forever Access (Lifetime) renewal
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { convertCurrency, SupportedCurrency } from "@/lib/currency-converter";
import { initializePayment, toSmallestUnit } from "@/lib/paystack";
import { generatePaystackReference } from "@/lib/verification-utils";

interface InitializeRenewalRequest {
  renewalSlug: string; // e.g., "forever-access"
  subscriptionId?: string; // Optional - will use user's active subscription if not provided
  currency: SupportedCurrency;
  callbackUrl?: string;
}

interface InitializeRenewalResponse {
  success: boolean;
  authorizationUrl?: string;
  reference?: string;
  paymentId?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        } as InitializeRenewalResponse,
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email || "";

    // Parse request body
    const body: InitializeRenewalRequest = await request.json();
    const { renewalSlug, subscriptionId, currency, callbackUrl } = body;

    // Validate required fields
    if (!renewalSlug || !currency) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: renewalSlug, currency",
        } as InitializeRenewalResponse,
        { status: 400 }
      );
    }

    // Validate currency
    const supportedCurrencies: SupportedCurrency[] = ["NGN", "USD", "GBP", "EUR"];
    if (!supportedCurrencies.includes(currency)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported currency. Supported: ${supportedCurrencies.join(", ")}`,
        } as InitializeRenewalResponse,
        { status: 400 }
      );
    }

    // Fetch renewal option from database
    const renewal = await prisma.renewal.findUnique({
      where: { slug: renewalSlug },
    });

    if (!renewal || !renewal.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: `Renewal option not found or inactive: ${renewalSlug}`,
        } as InitializeRenewalResponse,
        { status: 404 }
      );
    }

    // Find subscription to renew
    let subscription;
    if (subscriptionId) {
      subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId, userId },
        include: { plan: true },
      });
    } else {
      // Find user's most recent active or expiring subscription
      subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: {
            in: ["ACTIVE", "EXPIRED", "GRACE_PERIOD"],
          },
        },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          error: "No eligible subscription found for renewal",
        } as InitializeRenewalResponse,
        { status: 404 }
      );
    }

    // Check if subscription already has lifetime access
    if (subscription.renewalId) {
      return NextResponse.json(
        {
          success: false,
          error: "This subscription already has lifetime access",
        } as InitializeRenewalResponse,
        { status: 400 }
      );
    }

    // Get price in selected currency
    let priceInSelectedCurrency: number;
    if (currency === "NGN") {
      priceInSelectedCurrency = Number(renewal.priceNGN || 0);
    } else if (currency === "USD" && renewal.priceUSD) {
      priceInSelectedCurrency = Number(renewal.priceUSD);
    } else if (currency === "GBP" && renewal.priceGBP) {
      priceInSelectedCurrency = Number(renewal.priceGBP);
    } else if (currency === "EUR" && renewal.priceEUR) {
      priceInSelectedCurrency = Number(renewal.priceEUR);
    } else {
      // Fallback: Convert from NGN
      priceInSelectedCurrency = await convertCurrency(
        Number(renewal.priceNGN || 0),
        "NGN",
        currency
      );
    }

    if (priceInSelectedCurrency <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid renewal price",
        } as InitializeRenewalResponse,
        { status: 400 }
      );
    }

    // Calculate amount in NGN for record keeping
    const exchangeRate =
      currency === "NGN" ? 1 : priceInSelectedCurrency / Number(renewal.priceNGN || 1);
    const amountInNGN = Number(renewal.priceNGN || 0);

    // Generate unique Paystack reference
    const paystackReference = generatePaystackReference();

    // Create Payment record
    const payment = await prisma.payment.create({
      data: {
        amount: priceInSelectedCurrency,
        currency: renewal.currency,
        selectedCurrency: currency,
        exchangeRate,
        amountInNGN,
        paymentType: "RENEWAL",
        paystackReference,
        status: "PENDING",
        customerEmail: userEmail,
        customerName: session.user.name || undefined,
        subscriptionId: subscription.id,
        userId,
        planId: subscription.planId, // Keep reference to original plan
      },
    });

    // Initialize Paystack payment
    const amountInSmallestUnit = toSmallestUnit(priceInSelectedCurrency, currency);

    const paystackResponse = await initializePayment({
      email: userEmail,
      amount: amountInSmallestUnit,
      reference: paystackReference,
      currency,
      callbackUrl: callbackUrl,
      metadata: {
        paymentId: payment.id,
        userId,
        subscriptionId: subscription.id,
        renewalId: renewal.id,
        renewalSlug: renewal.slug,
        paymentType: "RENEWAL",
        description: `Forever Access Renewal - ${subscription.plan.name}`,
      },
    });

    if (!paystackResponse.status) {
      // Paystack initialization failed - update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          failedAt: new Date(),
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: paystackResponse.message || "Payment initialization failed",
        } as InitializeRenewalResponse,
        { status: 500 }
      );
    }

    // Update payment with Paystack details
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paystackAuthorizationUrl: paystackResponse.data.authorization_url,
        paystackAccessCode: paystackResponse.data.access_code,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId,
        entityType: "PAYMENT",
        entityId: payment.id,
        action: "CREATED",
        description: `Renewal payment initiated: ${renewal.name}`,
        metadata: {
          renewal: renewal.name,
          subscriptionId: subscription.id,
          amount: priceInSelectedCurrency,
          currency,
          reference: paystackReference,
        },
      },
    });

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackResponse.data.authorization_url,
      reference: paystackReference,
      paymentId: payment.id,
    } as InitializeRenewalResponse);
  } catch (error) {
    console.error("Renewal payment initialization error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      } as InitializeRenewalResponse,
      { status: 500 }
    );
  }
}
