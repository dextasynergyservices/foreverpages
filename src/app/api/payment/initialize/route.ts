import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { convertCurrency, getExchangeRate, SupportedCurrency } from "@/lib/currency-converter";
import { initializePayment, toSmallestUnit, mapToPaystackCurrency } from "@/lib/paystack";
import { generatePaystackReference, generatePaymentSessionId } from "@/lib/verification-utils";

interface InitializePaymentRequest {
  planSlug: string;
  currency: SupportedCurrency;
  email: string;
  callbackUrl?: string;
}

interface InitializePaymentResponse {
  success: boolean;
  authorizationUrl?: string;
  reference?: string;
  paymentId?: string;
  sessionId?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is logged in (optional - for existing users)
    const session = await getServerSession(authOptions);
    let loggedInUserId: string | null = null;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      loggedInUserId = user?.id || null;
      console.log("💳 Payment initialization - Logged in user detected:", {
        userId: loggedInUserId,
        email: session.user.email,
      });
    } else {
      console.log("💳 Payment initialization - No logged in user (new signup flow)");
    }

    // Parse request body
    const body: InitializePaymentRequest = await request.json();
    const { planSlug, currency, email, callbackUrl } = body;

    // Validate required fields
    if (!planSlug || !currency || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: planSlug, currency, email",
        } as InitializePaymentResponse,
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format",
        } as InitializePaymentResponse,
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
        } as InitializePaymentResponse,
        { status: 400 }
      );
    }

    // Fetch plan from database
    const plan = await prisma.plan.findUnique({
      where: { slug: planSlug },
    });

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          error: `Plan not found: ${planSlug}`,
        } as InitializePaymentResponse,
        { status: 404 }
      );
    }

    // Get price in selected currency
    let priceInSelectedCurrency: number;
    if (currency === "NGN") {
      priceInSelectedCurrency = Number(plan.priceNGN);
    } else if (currency === "USD" && plan.priceUSD) {
      priceInSelectedCurrency = Number(plan.priceUSD);
    } else if (currency === "GBP" && plan.priceGBP) {
      priceInSelectedCurrency = Number(plan.priceGBP);
    } else if (currency === "EUR" && plan.priceEUR) {
      priceInSelectedCurrency = Number(plan.priceEUR);
    } else {
      // Fallback: Convert from NGN
      priceInSelectedCurrency = await convertCurrency(Number(plan.priceNGN), "NGN", currency);
    }

    // Get exchange rate and amount in NGN for record keeping
    const exchangeRate = await getExchangeRate(currency, "NGN");
    const amountInNGN =
      currency === "NGN"
        ? priceInSelectedCurrency
        : await convertCurrency(priceInSelectedCurrency, currency, "NGN");

    // Generate unique reference and session ID
    const reference = generatePaystackReference();
    const sessionId = generatePaymentSessionId();

    // Convert to smallest currency unit (kobo/cents)
    const amountInSmallestUnit = toSmallestUnit(priceInSelectedCurrency, currency);

    // Map currency to Paystack-supported currency
    const paystackCurrency = mapToPaystackCurrency(currency);

    // Create payment record
    // If user is logged in, include their userId (for existing users subscribing)
    // If not logged in, userId is null and will be updated after signup (new users)
    const payment = await prisma.payment.create({
      data: {
        paystackReference: reference,
        amount: priceInSelectedCurrency,
        currency,
        selectedCurrency: currency,
        exchangeRate,
        amountInNGN,
        status: "PENDING",
        paymentMethod: "PAYSTACK",
        customerEmail: email,
        planId: plan.id,
        userId: loggedInUserId, // Include userId if user is logged in
        paymentType: "INITIAL",
      },
    });

    // Initialize Paystack payment
    const paystackResponse = await initializePayment({
      email,
      amount: amountInSmallestUnit,
      currency: paystackCurrency as SupportedCurrency,
      reference,
      metadata: {
        planId: plan.id,
        planName: plan.name,
        planSlug,
        paymentId: payment.id,
        sessionId,
        selectedCurrency: currency,
        exchangeRate: exchangeRate,
        amountInNGN: amountInNGN,
      },
      callbackUrl: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
    });

    // Update payment with Paystack details
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paystackAuthorizationUrl: paystackResponse.data.authorization_url,
        paystackAccessCode: paystackResponse.data.access_code,
      },
    });

    console.log(`✅ Payment initialized: ${reference} for ${email}`);

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackResponse.data.authorization_url,
      reference,
      paymentId: payment.id,
      sessionId,
    } as InitializePaymentResponse);
  } catch (error) {
    console.error("❌ Payment initialization failed:", error);

    const errorMessage = error instanceof Error ? error.message : "Payment initialization failed";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      } as InitializePaymentResponse,
      { status: 500 }
    );
  }
}
