/**
 * Paystack Payment Service
 *
 * Handles payment initialization, verification, and webhook validation
 * Supports NGN, USD, GBP (EUR via conversion)
 */

import crypto from "crypto";
import { SupportedCurrency } from "./currency-converter";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
const PAYSTACK_BASE_URL = "https://api.paystack.co";

// Currency codes that Paystack supports directly
type PaystackCurrency = "NGN" | "USD" | "GBP" | "ZAR" | "GHS" | "KES";

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, unknown>;
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: Record<string, unknown> | null;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string | null;
    };
  };
}

/**
 * Initialize a Paystack payment
 */
export async function initializePayment(params: {
  email: string;
  amount: number; // Amount in kobo/cents
  currency: SupportedCurrency;
  reference: string;
  metadata?: {
    planId?: string;
    planName?: string;
    planSlug?: string;
    userId?: string;
    userName?: string;
    selectedCurrency?: string;
    exchangeRate?: number;
    amountInNGN?: number;
    [key: string]: unknown;
  };
  callbackUrl?: string;
}): Promise<PaystackInitializeResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }

  // Map our currency to Paystack currency
  const paystackCurrency = mapToPaystackCurrency(params.currency);

  const payload = {
    email: params.email,
    amount: params.amount, // Smallest currency unit (kobo for NGN, cents for USD/GBP)
    currency: paystackCurrency,
    reference: params.reference,
    callback_url: params.callbackUrl,
    metadata: params.metadata || {},
  };

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Paystack API error: ${response.status}`);
    }

    const data: PaystackInitializeResponse = await response.json();

    if (!data.status) {
      throw new Error(data.message || "Payment initialization failed");
    }

    console.log("✅ Payment initialized:", data.data.reference);
    return data;
  } catch (error) {
    console.error("❌ Failed to initialize payment:", error);
    throw error;
  }
}

/**
 * Verify a Paystack payment
 */
export async function verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Paystack API error: ${response.status}`);
    }

    const data: PaystackVerifyResponse = await response.json();

    if (!data.status) {
      throw new Error(data.message || "Payment verification failed");
    }

    console.log("✅ Payment verified:", reference, "Status:", data.data.status);
    return data;
  } catch (error) {
    console.error("❌ Failed to verify payment:", error);
    throw error;
  }
}

/**
 * Validate Paystack webhook signature
 */
export function validateWebhookSignature(signature: string, body: string): boolean {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }

  const hash = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY).update(body).digest("hex");

  return hash === signature;
}

/**
 * Map our supported currencies to Paystack currencies
 * EUR is not directly supported by Paystack, so we convert to GBP/USD
 */
export function mapToPaystackCurrency(currency: SupportedCurrency): PaystackCurrency {
  switch (currency) {
    case "NGN":
      return "NGN";
    case "USD":
      return "USD";
    case "GBP":
      return "GBP";
    case "EUR":
      // Paystack doesn't support EUR, convert to GBP
      return "GBP";
    default:
      return "NGN";
  }
}

/**
 * Convert amount to smallest currency unit (kobo/cents)
 *
 * @param amount - The amount in main currency unit (e.g., 100.50)
 * @param currency - The currency type (NGN, USD, GBP, EUR)
 * @returns Amount in smallest unit (e.g., 10050 kobo/cents)
 */
export function toSmallestUnit(amount: number, currency: SupportedCurrency): number {
  // All supported currencies use 2 decimal places
  // NGN: kobo, USD: cents, GBP: pence, EUR: cents
  // Kept currency parameter for API clarity and future-proofing
  void currency; // Explicitly mark as intentionally unused
  return Math.round(amount * 100);
}

/**
 * Convert amount from smallest currency unit to main unit
 *
 * @param amount - The amount in smallest unit (e.g., 10050)
 * @param currency - The currency type (NGN, USD, GBP, EUR)
 * @returns Amount in main unit (e.g., 100.50)
 */
export function fromSmallestUnit(amount: number, currency: SupportedCurrency): number {
  // Divide by 100 and round to 2 decimal places
  // Kept currency parameter for API clarity and future-proofing
  void currency; // Explicitly mark as intentionally unused
  return Math.round(amount) / 100;
}

/**
 * Get Paystack public key
 */
export function getPaystackPublicKey(): string {
  if (!PAYSTACK_PUBLIC_KEY) {
    throw new Error("NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is not configured");
  }
  return PAYSTACK_PUBLIC_KEY;
}

/**
 * Check if using test mode
 */
export function isTestMode(): boolean {
  return PAYSTACK_PUBLIC_KEY.startsWith("pk_test_") || PAYSTACK_SECRET_KEY.startsWith("sk_test_");
}

/**
 * Format Paystack webhook event type
 */
export type PaystackEvent =
  | "charge.success"
  | "charge.failed"
  | "transfer.success"
  | "transfer.failed"
  | "subscription.create"
  | "subscription.disable";

export interface PaystackWebhookPayload {
  event: PaystackEvent;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, unknown>;
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string | null;
    };
    authorization?: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
    };
  };
}

/**
 * Parse Paystack webhook payload
 */
export function parseWebhookPayload(body: string): PaystackWebhookPayload {
  try {
    return JSON.parse(body) as PaystackWebhookPayload;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown parsing error";
    console.error("❌ Failed to parse webhook payload:", errorMsg);
    throw new Error("Invalid webhook payload");
  }
}

/**
 * Get payment status color for UI
 */
export function getPaymentStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "success":
      return "green";
    case "failed":
      return "red";
    case "pending":
      return "yellow";
    case "abandoned":
      return "gray";
    default:
      return "blue";
  }
}

/**
 * Get payment status label
 */
export function getPaymentStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case "success":
      return "Paid";
    case "failed":
      return "Failed";
    case "pending":
      return "Pending";
    case "abandoned":
      return "Abandoned";
    default:
      return "Unknown";
  }
}
